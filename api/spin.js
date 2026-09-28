const { Redis } = require("@upstash/redis");

const prizes = [
  "DIP",
  "SMT",
  "SMT",
  "SMT",
  "FINAL"
];

function getRedis() {
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) return null;
  return new Redis({
    url: process.env.KV_REST_API_URL,
    token: process.env.KV_REST_API_TOKEN
  });
}

function cleanName(name) {
  return String(name || "").trim().replace(/\s+/g, " ").slice(0, 60);
}

function keyFor(name) {
  return "luckywheel:name:" + name.toLowerCase();
}

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({error:"Method not allowed"});

  try {
    const name = cleanName(req.body?.name);
    if (!name) return res.status(400).json({error:"Vui lòng nhập tên."});

    const redis = getRedis();
    if (!redis) {
      return res.status(500).json({
        error:"Chưa kết nối database. Hãy cấu hình KV_REST_API_URL và KV_REST_API_TOKEN trên Vercel."
      });
    }

    const key = keyFor(name);
    const existing = await redis.get(key);
    if (existing) {
      return res.status(409).json({
        error:"Tên này đã quay rồi.",
        prize: existing.prize,
        index: existing.index
      });
    }

    const index = Math.floor(Math.random() * prizes.length);
    const record = {
      name,
      prize: prizes[index],
      index,
      createdAt: new Date().toISOString()
    };

    // SETNX makes the one-spin-per-name check atomic.
    const saved = await redis.set(key, record, {nx:true});
    if (saved !== "OK" && saved !== true) {
      const old = await redis.get(key);
      return res.status(409).json({
        error:"Tên này đã quay rồi.",
        prize: old?.prize,
        index: old?.index
      });
    }

    await redis.lpush("luckywheel:results", record);
    return res.status(200).json(record);
  } catch (e) {
    console.error(e);
    return res.status(500).json({error:"Lỗi máy chủ."});
  }
};