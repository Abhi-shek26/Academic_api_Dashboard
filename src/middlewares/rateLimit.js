import redisClient from '../config/redis.js';

const rateLimit = (limit, windowMs) => {
  return async (req, res, next) => {
    if (!redisClient) {
       console.warn('Redis client not available, bypassing rate limit.');
        return next();
    }

    const ip = req.ip; 
    const key = `rateLimit:${ip}`;

    try {
      const requests = await redisClient.incr(key);

      if (requests === 1) {
        // Ensure windowMs is a positive integer
        if (typeof windowMs === 'number' && windowMs > 0) {
          await redisClient.pexpire(key, windowMs);
        } else {
          // Fallback or log an error if windowMs is invalid
          console.error(`Invalid windowMs for rate limiting: "${windowMs}" (type: ${typeof windowMs}). Using default 60000ms.`);
          await redisClient.pexpire(key, 60000); 
        }
      }

      if (requests > limit) {
        return res.status(429).json({ message: 'Too many requests, please try again later.' });
      }

      next();
    } catch (err) {
      console.error('Error in rate limiting middleware:', err);
     next(); 
     }
  };
};

export default rateLimit;
