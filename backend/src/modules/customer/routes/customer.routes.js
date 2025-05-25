import express from 'express';
import { register, login, sendOTP, verifyOTPHandler, checkAuthStatus, logout } from '../controllers/auth.controller.js';
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
  verifyOrderPayment,
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
import { validationHandler as validateRequest } from '../../../middleware/validator.js';
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
router.post('/auth/register', authLimiter, validateRequest([registerSchema]), register);
router.post('/auth/login', authLimiter, validateRequest([loginSchema]), login);
router.post('/auth/otp/send', authLimiter, validateRequest([otpSchema]), sendOTP);
router.post('/auth/otp/verify', authLimiter, validateRequest([otpSchema]), verifyOTPHandler);

// Public endpoints (no auth required)
router.post('/services/check', validateRequest([checkAvailabilitySchema]), checkAvailability);
router.get('/services', listServices);
router.post('/orders/rates', validateRequest([calculateRatesSchema]), calculateRates);
router.post('/webhook/tracking', handleTrackingWebhook);

// Protected routes
router.use(protect);

// Auth routes (protected)
router.get('/auth/check', checkAuthStatus);
router.post('/auth/logout', authLimiter, logout);

// Profile routes
router.get('/profile', getProfile);
router.put('/profile', validateRequest([profileUpdateSchema]), updateProfile);
router.post('/address', validateRequest([addressSchema]), addAddress);
router.put('/address/:id', validateRequest([addressSchema]), updateAddress);
router.delete('/address/:id', deleteAddress);

// Order routes
router.post('/orders', validateRequest([createOrderSchema]), createOrder);
router.get('/orders', validateRequest([listOrdersSchema]), listOrders);
router.get('/orders/:id', getOrderDetails);
router.get('/orders/awb/:awb', getOrderDetails);
router.get('/orders/:id/label', downloadLabel);

// Payment routes
router.post('/payments', paymentLimiter, validateRequest([createPaymentSchema]), createPayment);
router.post('/payments/verify', paymentLimiter, validateRequest([verifyPaymentSchema]), verifyOrderPayment);
router.get('/payments/:paymentId', paymentLimiter, checkPaymentStatus);

// Tracking routes
router.post('/tracking/subscribe', trackingLimiter, validateRequest([subscribeTrackingSchema]), subscribeTracking);

// Refund routes
router.post('/refunds', refundLimiter, validateRequest([refundSchema]), refundPayment);

export default router; 