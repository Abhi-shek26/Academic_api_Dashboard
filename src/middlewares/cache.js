import redisClient, { isRedisReady } from '../config/redis.js';

// GET cache. Never 500s when Redis is down — it just bypasses the cache.
const cache = (duration) => {
  return async (req, res, next) => {
    if (req.method !== 'GET') return next();
    if (!redisClient || !isRedisReady()) return next();

    const key = `__express__${req.originalUrl || req.url}`;
    try {
      const cachedData = await redisClient.get(key);
      if (cachedData) {
        console.log(`Cache hit: ${key}`);
        res.setHeader('Content-Type', 'application/json');
        return res.send(cachedData);
      }

      console.log(`Cache miss: ${key}`);
      const originalSend = res.send.bind(res);
      res.send = (body) => {
        try {
          const payload = typeof body === 'string' ? body : JSON.stringify(body);
          // Fire-and-forget; a cache write failure must never break the response.
          redisClient.setex(key, duration, payload).catch((e) =>
            console.error('Redis cache write failed (non-fatal):', e.message)
          );
        } catch (e) {
          console.error('Cache serialize failed (non-fatal):', e.message);
        }
        return originalSend(body);
      };
      return next();
    } catch (err) {
      // Redis down / unreachable -> serve live data instead of 500.
      console.error('Cache middleware bypassed due to Redis error (non-fatal):', err.message);
      return next();
    }
  };
};

export default cache;
