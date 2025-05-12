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
        const maxRequests = 5; // 5 requests per hour
        
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
        const maxRequests = 10; // 10 requests per hour
        
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

// Stricter limiter for tracking subscription
export const trackingLimiter = async (req, res, next) => {
    try {
        const key = `trackinglimit:${req.ip}`;
        const windowMs = 24 * 60 * 60 * 1000; // 24 hours
        const maxRequests = 3; // 3 requests per day
        
        const result = await checkRateLimit(
            key,
            maxRequests,
            Math.floor(windowMs / 1000)
        );

        if (!result.isAllowed) {
            const error = new AppError(
                'Too many tracking subscription attempts, please try again later',
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