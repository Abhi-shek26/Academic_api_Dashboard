import express from 'express';
import cors from 'cors';
import routes from './routes/index.js';
import errorHandler from './middlewares/errorHandler.js';
import rateLimit from './middlewares/rateLimit.js';
import config from './config/index.js';
import { ApiResponse } from './utils/apiResponse.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Render health check + friendly root (Render hits / and expects 200)
app.get('/', (req, res) => {
  res.status(200).json(new ApiResponse(200, { service: 'chapter-performance-api', status: 'ok' }, 'API is running'));
});
app.get('/health', (req, res) => {
  res.status(200).json(new ApiResponse(200, { status: 'ok', uptime: process.uptime() }, 'Healthy'));
});

app.use('/api', rateLimit(config.rateLimitMax, config.rateLimitWindowMs));

// Routes
app.use('/api', routes);

// 404 for unknown routes (must come before error handler)
app.use((req, res) => {
  res.status(404).json(new ApiResponse(404, null, `Route not found: ${req.method} ${req.originalUrl}`));
});

// Error handling (last)
app.use(errorHandler);

export default app;
