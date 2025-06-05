import app from './app.js';
import connectDB from './config/db.js';
import config from './config/index.js';

const startServer = async () => {
  try {
    await connectDB();
    app.listen(config.port, () => {
      console.log(`Server listening on port ${config.port}`);
    });
  } catch (error) {
    console.error('Server startup error:', error);
  }
};

startServer();
