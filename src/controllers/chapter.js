import Chapter from '../models/chapter.js';
import redisClient, { isRedisReady } from '../config/redis.js';
import { asyncHandler } from '../utils/helpers.js';
import { ApiResponse } from '../utils/apiResponse.js';

const invalidateChapterListCache = async () => {
  if (!redisClient || !isRedisReady()) return;
  try {
    // Delete all cached chapter-list responses (keys vary by query string).
    if (typeof redisClient.keys === 'function') {
      const keys = await redisClient.keys('__express__/api/v1/chapters*');
      if (keys.length > 0) await redisClient.del(...keys);
    }
  } catch (err) {
    console.error('Cache invalidation failed (non-fatal):', err.message);
  }
};

const chapterController = {
  getAllChapters: asyncHandler(async (req, res) => {
    const { class: classFilter, unit, status, weakChapters, subject, chapter } = req.query;
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 100);
    const allowedSort = ['chapter', 'subject', 'class', 'unit', 'status', 'questionSolved', 'createdAt'];
    const sortBy = allowedSort.includes(req.query.sortBy) ? req.query.sortBy : 'chapter';
    const sortOrder = req.query.order === 'desc' ? -1 : 1;

    const filter = {};
    if (classFilter) filter.class = classFilter;
    if (unit) filter.unit = unit;
    if (status) filter.status = status;
    if (subject) filter.subject = subject;
    if (chapter) filter.chapter = { $regex: chapter, $options: 'i' }; // Case-insensitive search
    // Schema field is `isWeakChapter` (boolean); accept ?isWeakChapter=true or legacy ?weakChapters=true
    const weakFlag = req.query.isWeakChapter ?? weakChapters;
    if (weakFlag !== undefined) {
      if (weakFlag === 'true' || weakFlag === 'false') {
        filter.isWeakChapter = weakFlag === 'true';
      } else if (Array.isArray(weakFlag)) {
        // Legacy array form: presence means filter weak chapters
        filter.isWeakChapter = true;
      }
    }

    const skip = (page - 1) * limit;

    const [chapters, totalChapters] = await Promise.all([
      Chapter.find(filter).sort({ [sortBy]: sortOrder }).skip(skip).limit(limit).lean(),
      Chapter.countDocuments(filter),
    ]);

    const responseData = {
      chapters,
      totalChapters,
      currentPage: page,
      totalPages: Math.ceil(totalChapters / limit),
    };

    res.status(200).json(new ApiResponse(200, responseData, 'Chapters retrieved successfully'));
  }),

  getChapterById: asyncHandler(async (req, res) => {
    const chapter = await Chapter.findById(req.params.id).lean();
    if (!chapter) {
      return res.status(404).json(new ApiResponse(404, null, 'Chapter not found'));
    }
    res.status(200).json(new ApiResponse(200, chapter, 'Chapter retrieved successfully'));
  }),

  createChapter: asyncHandler(async (req, res) => {
    let chaptersData;

    // Case 1: File Upload
    if (req.file) {
      console.log('Handling file upload...');
      const fileContent = req.file.buffer.toString('utf-8');
      try {
        chaptersData = JSON.parse(fileContent);
        if (!Array.isArray(chaptersData)) {
          return res.status(400).json(new ApiResponse(400, null, 'Invalid JSON format: expected an array in file'));
        }
      } catch (parseError) {
        return res.status(400).json(new ApiResponse(400, null, 'Error parsing JSON file: ' + parseError.message));
      }
    }
    // Case 2: Single JSON object in request body (express always gives {} — check for real content)
    else if (req.body && Object.keys(req.body).length > 0) {
      console.log('Handling single JSON object...');
      chaptersData = Array.isArray(req.body) ? req.body : [req.body];
    } else {
      return res.status(400).json(new ApiResponse(400, null, 'No file uploaded or JSON data provided'));
    }

    const uploadResults = {
      successful: [],
      failed: [],
    };

    for (const chapterData of chaptersData) {
      try {
        const chapter = new Chapter(chapterData);
        await chapter.save();
        uploadResults.successful.push(chapter);
      } catch (error) {
        console.error('Chapter validation error:', error.message);
        uploadResults.failed.push({ chapter: chapterData, error: error.message });
      }
    }

    // Invalidate list cache (safe no-op when Redis is unavailable)
    await invalidateChapterListCache();

    const responseData = {
      successful: uploadResults.successful,
      failed: uploadResults.failed,
    };
    res.status(201).json(new ApiResponse(201, responseData, 'Chapters uploaded'));
  }),
};

export default chapterController;
