import Redis from 'ioredis';
import config from './index.js'; 

let redisClient;
if (!config.redisUrl) {
  console.error('Redis client will not be initialized.');
  redisClient = null; 
} else {
  try {
     redisClient = new Redis(config.redisUrl, {
     connectTimeout: 10000, 
    });

    redisClient.on('connect', () => {
      console.log('Successfully connected to Redis server.');
    });

      redisClient.on('ready', () => {
      console.log('Redis client is ready to use.');
    });

    redisClient.on('error', (err) => {
      console.error('Redis connection error:', err);
   });

    redisClient.on('close', () => {
      console.log('Redis connection closed.');
    });

    redisClient.on('reconnecting', (time) => {
      console.log(`Reconnecting to Redis in ${time} ms...`);
    });

    redisClient.on('end', () => {
      console.log('Redis connection ended. No more reconnections will be made.');
    });

  } catch (error) {
    console.error('Failed to synchronously initialize Redis client:', error);
    redisClient = null;
  }
}

export default redisClient;
