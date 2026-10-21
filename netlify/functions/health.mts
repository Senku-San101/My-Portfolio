export default async (req: Request) => {
  return new Response(JSON.stringify({ 
    status: "ok", 
    mode: process.env.NODE_ENV || "production",
    platform: "netlify"
  }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
