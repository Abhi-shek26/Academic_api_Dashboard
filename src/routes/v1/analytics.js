import express from 'express';
import analyticsController from '../../controllers/analytics.js';
import cache from '../../middlewares/cache.js';

const router = express.Router();

// Cached — analytics queries are aggregation-heavy
router.get('/summary', cache(1800), analyticsController.getSummary);
router.get('/trends', cache(1800), analyticsController.getTrends);
router.get('/recommendations', cache(900), analyticsController.getRecommendations);

export default router;
