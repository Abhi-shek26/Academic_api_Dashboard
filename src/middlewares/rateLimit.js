import redisClient from '../config/redis.js';

const rateLimit = (limit, windowMs) => {
  return async (req, res, next) => {
    if (!redisClient) {
      console.warn('Redis not available. Bypassing rate limit.');
      return next();
    }

    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.ip; 
    const key = `rateLimit:${ip}`;

    try {
      const requests = await redisClient.incr(key);
      const ttl = await redisClient.pttl(key);

      if (requests === 1 || ttl < 0 ) {
        if (typeof windowMs === 'number' && windowMs > 0) {
          await redisClient.pexpire(key, windowMs);
        } else {
          console.error(`Invalid windowMs for rate limiting: "${windowMs}" (type: ${typeof windowMs}). Using default 60000ms.`);
          await redisClient.pexpire(key, 60000);
        }
      }

      if (requests > limit) {
        console.log(`IP ${ip} has exceeded rate limit (${requests} requests).`);
        return res.status(429).json({ message: 'Too many requests. Chill out and try again later.' });
      }

      next();
    } catch (err) {
      console.error('Rate limiting error:', err);
      next(); 
    }
  };
};

export default rateLimit;
