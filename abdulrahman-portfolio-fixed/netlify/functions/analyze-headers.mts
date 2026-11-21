import { analyzeSecurityHeaders } from "../../src/lib/headerAnalyzer";

export default async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const targetUrl = body.url || body.targetUrl;
    if (!targetUrl || typeof targetUrl !== "string") {
      return new Response(JSON.stringify({ error: "Target URL is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    let parsedUrl = targetUrl.trim();
    if (!parsedUrl.startsWith("http://") && !parsedUrl.startsWith("https://")) {
      parsedUrl = `https://${parsedUrl}`;
    }

    let response: Response;
    try {
      response = await fetch(parsedUrl, {
        method: "HEAD",
        redirect: "follow",
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) CyberOpsAudit/1.0",
        },
      });
    } catch {
      response = await fetch(parsedUrl, {
        method: "GET",
        redirect: "follow",
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) CyberOpsAudit/1.0",
        },
      });
    }

    const headersMap: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      headersMap[key.toLowerCase()] = value;
    });

    const audit = analyzeSecurityHeaders(headersMap, parsedUrl, response.status);

    return new Response(JSON.stringify(audit), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=60",
      },
    });
  } catch (err: any) {
    console.error("[Netlify Header Analyzer Error]:", err.message);
    return new Response(JSON.stringify({ error: "Failed to probe host", message: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
