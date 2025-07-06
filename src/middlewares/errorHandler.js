import { ApiResponse } from '../utils/apiResponse.js';
const errorHandler = (err, req, res, next) => { 
  console.error(err.stack);
  res.status(500).json(new ApiResponse(500, null, 'Something went wrong!'));
};

export default errorHandler;
