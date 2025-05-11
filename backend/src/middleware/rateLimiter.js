import rateLimit from 'express-rate-limit';
import { AppError } from './errorHandler.js';

// Default rate limiter
export const defaultLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // 100 requests per window
  message: 'Too many requests from this IP, please try again later',
  handler: (req, res) => {
    throw new AppError('Too many requests from this IP, please try again later', 429);
  }
});

// Stricter limiter for authentication endpoints
export const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 requests per hour
  message: 'Too many login attempts, please try again later',
  handler: (req, res) => {
    throw new AppError('Too many login attempts, please try again later', 429);
  }
});

// Stricter limiter for payment endpoints
export const paymentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 requests per hour
  message: 'Too many payment attempts, please try again later',
  handler: (req, res) => {
    throw new AppError('Too many payment attempts, please try again later', 429);
  }
});

// Stricter limiter for tracking subscription
export const trackingLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 3, // 3 requests per day
  message: 'Too many tracking subscription attempts, please try again later',
  handler: (req, res) => {
    throw new AppError('Too many tracking subscription attempts, please try again later', 429);
  }
});

// Stricter limiter for refund requests
export const refundLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 2, // 2 requests per day
  message: 'Too many refund requests, please try again later',
  handler: (req, res) => {
    throw new AppError('Too many refund requests, please try again later', 429);
  }
}); 