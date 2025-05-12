import express from 'express';
import { login, sendOTP, verifyOTP, resetPassword, refreshToken, register } from '../controllers/auth.controller.js';
import { validateRequest } from '../../../middleware/validator.js';
import { loginSchema, sendOTPSchema, verifyOTPSchema, resetPasswordSchema, registerSchema } from '../validators/seller.validator.js';
import { getSellerRateCard, calculateRateCard } from '../controllers/billing.controller.js';

const router = express.Router();

// Seller Authentication Routes
router.post('/auth/login', validateRequest(loginSchema), login);
router.post('/auth/otp/send', validateRequest(sendOTPSchema), sendOTP);
router.post('/auth/otp/verify', validateRequest(verifyOTPSchema), verifyOTP);
router.post('/auth/reset-password', validateRequest(resetPasswordSchema), resetPassword);
router.post('/auth/refresh', refreshToken);
router.post('/auth/register', validateRequest(registerSchema), register);

// Billing - Rate Card
router.get('/billing/rate-card', getSellerRateCard);
router.post('/billing/rate-card/calculate', calculateRateCard);

export default router; 