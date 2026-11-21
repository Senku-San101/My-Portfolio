import fs from "fs";
import path from "path";
import { initializeApp } from "firebase/app";
import { initializeFirestore, doc, getDoc } from "firebase/firestore";

async function main() {
  console.log("🚀 Starting Social Preview Meta Tags Pre-Compilation...");
  
  const distIndex = path.join(process.cwd(), "dist", "index.html");
  if (!fs.existsSync(distIndex)) {
    console.warn("⚠️ dist/index.html not found. Skipping tag pre-compilation.");
    return;
  }

  // Load firebase configuration
  let firebaseConfig;
  try {
    const configPath = path.join(process.cwd(), "firebase-applet-config.json");
    if (!fs.existsSync(configPath)) {
      console.warn("⚠️ firebase-applet-config.json not found. Skipping.");
      return;
    }
    firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));
  } catch (err) {
    console.warn("⚠️ Failed to parse firebase configuration:", err.message);
    return;
  }

  try {
    console.log("🔌 Connecting to Firestore...");
    const app = initializeApp(firebaseConfig);
    const db = initializeFirestore(app, {
      experimentalForceLongPolling: true,
    }, firebaseConfig.firestoreDatabaseId || "(default)");
    
    // Fetch settings/config document
    const docRef = doc(db, "settings", "config");
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      console.log("ℹ️ No social settings found in settings/config Firestore. Using default tags.");
      return;
    }

    const data = docSnap.data();
    const title = data.socialTitle || "Abdulrahman Kamal | Cybersecurity Engineer";
    const description = data.socialDescription || "The best portfolio 👌🏻";
    const image = data.socialImage || "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1200&h=630&q=80";

    // Convert relative paths to fully-qualified absolute URLs for social platforms
    let finalImage = image;
    if (finalImage.startsWith("/")) {
      finalImage = `https://abdulrahmankamal.netlify.app${finalImage}`;
    }

    console.log("📝 Found Social Preview settings in Firestore:");
    console.log(`   - Title: "${title}"`);
    console.log(`   - Description: "${description}"`);
    console.log(`   - Image: "${image}" (Resolved as: "${finalImage}")`);

    let html = fs.readFileSync(distIndex, "utf8");

    // Replace <title>
    html = html.replace(/<title>[^]*?<\/title>/gi, `<title>${title}</title>`);
    
    // Replace <meta name="description" ...>
    html = html.replace(/<meta\s+name="description"\s+content="[^]*?"\s*\/?>/gi, `<meta name="description" content="${description}" />`);

    // Replace Open Graph / Facebook tags
    html = html.replace(/<meta\s+property="og:title"\s+content="[^]*?"\s*\/?>/gi, `<meta property="og:title" content="${title}" />`);
    html = html.replace(/<meta\s+property="og:description"\s+content="[^]*?"\s*\/?>/gi, `<meta property="og:description" content="${description}" />`);
    html = html.replace(/<meta\s+property="og:image"\s+content="[^]*?"\s*\/?>/gi, `<meta property="og:image" content="${finalImage}" />`);

    // Replace Twitter tags
    html = html.replace(/<meta\s+name="twitter:title"\s+content="[^]*?"\s*\/?>/gi, `<meta name="twitter:title" content="${title}" />`);
    html = html.replace(/<meta\s+name="twitter:description"\s+content="[^]*?"\s*\/?>/gi, `<meta name="twitter:description" content="${description}" />`);
    html = html.replace(/<meta\s+name="twitter:image"\s+content="[^]*?"\s*\/?>/gi, `<meta name="twitter:image" content="${finalImage}" />`);

    fs.writeFileSync(distIndex, html, "utf8");
    console.log("✨ Beautifully pre-compiled all social preview tags inside dist/index.html!");
  } catch (error) {
    console.warn("⚠️ An error occurred during pre-compilation of social tags:", error.message);
    console.log("ℹ️ Gracefully continuing build process without modifications.");
  } finally {
    // Force exit in case Firestore keeps connection open
    process.exit(0);
  }
}

main();
