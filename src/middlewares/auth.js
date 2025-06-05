import config from '../config/index.js';

const adminAuth = (req, res, next) => {
  const apiKey = req.headers['x-api-key']; 
  if (apiKey === config.adminApiKey) {
    next(); 
  } else {
    res.status(401).json({ message: 'Unauthorized' });
  }
};

export default adminAuth;
