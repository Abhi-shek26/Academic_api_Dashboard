import Chapter from '../models/chapter.js';
import { asyncHandler } from '../utils/helpers.js';
import { ApiResponse } from '../utils/apiResponse.js';

// Analytics endpoints — power the Data/Product Analyst story
// (aggregations) and the AI Engineer story (explainable recommendations).
const analyticsController = {
  // GET /api/v1/analytics/summary — dashboard KPIs
  getSummary: asyncHandler(async (req, res) => {
    const [totals, byStatus, bySubject, byClass, weak] = await Promise.all([
      Chapter.aggregate([
        {
          $group: {
            _id: null,
            totalChapters: { $sum: 1 },
            totalQuestionsSolved: { $sum: '$questionSolved' },
            avgQuestionsSolved: { $avg: '$questionSolved' },
          },
        },
      ]),
      Chapter.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
      Chapter.aggregate([
        {
          $group: {
            _id: '$subject',
            chapters: { $sum: 1 },
            questionsSolved: { $sum: '$questionSolved' },
            weakChapters: { $sum: { $cond: ['$isWeakChapter', 1, 0] } },
          },
        },
        { $sort: { chapters: -1 } },
      ]),
      Chapter.aggregate([{ $group: { _id: '$class', count: { $sum: 1 } } }, { $sort: { _id: 1 } }]),
      Chapter.countDocuments({ isWeakChapter: true }),
    ]);

    const t = totals[0] || { totalChapters: 0, totalQuestionsSolved: 0, avgQuestionsSolved: 0 };
    res.status(200).json(
      new ApiResponse(
        200,
        {
          totalChapters: t.totalChapters,
          totalQuestionsSolved: t.totalQuestionsSolved,
          avgQuestionsSolved: Math.round((t.avgQuestionsSolved || 0) * 100) / 100,
          weakChapters: weak,
          weakShare: t.totalChapters ? Math.round((weak / t.totalChapters) * 1000) / 10 : 0,
          byStatus,
          bySubject,
          byClass,
        },
        'Analytics summary retrieved successfully'
      )
    );
  }),

  // GET /api/v1/analytics/trends — year-wise question volume (for charts)
  getTrends: asyncHandler(async (req, res) => {
    const { subject } = req.query;
    const match = subject ? { subject } : {};
    const trends = await Chapter.aggregate([
      { $match: match },
      { $project: { pairs: { $objectToArray: '$yearWiseQuestionCount' } } },
      { $unwind: '$pairs' },
      { $group: { _id: '$pairs.k', questions: { $sum: '$pairs.v' } } },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, year: '$_id', questions: 1 } },
    ]);
    res.status(200).json(new ApiResponse(200, { trends }, 'Question trends retrieved successfully'));
  }),

  // GET /api/v1/analytics/recommendations — explainable study-priority ranking.
  // Heuristic baseline designed so an ML model can replace `scoreChapter` later.
  getRecommendations: asyncHandler(async (req, res) => {
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 50);
    const chapters = await Chapter.find({}).lean();

    const maxSolved = Math.max(1, ...chapters.map((c) => c.questionSolved || 0));

    const scoreChapter = (c) => {
      let score = 0;
      const reasons = [];
      if (c.isWeakChapter) {
        score += 40;
        reasons.push('Flagged as weak chapter');
      }
      if (c.status === 'Not Started') {
        score += 30;
        reasons.push('Not started yet');
      } else if (c.status === 'In Progress') {
        score += 15;
        reasons.push('In progress');
      }
      // Low completion relative to the corpus -> higher priority
      const completionGap = 1 - (c.questionSolved || 0) / maxSolved;
      const gapPoints = Math.round(completionGap * 20);
      score += gapPoints;
      if (gapPoints >= 10) reasons.push('Low question completion vs peers');
      // High historical weight (more PYQs) -> higher priority
      const years = c.yearWiseQuestionCount instanceof Map
        ? [...c.yearWiseQuestionCount.values()]
        : Object.values(c.yearWiseQuestionCount || {});
      const volume = years.reduce((a, b) => a + (Number(b) || 0), 0);
      const volumePoints = Math.min(10, Math.round(volume / 5));
      score += volumePoints;
      if (volumePoints >= 5) reasons.push(`High PYQ weight (${volume} questions)`);
      return { score, reasons, pyqVolume: volume };
    };

    const ranked = chapters
      .map((c) => {
        const { score, reasons, pyqVolume } = scoreChapter(c);
        return {
          _id: c._id,
          subject: c.subject,
          chapter: c.chapter,
          class: c.class,
          unit: c.unit,
          status: c.status,
          isWeakChapter: c.isWeakChapter,
          questionSolved: c.questionSolved,
          pyqVolume,
          priorityScore: score,
          reasons,
        };
      })
      .sort((a, b) => b.priorityScore - a.priorityScore)
      .slice(0, limit);

    res.status(200).json(new ApiResponse(200, { recommendations: ranked }, 'Study recommendations retrieved successfully'));
  }),
};

export default analyticsController;
