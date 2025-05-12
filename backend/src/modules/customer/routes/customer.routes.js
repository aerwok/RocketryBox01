import express from 'express';
import { register, login, sendOTP, verifyOTPHandler } from '../controllers/auth.controller.js';
import {
  getProfile,
  updateProfile,
  addAddress,
  updateAddress,
  deleteAddress
} from '../controllers/profile.controller.js';
import {
  createOrder,
  listOrders,
  getOrderDetails,
  downloadLabel,
  createPayment,
  verifyPayment,
  subscribeTracking,
  refundPayment,
  checkPaymentStatus,
  calculateRates
} from '../controllers/order.controller.js';
import {
  listServices,
  checkAvailability
} from '../controllers/service.controller.js';
import { handleTrackingWebhook } from '../controllers/webhook.controller.js';
import { protect } from '../../../middleware/auth.js';
import { validateRequest } from '../../../middleware/validator.js';
import {
  defaultLimiter,
  authLimiter,
  paymentLimiter,
  trackingLimiter,
  refundLimiter
} from '../../../middleware/rateLimiter.js';
import {
  registerSchema,
  loginSchema,
  otpSchema,
  profileUpdateSchema,
  addressSchema
} from '../validators/customer.validator.js';
import {
  createOrderSchema,
  listOrdersSchema,
  createPaymentSchema,
  verifyPaymentSchema,
  subscribeTrackingSchema,
  refundSchema,
  calculateRatesSchema
} from '../validators/order.validator.js';
import { checkAvailabilitySchema } from '../validators/service.validator.js';

const router = express.Router();

// Apply default rate limiter to all routes
router.use(defaultLimiter);

// Auth routes
router.post('/auth/register', authLimiter, validateRequest(registerSchema), register);
router.post('/auth/login', authLimiter, validateRequest(loginSchema), login);
router.post('/auth/otp/send', authLimiter, validateRequest(otpSchema), sendOTP);
router.post('/auth/otp/verify', authLimiter, validateRequest(otpSchema), verifyOTPHandler);

// Protected routes
router.use(protect);

// Profile routes
router.get('/profile', getProfile);
router.put('/profile', validateRequest(profileUpdateSchema), updateProfile);
router.post('/profile/addresses', validateRequest(addressSchema), addAddress);
router.put('/profile/addresses/:id', validateRequest(addressSchema), updateAddress);
router.delete('/profile/addresses/:id', deleteAddress);

// Order routes
router.post('/orders/rates', validateRequest(calculateRatesSchema), calculateRates);
router.post('/orders', validateRequest(createOrderSchema), createOrder);
router.get('/orders', validateRequest(listOrdersSchema), listOrders);
router.get('/orders/:id', getOrderDetails);
router.get('/orders/:id/label', downloadLabel);

// Payment routes
router.post(
  '/orders/:id/payment',
  paymentLimiter,
  validateRequest(createPaymentSchema),
  createPayment
);
router.post(
  '/orders/:id/payment/verify',
  paymentLimiter,
  validateRequest(verifyPaymentSchema),
  verifyPayment
);
router.get('/orders/:id/payment/status', checkPaymentStatus);

// Tracking routes
router.post(
  '/orders/:id/tracking',
  trackingLimiter,
  validateRequest(subscribeTrackingSchema),
  subscribeTracking
);

// Refund routes
router.post(
  '/orders/:id/refund',
  refundLimiter,
  validateRequest(refundSchema),
  refundPayment
);

// Service routes
router.get('/services', listServices);
router.post(
  '/services/check',
  validateRequest(checkAvailabilitySchema),
  checkAvailability
);

// Webhook routes
router.post('/webhooks/tracking', handleTrackingWebhook);

export default router; 