import app from './app.js';
import connectDB from './config/db.js';
import config from './config/index.js';

const startServer = async () => {
  try {
    if (!config.mongoUri) {
      console.error('FATAL: MONGODB_URI is not set. Set it in Render > Environment.');
      process.exit(1);
    }
    await connectDB();
    const server = app.listen(config.port, '0.0.0.0', () => {
      console.log(`Server listening on port ${config.port} (${config.nodeEnv})`);
    });

    const shutdown = (signal) => {
      console.log(`Received ${signal}. Shutting down gracefully...`);
      server.close(() => process.exit(0));
      setTimeout(() => process.exit(1), 10000).unref();
    };
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    console.error('Server startup error:', error);
    process.exit(1);
  }
};

process.on('unhandledRejection', (err) => {
  console.error('Unhandled promise rejection:', err);
});

startServer();
