import express from 'express';
import chapterRoutes from './chapter.js';

const router = express.Router();

router.use('/chapters', chapterRoutes);

export default router;
