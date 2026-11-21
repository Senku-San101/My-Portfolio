import { getStore } from "@netlify/blobs";

export default async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const formData = await req.formData();
    
    // Support all possible media field names: 'video', 'file', 'image', 'media'
    let file = (
      formData.get("video") ||
      formData.get("file") ||
      formData.get("image") ||
      formData.get("media")
    ) as File | null;

    // Fallback: loop through all formData entries to find the uploaded File
    if (!file || typeof file === "string" || !file.name) {
      for (const [_, val] of formData.entries()) {
        if (val && typeof val === "object" && "name" in val && "arrayBuffer" in val) {
          file = val as File;
          break;
        }
      }
    }

    if (!file) {
      return new Response(JSON.stringify({ error: "No file found in request form data." }), { 
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Extract and decode target filename header if provided
    let targetFilename = req.headers.get("x-target-filename") || undefined;
    if (targetFilename) {
      try {
        targetFilename = decodeURIComponent(targetFilename);
      } catch (e) {
        // Keep raw string if decode fails
      }
    }

    // Connect to the 'uploads' Netlify Blobs store
    const store = getStore("uploads");
    
    // Determine the safe storage key
    const extension = file.name.split('.').pop()?.toLowerCase() || 'bin';
    const filename = targetFilename || `${Date.now()}-${Math.round(Math.random() * 1e9)}-${file.name}`;

    // Determine correct content type with fallback
    let contentType = file.type;
    if (!contentType || contentType === "application/octet-stream") {
      if (extension === "mp4") contentType = "video/mp4";
      else if (extension === "webm") contentType = "video/webm";
      else if (extension === "mov") contentType = "video/quicktime";
      else if (extension === "ogg") contentType = "video/ogg";
      else if (extension === "m4v") contentType = "video/x-m4v";
      else if (extension === "mkv") contentType = "video/x-matroska";
      else if (extension === "png") contentType = "image/png";
      else if (extension === "jpg" || extension === "jpeg") contentType = "image/jpeg";
      else if (extension === "pdf") contentType = "application/pdf";
      else contentType = "application/octet-stream";
    }

    // If target filename was provided, prune any older files with matching prefix to avoid clutter
    if (targetFilename) {
      try {
        const prefix = targetFilename.split('.')[0];
        const list = await store.list({ prefix });
        for (const blob of list.blobs) {
          if (blob.key !== filename) {
            await store.delete(blob.key);
          }
        }
      } catch (pruneErr) {
        console.warn("Prune older blobs warning:", pruneErr);
      }
    }

    // Store binary data in Netlify Blobs
    const buffer = await file.arrayBuffer();
    await store.set(filename, buffer, {
      metadata: {
        contentType,
        originalName: file.name,
        size: buffer.byteLength,
        uploadedAt: new Date().toISOString()
      }
    });

    // Return the public blob URL with cache-busting timestamp
    const url = `/api/blobs/${encodeURIComponent(filename)}?v=${Date.now()}`;

    return new Response(JSON.stringify({ url, filename }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Netlify Blobs upload error:", error);
    return new Response(JSON.stringify({ 
      error: error.message || "Failed to process media upload in Netlify function." 
    }), { 
      status: 500, 
      headers: { "Content-Type": "application/json" }
    });
  }
};
