import express from 'express';
import { login, sendOTP, verifyOTP, resetPassword, refreshToken, register } from '../controllers/auth.controller.js';
import { validationHandler as validateRequest } from '../../../middleware/validator.js';
import { loginSchema, sendOTPSchema, verifyOTPSchema, resetPasswordSchema, registerSchema } from '../validators/seller.validator.js';
import { getSellerRateCard, calculateRateCard } from '../controllers/billing.controller.js';
import { authLimiter } from '../../../middleware/rateLimiter.js';

const router = express.Router();

// Seller Authentication Routes with rate limiting
router.post('/auth/register', authLimiter, validateRequest(registerSchema), register);
router.post('/auth/login', authLimiter, validateRequest(loginSchema), login);
router.post('/auth/otp/send', authLimiter, validateRequest(sendOTPSchema), sendOTP);
router.post('/auth/otp/verify', authLimiter, validateRequest(verifyOTPSchema), verifyOTP);
router.post('/auth/reset-password', authLimiter, validateRequest(resetPasswordSchema), resetPassword);
router.post('/auth/refresh-token', authLimiter, refreshToken);

// Rate Card Routes (no rate limiting needed as they're internal)
router.get('/rate-card', getSellerRateCard);
router.post('/rate-card/calculate', calculateRateCard);

export default router; 
