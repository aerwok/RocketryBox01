import jwt from 'jsonwebtoken';
import { AppError } from './errorHandler.js';
import { getSession, setSession } from '../utils/redis.js';
import { logger } from '../utils/logger.js';

const isDev = process.env.NODE_ENV === 'development';

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

    // 3) Check session in Redis (skip in dev mode if Redis fails)
    try {
      const session = await getSession(decoded.id);
      if (!session && !isDev) {
        return next(new AppError('Your session has expired. Please log in again.', 401));
      }

      // 4) Extend session if needed
      if (session) {
        let sessionData;
        try {
          // Handle both string and object session data
          sessionData = typeof session === 'string' ? JSON.parse(session) : session;
        } catch (parseError) {
          // If parsing fails, treat as expired session
          return next(new AppError('Your session has expired. Please log in again.', 401));
        }

        if (sessionData.lastActivity < Date.now() - (30 * 60 * 1000)) { // 30 minutes
          await setSession(decoded.id, JSON.stringify({
            ...sessionData,
            lastActivity: Date.now()
          }));
        }

        // 5) Add user info to request
        req.user = {
          ...decoded,
          ...sessionData.user
        };
      } else if (isDev) {
        // In development, if Redis fails, just use the token data
        logger.warn('Redis session check skipped in development mode');
        req.user = decoded;
      }
    } catch (redisError) {
      if (isDev) {
        // In development, if Redis fails, just use the token data
        logger.warn('Redis error in development mode:', redisError.message);
        req.user = decoded;
      } else {
        throw redisError;
      }
    }
    
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

// Middleware to authenticate seller
export const authenticateSeller = async (req, res, next) => {
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

    // 3) Check if user is a seller
    if (decoded.role !== 'seller') {
      return next(new AppError('You do not have permission to access this route', 403));
    }

    // 4) Check session in Redis (skip in dev mode if Redis fails)
    try {
      const session = await getSession(decoded.id);
      if (!session && !isDev) {
        return next(new AppError('Your session has expired. Please log in again.', 401));
      }

      // 5) Extend session if needed
      if (session) {
        const sessionData = JSON.parse(session);
        if (sessionData.lastActivity < Date.now() - (30 * 60 * 1000)) { // 30 minutes
          await setSession(decoded.id, {
            ...sessionData,
            lastActivity: Date.now()
          });
        }

        // 6) Add user info to request
        req.user = {
          ...decoded,
          ...sessionData.user
        };
      } else if (isDev) {
        // In development, if Redis fails, just use the token data
        logger.warn('Redis session check skipped in development mode');
        req.user = decoded;
      }
    } catch (redisError) {
      if (isDev) {
        // In development, if Redis fails, just use the token data
        logger.warn('Redis error in development mode:', redisError.message);
        req.user = decoded;
      } else {
        throw redisError;
      }
    }
    
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return next(new AppError('Invalid token. Please log in again!', 401));
    }
    next(error);
  }
};

// Middleware to authenticate admin
export const authenticateAdmin = async (req, res, next) => {
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

    // 3) Check if user is an admin
    if (decoded.role !== 'Admin' && decoded.role !== 'Manager') {
      return next(new AppError('You do not have permission to access this route', 403));
    }

    // 4) Check session in Redis (skip in dev mode if Redis fails)
    try {
      const session = await getSession(decoded.id);
      if (!session && !isDev) {
        return next(new AppError('Your session has expired. Please log in again.', 401));
      }

      // 5) Extend session if needed
      if (session) {
        let sessionData;
        try {
          // Handle both string and object session data
          sessionData = typeof session === 'string' ? JSON.parse(session) : session;
        } catch (parseError) {
          // If parsing fails, treat as expired session
          return next(new AppError('Your session has expired. Please log in again.', 401));
        }

        if (sessionData.lastActivity < Date.now() - (30 * 60 * 1000)) { // 30 minutes
          await setSession(decoded.id, JSON.stringify({
            ...sessionData,
            lastActivity: Date.now()
          }));
        }

        // 6) Add user info to request
        req.user = {
          ...decoded,
          ...sessionData.user
        };
      } else if (isDev) {
        // In development, if Redis fails, just use the token data
        logger.warn('Redis session check skipped in development mode');
        req.user = decoded;
      }
    } catch (redisError) {
      if (isDev) {
        // In development, if Redis fails, just use the token data
        logger.warn('Redis error in development mode:', redisError.message);
        req.user = decoded;
      } else {
        throw redisError;
      }
    }
    
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return next(new AppError('Invalid token. Please log in again!', 401));
    }
    next(error);
  }
}; 