import redisClient from '../config/redis.js';

const cache = (duration) => {
  return async (req, res, next) => {
    const key = `__express__${req.originalUrl}` || req.url;
    try {
      const cachedData = await redisClient.get(key);

      if (cachedData) {
        console.log('Cache hit');
        const result = JSON.parse(cachedData);
        res.send(result);
      } else {
        console.log('Cache miss');
        res.sendResponse = res.send;
        res.send = (body) => {
          redisClient.setex(key, duration, JSON.stringify(body));
          res.sendResponse(body);
        };
        next();
      }
    } catch (err) {
      console.error(err);
      next(err);
    }
  };
};

export default cache;
