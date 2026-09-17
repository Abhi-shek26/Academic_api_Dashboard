import express from 'express';
import chapterRoutes from './chapter.js';
import analyticsRoutes from './analytics.js';

const router = express.Router();

router.use('/chapters', chapterRoutes);
router.use('/analytics', analyticsRoutes);

export default router;
