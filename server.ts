import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import multer from "multer";
import fs from "fs";
import { GoogleGenAI } from "@google/genai";

// Safe __dirname and __filename for both ESM and CJS bundling
const __appFilename = typeof __filename !== "undefined" ? __filename : process.cwd();
const __appDirname = path.dirname(__appFilename);

// Initialize Gemini AI
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Use a predictable directory for uploads
  let uploadDir = path.join(process.cwd(), "public", "uploads");
  try {
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    // Test write access
    const testFile = path.join(uploadDir, ".write-test");
    fs.writeFileSync(testFile, "test");
    fs.unlinkSync(testFile);
    console.log(`Using persistent upload directory: ${uploadDir}`);
  } catch (err) {
    console.warn(`Persistent upload directory ${uploadDir} is not writable. Falling back to /tmp/uploads.`);
    uploadDir = path.join("/tmp", "uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
  }

  // Multer configuration for file uploads
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      // The user wants special filenames to avoid conflicts and "delete" (overwrite) old ones.
      // We can use a custom header or field to specify the target filename.
      let targetName = req.headers['x-target-filename'] as string;
      if (targetName) {
        try {
          targetName = decodeURIComponent(targetName);
        } catch (e) {
          console.error("Failed to decode target filename header:", e);
        }
        // Find existing files with that name (ignoring extension) and delete them
        const files = fs.readdirSync(uploadDir);
        const nameWithoutExt = targetName.split('.')[0];
        files.forEach(f => {
          if (f.startsWith(nameWithoutExt + '.')) {
            try { fs.unlinkSync(path.join(uploadDir, f)); } catch(e) {}
          }
        });
        cb(null, targetName);
      } else {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + "-" + file.originalname);
      }
    },
  });

  const upload = multer({ storage });

  app.use(express.json());

  // Debug middleware for API routes
  app.use("/api/*", (req, res, next) => {
    console.log(`[API DEBUG] ${req.method} ${req.originalUrl}`);
    next();
  });

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", mode: process.env.NODE_ENV || "development" });
  });

  // Serve uploads directory - try both persistent and fallback
  // This must be BEFORE Vite middleware
  app.use("/uploads", express.static(path.join(process.cwd(), "public", "uploads")));
  app.use("/uploads", (req, res, next) => {
    // Also try the active uploadDir which might be /tmp
    express.static(uploadDir)(req, res, next);
  });
  
  // Alias /api/blobs to /uploads for local development consistency with Netlify Blobs setup
  app.use("/api/blobs", express.static(path.join(process.cwd(), "public", "uploads")));
  app.use("/api/blobs", (req, res, next) => {
    express.static(uploadDir)(req, res, next);
  });

  // API Route for uploading images and files
  app.post("/api/upload", (req, res, next) => {
    console.log("POST /api/upload request received");
    upload.any()(req, res, (err) => {
      if (err) {
        console.error("Multer upload error:", err);
        return res.status(500).json({ error: err.message || "Upload failed during processing" });
      }
      
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        console.warn("Upload failed: No files found in request");
        return res.status(400).json({ error: "No file uploaded" });
      }
      
      const file = files[0];
      console.log(`Successfully uploaded: ${file.filename}`);
      // Return the URL - use /api/blobs/ for consistency with Netlify Blobs setup
      // Add a timestamp parameter ?v=... to forcefully bust browser cache upon new uploads
      const fileUrl = `/api/blobs/${file.filename}?v=${Date.now()}`;
      res.json({ url: fileUrl });
    });
  });

  app.get("/api/analytics/blobs", (req, res) => {
    try {
      const files = fs.readdirSync(uploadDir);
      let totalSize = 0;
      files.forEach(file => {
        const stats = fs.statSync(path.join(uploadDir, file));
        if (stats.isFile()) {
          totalSize += stats.size;
        }
      });
      
      // Netlify Blobs Free Tier is usually 5GB, but let's be conservative or use 1GB
      const limit = 5 * 1024 * 1024 * 1024; // 5GB in bytes
      
      res.json({
        fileCount: files.length,
        usedBytes: totalSize,
        totalBytes: limit,
        usedPercentage: (totalSize / limit) * 100
      });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to read blob storage", message: error.message });
    }
  });

  app.post("/api/settings/social-preview", async (req, res) => {
    try {
      const { title, description, image } = req.body;
      const indexPath = path.join(process.cwd(), "index.html");
      
      if (!fs.existsSync(indexPath)) {
        return res.status(404).json({ error: "index.html not found" });
      }

      let html = fs.readFileSync(indexPath, "utf8");

      // Format image URL - make it absolute
      let formattedImage = image || "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1200&h=630&q=80";
      if (formattedImage.startsWith("/")) {
        formattedImage = `https://abdulrahmankamal.netlify.app${formattedImage}`;
      }

      const formattedTitle = title || "Abdulrahman Kamal | Cybersecurity Engineer";
      const formattedDescription = description || "Portfolio of Abdulrahman Kamal, a Cybersecurity Engineer specializing in SOC analysis, digital forensics, and secure Linux engineering.";

      // 1. Replace <title>
      html = html.replace(/<title>[^]*?<\/title>/, `<title>${formattedTitle}</title>`);

      // 2. Replace meta description
      html = html.replace(/<meta name="description" content="[^]*?" \/>/, `<meta name="description" content="${formattedDescription}" />`);

      // 3. Replace og:title
      html = html.replace(/<meta property="og:title" content="[^]*?" \/>/, `<meta property="og:title" content="${formattedTitle}" />`);

      // 4. Replace og:description
      html = html.replace(/<meta property="og:description" content="[^]*?" \/>/, `<meta property="og:description" content="${formattedDescription}" />`);

      // 5. Replace og:image
      html = html.replace(/<meta property="og:image" content="[^]*?" \/>/, `<meta property="og:image" content="${formattedImage}" />`);

      // 6. Replace twitter:title
      html = html.replace(/<meta name="twitter:title" content="[^]*?" \/>/, `<meta name="twitter:title" content="${formattedTitle}" />`);

      // 7. Replace twitter:description
      html = html.replace(/<meta name="twitter:description" content="[^]*?" \/>/, `<meta name="twitter:description" content="${formattedDescription}" />`);

      // 8. Replace twitter:image
      html = html.replace(/<meta name="twitter:image" content="[^]*?" \/>/, `<meta name="twitter:image" content="${formattedImage}" />`);

      fs.writeFileSync(indexPath, html, "utf8");
      console.log("[Social Preview] Updated index.html with new social preview tags");

      // Also update dist/index.html if it exists
      const distIndexPath = path.join(process.cwd(), "dist", "index.html");
      if (fs.existsSync(distIndexPath)) {
        let distHtml = fs.readFileSync(distIndexPath, "utf8");
        distHtml = distHtml.replace(/<title>[^]*?<\/title>/, `<title>${formattedTitle}</title>`);
        distHtml = distHtml.replace(/<meta name="description" content="[^]*?" \/>/, `<meta name="description" content="${formattedDescription}" />`);
        distHtml = distHtml.replace(/<meta property="og:title" content="[^]*?" \/>/, `<meta property="og:title" content="${formattedTitle}" />`);
        distHtml = distHtml.replace(/<meta property="og:description" content="[^]*?" \/>/, `<meta property="og:description" content="${formattedDescription}" />`);
        distHtml = distHtml.replace(/<meta property="og:image" content="[^]*?" \/>/, `<meta property="og:image" content="${formattedImage}" />`);
        distHtml = distHtml.replace(/<meta name="twitter:title" content="[^]*?" \/>/, `<meta name="twitter:title" content="${formattedTitle}" />`);
        distHtml = distHtml.replace(/<meta name="twitter:description" content="[^]*?" \/>/, `<meta name="twitter:description" content="${formattedDescription}" />`);
        distHtml = distHtml.replace(/<meta name="twitter:image" content="[^]*?" \/>/, `<meta name="twitter:image" content="${formattedImage}" />`);
        fs.writeFileSync(distIndexPath, distHtml, "utf8");
        console.log("[Social Preview] Also updated dist/index.html with new tags");
      }

      res.json({ success: true });
    } catch (error: any) {
      console.error("Failed to update social preview tags in index.html:", error);
      res.status(500).json({ error: "Failed to update social preview", message: error.message });
    }
  });

  app.post("/api/chat", async (req, res) => {
    try {
      const { message, history, profileData, customInstructions, geminiApiKey } = req.body;
      
      // Dynamically use the custom API key if provided, otherwise fall back to the system key
      let activeAi = ai;
      if (geminiApiKey && geminiApiKey.trim() !== "") {
        console.log("[Chat Route] Using custom Gemini API Key provided by settings");
        activeAi = new GoogleGenAI({
          apiKey: geminiApiKey.trim(),
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            }
          }
        });
      } else {
        console.log("[Chat Route] Using default system-wide Gemini API Key");
      }
      
      const baseInstruction = `
You are a helpful AI assistant representing ${profileData?.name || 'Abdulrahman Kamal'}, a professional in Cybersecurity and Technology (SOC Analysis, Digital Forensics, Linux Engineering).
Your goal is to answer questions from visitors about their professional background, skills, projects, and custom service offerings.

About ${profileData?.name || 'Abdulrahman Kamal'}:
- Title: ${profileData?.title || 'Cybersecurity Engineer'}
- Bio: ${profileData?.bio || 'Cybersecurity Engineer focused on SOC, Forensics, and Linux.'}
- Contact Location: ${profileData?.location || 'Yemen'}
- Email: ${profileData?.email || ''}

Core Directives:
1. Be professional, polite, and helpful.
2. Keep your answers concise, informative, and relevant.
3. If asked about something not in the profile or relevant context, suggest they contact the owner via the contact form on the About page.
`;

      const systemInstruction = customInstructions 
        ? `${baseInstruction}\n\nAdditional Operational Guidelines and Context from Abdulrahman (Crucial - Must Obey):\n${customInstructions}`
        : `${baseInstruction}\n\n4. Use a professional, slightly technical yet accessible tone.`;

      const chat = activeAi.chats.create({
        model: "gemini-3-flash-preview",
        config: {
          systemInstruction: systemInstruction,
        },
        history: history || [],
      });

      const result = await chat.sendMessage({ message });
      res.json({ text: result.text });
    } catch (error: any) {
      console.error("Gemini Chat Error:", error);
      res.status(500).json({ error: "Failed to generate response", message: error.message });
    }
  });

  // Basic error handler to ensure we always return JSON for API errors
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (req.path.startsWith('/api/')) {
      console.error("API Error Handler reached:", err);
      return res.status(500).json({
        error: "Internal Server Error",
        message: err.message
      });
    }
    next(err);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
