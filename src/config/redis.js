import Redis from 'ioredis';
import config from './index.js';

// Redis is OPTIONAL. The API must work on Render even when REDIS_URL
// is missing, expired (old redislabs endpoint), or unreachable.
// All consumers must check `isRedisReady()` / guard for null.

let redisClient = null;

if (!config.redisUrl) {
  console.warn('REDIS_URL not set. Caching and Redis rate-limiting are disabled; API will run without Redis.');
} else {
  try {
    redisClient = new Redis(config.redisUrl, {
      connectTimeout: 5000,
      // Fail fast instead of queuing commands forever while Render
      // tries to reach a dead Redis endpoint.
      enableOfflineQueue: false,
      maxRetriesPerRequest: 2,
      retryStrategy: (times) => {
        // Stop retrying after ~5 attempts so the app stays responsive.
        if (times > 5) {
          console.error('Redis retry limit reached. Running without Redis.');
          return null;
        }
        return Math.min(times * 200, 2000);
      },
      lazyConnect: false,
    });

    redisClient.on('connect', () => {
      console.log('Successfully connected to Redis server.');
    });

    redisClient.on('ready', () => {
      console.log('Redis client is ready to use.');
    });

    redisClient.on('error', (err) => {
      console.error('Redis connection error (non-fatal, API continues without cache):', err.message);
    });

    redisClient.on('close', () => {
      console.log('Redis connection closed.');
    });

    redisClient.on('end', () => {
      console.log('Redis connection ended.');
    });
  } catch (error) {
    console.error('Failed to initialize Redis client (non-fatal):', error.message);
    redisClient = null;
  }
}

export const isRedisReady = () => !!redisClient && redisClient.status === 'ready';

export default redisClient;
