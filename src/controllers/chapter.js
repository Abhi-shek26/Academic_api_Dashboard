import Chapter from '../models/chapter.js';
import redisClient from '../config/redis.js';
import { asyncHandler } from '../utils/helpers.js'; 
import { ApiResponse } from '../utils/apiResponse.js'; 

const chapterController = {
  getAllChapters: asyncHandler(async (req, res) => {
    const { class: classFilter, unit, status, weakChapters, subject , chapter } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const filter = {};
    if (classFilter) filter.class = classFilter;
    if (unit) filter.unit = unit;
    if (status) filter.status = status;
    if (weakChapters) filter.weakChapters = { $in: Array.isArray(weakChapters) ? weakChapters : [weakChapters] };
    if (subject) filter.subject = subject;
    if (chapter) filter.chapter = { $regex: chapter, $options: 'i' }; // Case-insensitive search

    const skip = (page - 1) * limit;

    const chapters = await Chapter.find(filter).skip(skip).limit(limit);
    const totalChapters = await Chapter.countDocuments(filter);

    res.json({
      chapters,
      totalChapters,
      currentPage: page,
      totalPages: Math.ceil(totalChapters / limit),
    });
  }),

  getChapterById: asyncHandler(async (req, res) => {
    const chapter = await Chapter.findById(req.params.id);
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
        // Case 2: Single JSON object in request body
        else if (req.body) {
            console.log('Handling single JSON object...');
            chaptersData = [req.body];
        }
        else {
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
        console.error('Chapter validation error:', error);
        uploadResults.failed.push({ chapter: chapterData, error: error.message });
      }
    }

    // Invalidate cache
    await redisClient.del('__express__/api/v1/chapters');

    const responseData = {
      successful: uploadResults.successful,
      failed: uploadResults.failed,
    };
    res.status(201).json(new ApiResponse(201, responseData, 'Chapters uploaded'));
  }),
};

export default chapterController;
