import redisClient, { isRedisReady } from '../config/redis.js';

// In-memory fallback so rate limiting still works on Render when Redis is absent.
const memoryStore = new Map();

const pruneMemory = (now, windowMs) => {
  for (const [key, entry] of memoryStore) {
    if (now - entry.start > windowMs) memoryStore.delete(key);
  }
};

setInterval(() => pruneMemory(Date.now(), 60000), 60000).unref?.();

const rateLimit = (limit, windowMs) => {
  const safeLimit = typeof limit === 'number' && limit > 0 ? limit : 30;
  const safeWindow = typeof windowMs === 'number' && windowMs > 0 ? windowMs : 60000;

  return async (req, res, next) => {
    // Skip Redis-backed limiting unless Redis is actually ready.
    if (!redisClient || !isRedisReady()) {
      try {
        const ip =
          req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
          req.ip ||
          req.connection?.remoteAddress ||
          'unknown';
        const key = `rateLimit:${ip}`;
        const now = Date.now();
        const entry = memoryStore.get(key);
        if (!entry || now - entry.start > safeWindow) {
          memoryStore.set(key, { count: 1, start: now });
          return next();
        }
        entry.count += 1;
        if (entry.count > safeLimit) {
          return res.status(429).json({ message: 'Too many requests. Chill out and try again later.' });
        }
        return next();
      } catch {
        return next();
      }
    }

    const ip =
      req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      req.ip ||
      req.connection?.remoteAddress ||
      'unknown';
    const key = `rateLimit:${ip}`;

    try {
      const requests = await redisClient.incr(key);
      if (requests === 1) {
        await redisClient.pexpire(key, safeWindow);
      }
      if (requests > safeLimit) {
        console.log(`IP ${ip} has exceeded rate limit (${requests} requests).`);
        return res.status(429).json({ message: 'Too many requests. Chill out and try again later.' });
      }
      return next();
    } catch (err) {
      // Redis hiccup -> allow the request instead of 500ing.
      console.error('Rate limiting bypassed due to Redis error (non-fatal):', err.message);
      return next();
    }
  };
};

export default rateLimit;
