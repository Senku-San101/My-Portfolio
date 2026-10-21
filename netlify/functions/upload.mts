import { getStore } from "@netlify/blobs";

export default async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const formData = await req.formData();
    const file = (formData.get("image") || formData.get("file")) as File;
    const targetFilename = req.headers.get("x-target-filename");

    if (!file) {
      return new Response(JSON.stringify({ error: "No file scanned/uploaded" }), { 
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Connect to the 'uploads' store
    const store = getStore("uploads");
    
    // Determine the filename
    const filename = targetFilename || `${Date.now()}-${file.name}`;
    
    // Store the binary data
    await store.set(filename, await file.arrayBuffer(), {
      metadata: {
        contentType: file.type,
        originalName: file.name
      }
    });

    // In a real Netlify environment, once a file is in Blobs, 
    // you can serve it via a function or a specialized URL.
    // To make it "publicly accessible" as the user requested, 
    // we return a URL that we will later configure in netlify.toml 
    // to be served by another function or a direct blob access if available.
    
    // However, for Netlify Blobs to be truly public like a CDN, 
    // we often use a proxy function.
    // Return path that the client can use, with a timestamp to bust the browser cache on change
    const url = `/api/blobs/${filename}?v=${Date.now()}`;

    return new Response(JSON.stringify({ url }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Upload error:", error);
    return new Response(JSON.stringify({ error: error.message || "Upload failed" }), { 
      status: 500, 
      headers: { "Content-Type": "application/json" }
    });
  }
};
