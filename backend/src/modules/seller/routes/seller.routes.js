import express from 'express';
import { login, sendOTP, verifyOTP, resetPassword, refreshToken, register, logout } from '../controllers/auth.controller.js';
import { validationHandler as validateRequest } from '../../../middleware/validator.js';
import { 
  loginSchema, 
  sendOTPSchema, 
  verifyOTPSchema, 
  resetPasswordSchema, 
  registerSchema,
  companyDetailsSchema,
  bankDetailsSchema,
  profileUpdateSchema,
  documentUpdateSchema
} from '../validators/seller.validator.js';
import { getSellerRateCard, calculateRateCard } from '../controllers/billing.controller.js';
import { authLimiter } from '../../../middleware/rateLimiter.js';
import { getProfile, updateProfile, getDocuments, updateDocument, updateCompanyDetails, updateBankDetails } from '../controllers/profile.controller.js';
import { authenticateSeller } from '../../../middleware/auth.js';

const router = express.Router();

// Seller Authentication Routes with rate limiting
router.post('/auth/register', authLimiter, validateRequest(registerSchema), register);
router.post('/auth/login', authLimiter, validateRequest(loginSchema), login);
router.post('/auth/otp/send', authLimiter, validateRequest(sendOTPSchema), sendOTP);
router.post('/auth/otp/verify', authLimiter, validateRequest(verifyOTPSchema), verifyOTP);
router.post('/auth/reset-password', authLimiter, validateRequest(resetPasswordSchema), resetPassword);
router.post('/auth/refresh-token', authLimiter, refreshToken);
router.post('/auth/logout', authenticateSeller, logout);

// Profile Routes
router.get('/profile', authenticateSeller, getProfile);
router.patch('/profile', authenticateSeller, validateRequest(profileUpdateSchema), updateProfile);
router.patch('/profile/company-details', authenticateSeller, validateRequest(companyDetailsSchema), updateCompanyDetails);
router.patch('/profile/bank-details', authenticateSeller, validateRequest(bankDetailsSchema), updateBankDetails);

// Document Routes
router.get('/documents', authenticateSeller, getDocuments);
router.post('/documents', authenticateSeller, validateRequest(documentUpdateSchema), updateDocument);

// Rate Card Routes
router.get('/rate-card', authenticateSeller, getSellerRateCard);
router.post('/rate-card/calculate', authenticateSeller, calculateRateCard);

export default router; 
