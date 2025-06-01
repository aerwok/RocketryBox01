import { AppError } from './errorHandler.js';
import { checkRateLimit } from '../utils/redis.js';

// Default rate limiter
export const defaultLimiter = async (req, res, next) => {
    try {
        const key = `ratelimit:${req.ip}`;
        const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS);
        const maxRequests = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS);
        
        const result = await checkRateLimit(
            key,
            maxRequests,
            Math.floor(windowMs / 1000)
        );

        if (!result.isAllowed) {
            const error = new AppError(
                'Too many requests from this IP, please try again later',
                429
            );
            error.remainingAttempts = result.remainingAttempts;
            return next(error);
        }

        // Add rate limit info to response headers
        res.setHeader('X-RateLimit-Limit', maxRequests);
        res.setHeader('X-RateLimit-Remaining', result.remainingAttempts);
        
        next();
    } catch (error) {
        next(error);
    }
};

// Stricter limiter for authentication endpoints
export const authLimiter = async (req, res, next) => {
    try {
        const key = `authlimit:${req.ip}`;
        const windowMs = 60 * 60 * 1000; // 1 hour
        const maxRequests = 100; // 10 requests per hour
        
        const result = await checkRateLimit(
            key,
            maxRequests,
            Math.floor(windowMs / 1000)
        );

        if (!result.isAllowed) {
            const error = new AppError(
                'Too many login attempts, please try again later',
                429
            );
            error.remainingAttempts = result.remainingAttempts;
            return next(error);
        }

        // Add rate limit info to response headers
        res.setHeader('X-RateLimit-Limit', maxRequests);
        res.setHeader('X-RateLimit-Remaining', result.remainingAttempts);
        
        next();
    } catch (error) {
        next(error);
    }
};

// Stricter limiter for payment endpoints
export const paymentLimiter = async (req, res, next) => {
    try {
        const key = `paymentlimit:${req.ip}`;
        const windowMs = 60 * 60 * 1000; // 1 hour
        // More reasonable limits: higher for development, moderate for production
        const maxRequests = process.env.NODE_ENV === 'development' ? 100 : 30; // 100 dev, 30 prod per hour
        
        const result = await checkRateLimit(
            key,
            maxRequests,
            Math.floor(windowMs / 1000)
        );

        if (!result.isAllowed) {
            const error = new AppError(
                'Too many payment attempts, please try again later',
                429
            );
            error.remainingAttempts = result.remainingAttempts;
            return next(error);
        }

        // Add rate limit info to response headers
        res.setHeader('X-RateLimit-Limit', maxRequests);
        res.setHeader('X-RateLimit-Remaining', result.remainingAttempts);
        
        next();
    } catch (error) {
        next(error);
    }
};

// More reasonable limiter for tracking requests
export const trackingLimiter = async (req, res, next) => {
    try {
        const key = `trackinglimit:${req.ip}`;
        const windowMs = 60 * 60 * 1000; // 1 hour
        // Much more reasonable limits: users should be able to track multiple times
        const maxRequests = process.env.NODE_ENV === 'development' ? 100 : 50; // 100 dev, 50 prod per hour
        
        const result = await checkRateLimit(
            key,
            maxRequests,
            Math.floor(windowMs / 1000)
        );

        if (!result.isAllowed) {
            const error = new AppError(
                'Too many tracking requests, please try again later',
                429
            );
            error.remainingAttempts = result.remainingAttempts;
            return next(error);
        }

        // Add rate limit info to response headers
        res.setHeader('X-RateLimit-Limit', maxRequests);
        res.setHeader('X-RateLimit-Remaining', result.remainingAttempts);
        
        next();
    } catch (error) {
        next(error);
    }
};

// Stricter limiter for refund requests
export const refundLimiter = async (req, res, next) => {
    try {
        const key = `refundlimit:${req.ip}`;
        const windowMs = 24 * 60 * 60 * 1000; // 24 hours
        const maxRequests = 2; // 2 requests per day
        
        const result = await checkRateLimit(
            key,
            maxRequests,
            Math.floor(windowMs / 1000)
        );

        if (!result.isAllowed) {
            const error = new AppError(
                'Too many refund requests, please try again later',
                429
            );
            error.remainingAttempts = result.remainingAttempts;
            return next(error);
        }

        // Add rate limit info to response headers
        res.setHeader('X-RateLimit-Limit', maxRequests);
        res.setHeader('X-RateLimit-Remaining', result.remainingAttempts);
        
        next();
    } catch (error) {
        next(error);
    }
};

// Advanced limiter for admin operations with higher thresholds
export const advancedLimiter = async (req, res, next) => {
  try {
    const key = `advancedlimit:${req.ip}`;
    const windowMs = 15 * 60 * 1000; // 15 minutes
    const maxRequests = 30; // 30 requests per 15 minutes
    
    const result = await checkRateLimit(
      key,
      maxRequests,
      Math.floor(windowMs / 1000)
    );

    if (!result.isAllowed) {
      const error = new AppError(
        'Rate limit exceeded for administrative operations, please try again later',
        429
      );
      error.remainingAttempts = result.remainingAttempts;
      return next(error);
    }

    // Add rate limit info to response headers
    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', result.remainingAttempts);
    
    next();
  } catch (error) {
    next(error);
  }
}; 