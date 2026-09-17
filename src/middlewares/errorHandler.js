import { ApiResponse } from '../utils/apiResponse.js';

// Central error handler. Respects thrown status codes; hides internals in production.
const errorHandler = (err, req, res, next) => {
  console.error(err.stack || err);

  // Mongoose bad ObjectId -> 400, not 500
  if (err?.name === 'CastError') {
    return res.status(400).json(new ApiResponse(400, null, 'Invalid ID format'));
  }
  if (err?.name === 'ValidationError') {
    return res.status(400).json(new ApiResponse(400, null, err.message));
  }
  if (err?.code === 11000) {
    return res.status(409).json(new ApiResponse(409, null, 'Duplicate record'));
  }

  const status = typeof err?.statusCode === 'number' ? err.statusCode : 500;
  const message =
    status === 500 && process.env.NODE_ENV === 'production'
      ? 'Something went wrong!'
      : err?.message || 'Something went wrong!';
  res.status(status).json(new ApiResponse(status, null, message));
};

export default errorHandler;
