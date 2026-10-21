import { getStore } from "@netlify/blobs";

export default async (req: Request) => {
  const url = new URL(req.url);
  // Extract filename from path like /api/blobs/filename.jpg
  const segments = url.pathname.split('/');
  const filename = segments[segments.length - 1];

  if (!filename) {
    return new Response("Not found", { status: 404 });
  }

  try {
    const store = getStore("uploads");
    const blob = await store.get(filename, { type: "stream" });

    if (!blob) {
      return new Response("File not found", { status: 404 });
    }

    // Attempt to get the content type from metadata if we stored it
    const metadata = await store.getMetadata(filename);
    const contentType = metadata?.metadata?.contentType || "application/octet-stream";

    return new Response(blob, {
      headers: {
        "Content-Type": contentType as string,
        "Cache-Control": "public, max-age=31536000",
      },
    });
  } catch (error) {
    console.error("Serve blob error:", error);
    return new Response("Internal server error", { status: 500 });
  }
};
