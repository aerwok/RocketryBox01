import jwt from 'jsonwebtoken';
import { AppError } from './errorHandler.js';
import { getSession, setSession } from '../utils/redis.js';

export const protect = async (req, res, next) => {
  try {
    // 1) Get token from header
    let token;
    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new AppError('You are not logged in! Please log in to get access.', 401));
    }

    // 2) Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3) Check session in Redis
    const session = await getSession(decoded.id);
    if (!session) {
      return next(new AppError('Your session has expired. Please log in again.', 401));
    }

    // 4) Extend session if needed
    const sessionData = JSON.parse(session);
    if (sessionData.lastActivity < Date.now() - (30 * 60 * 1000)) { // 30 minutes
      await setSession(decoded.id, {
        ...sessionData,
        lastActivity: Date.now()
      });
    }

    // 5) Add user info to request
    req.user = {
      ...decoded,
      ...sessionData.user
    };
    
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return next(new AppError('Invalid token. Please log in again!', 401));
    }
    next(error);
  }
};

export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action', 403));
    }
    next();
  };
}; 