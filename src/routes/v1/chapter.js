import express from 'express';
import chapterController from '../../controllers/chapter.js';
import adminAuth from '../../middlewares/auth.js';
import {upload} from '../../middlewares/fileUpload.js'; 
import cache from '../../middlewares/cache.js';

const router = express.Router();

// GET all chapters with caching and filtering
router.get('/', cache(3600), chapterController.getAllChapters); 

// GET a specific chapter by ID
router.get('/:id', chapterController.getChapterById);

// POST a new chapter (admin only)
router.post('/', adminAuth, upload.single('chapters'), chapterController.createChapter); 

export default router;
