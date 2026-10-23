import { getStore } from "@netlify/blobs";

export default async (req: Request) => {
  const url = new URL(req.url);
  // Extract filename from path like /api/blobs/filename.mp4
  const segments = url.pathname.split('/');
  const rawSegment = segments[segments.length - 1];

  if (!rawSegment) {
    return new Response("Not found", { status: 404 });
  }

  let filename = rawSegment.split('?')[0];
  try {
    filename = decodeURIComponent(filename);
  } catch (e) {
    // Keep raw filename if decoding fails
  }

  try {
    const store = getStore("uploads");
    const blob = await store.get(filename, { type: "stream" });

    if (!blob) {
      return new Response("File not found in Netlify Blobs storage", { status: 404 });
    }

    // Determine content type: check extension first, then metadata
    const ext = filename.split('.').pop()?.toLowerCase();
    let contentType = "application/octet-stream";
    if (ext === 'mp4') contentType = 'video/mp4';
    else if (ext === 'webm') contentType = 'video/webm';
    else if (ext === 'mov') contentType = 'video/quicktime';
    else if (ext === 'ogg') contentType = 'video/ogg';
    else if (ext === 'm4v') contentType = 'video/x-m4v';
    else if (ext === 'mkv') contentType = 'video/x-matroska';
    else if (ext === 'png') contentType = 'image/png';
    else if (ext === 'jpg' || ext === 'jpeg') contentType = 'image/jpeg';
    else if (ext === 'pdf') contentType = 'application/pdf';
    else if (ext === 'svg') contentType = 'image/svg+xml';
    else {
      try {
        const metadata = await store.getMetadata(filename);
        if (metadata?.metadata?.contentType) {
          contentType = String(metadata.metadata.contentType);
        }
      } catch (e) {}
    }

    return new Response(blob, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Accept-Ranges": "bytes",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error: any) {
    console.error("Serve blob error:", error);
    return new Response("Internal server error: " + (error?.message || "Storage read error"), { status: 500 });
  }
};
