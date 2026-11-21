export default async (req: Request) => {
  const forwarded = req.headers.get("x-forwarded-for") || req.headers.get("client-ip") || "";
  let clientIp = forwarded.split(",")[0].trim() || "127.0.0.1";
  
  if (clientIp === "::1" || clientIp === "::ffff:127.0.0.1") {
    clientIp = "127.0.0.1";
  }

  const userAgent = req.headers.get("user-agent") || "";
  const language = req.headers.get("accept-language") || "";

  return new Response(JSON.stringify({
    ip: clientIp,
    userAgent,
    language,
    timestamp: new Date().toISOString()
  }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
