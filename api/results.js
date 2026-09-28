const { Redis } = require("@upstash/redis");

function auth(req) {
  const password = process.env.ADMIN_PASSWORD;
  const header = req.headers.authorization || "";
  return password && header === "Bearer " + password;
}

module.exports = async (req,res) => {
  if (req.method !== "GET") return res.status(405).json({error:"Method not allowed"});
  if (!auth(req)) return res.status(401).json({error:"Unauthorized"});
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN)
    return res.status(500).json({error:"Database chưa được cấu hình."});

  try {
    const redis = new Redis({
      url: process.env.KV_REST_API_URL,
      token: process.env.KV_REST_API_TOKEN
    });
    const results = await redis.lrange("luckywheel:results", 0, -1);
    return res.status(200).json(results || []);
  } catch(e) {
    console.error(e);
    return res.status(500).json({error:"Lỗi máy chủ."});
  }
};