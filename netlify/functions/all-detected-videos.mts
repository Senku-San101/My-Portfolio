import { getStore } from "@netlify/blobs";

export default async () => {
  try {
    const store = getStore("uploads");
    const list = await store.list({ prefix: "projects_video_" });
    const videoMap: Record<string, string> = {};

    for (const blob of list.blobs) {
      // Key format: projects_video_<projectId>_<timestamp>.<ext>
      const parts = blob.key.split('_');
      if (parts.length >= 3) {
        const projId = parts[2];
        if (projId && !videoMap[projId]) {
          videoMap[projId] = `/api/blobs/${encodeURIComponent(blob.key)}`;
        }
      }
    }

    return new Response(JSON.stringify(videoMap), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=60"
      }
    });
  } catch (err: any) {
    console.warn("Netlify all-detected-videos error:", err);
    return new Response(JSON.stringify({}), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  }
};
