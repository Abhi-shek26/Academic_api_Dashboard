import express from 'express';
import cors from 'cors';
import routes from './routes/index.js';
import errorHandler from './middlewares/errorHandler.js';
import rateLimit from './middlewares/rateLimit.js';
import config from './config/index.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json()); 
app.use(express.urlencoded({ extended: true })); 

app.use('/api' , rateLimit(config.rateLimitMax, config.rateLimitWindowMs ));

// Routes
app.use('/api', routes);

// Error handling
app.use(errorHandler);

export default app;
