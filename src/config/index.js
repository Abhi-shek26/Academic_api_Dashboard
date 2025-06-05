import dotenv from 'dotenv';
dotenv.config();

const getEnvInt = (varName, defaultValue) => {
  const envValue = process.env[varName];
  if (envValue !== undefined) {
    const parsed = parseInt(envValue, 10); 
    if (!isNaN(parsed)) { 
      return parsed;
    } else {
      console.warn(`Environment variable "${varName}" is not a valid integer. Using default value: ${defaultValue}.`);
    }
  }
  return defaultValue;
};

const config = {
  port: process.env.PORT,
  mongoUri: process.env.MONGODB_URI ,
  redisUrl: process.env.REDIS_URL ,
  adminApiKey: process.env.ADMIN_API_KEY ,
  rateLimitMax: getEnvInt('RATE_LIMIT_MAX', 30),
  rateLimitWindowMs: getEnvInt('RATE_LIMIT_WINDOW_MS', 60000),
};

export default config;
