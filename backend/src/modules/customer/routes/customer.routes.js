import express from 'express';
import { register, login, sendOTP } from '../controllers/auth.controller.js';
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
router.post('/auth/send-otp', authLimiter, validateRequest(otpSchema), sendOTP);

// Service routes
router.get('/services', listServices);
router.post('/services/check-availability', validateRequest(checkAvailabilitySchema), checkAvailability);

// Protected routes
router.use(protect);

// Profile routes
router.get('/profile', getProfile);
router.put('/profile', validateRequest(profileUpdateSchema), updateProfile);

// Address routes
router.post('/addresses', validateRequest(addressSchema), addAddress);
router.put('/addresses/:addressId', validateRequest(addressSchema), updateAddress);
router.delete('/addresses/:addressId', deleteAddress);

// Order routes
router.post('/orders/rates', validateRequest(calculateRatesSchema), calculateRates);
router.post('/orders', validateRequest(createOrderSchema), createOrder);
router.get('/orders', validateRequest(listOrdersSchema), listOrders);
router.get('/orders/:awb', getOrderDetails);
router.get('/orders/:awb/label', downloadLabel);

// Payment routes
router.post('/orders/:awb/payment', paymentLimiter, validateRequest(createPaymentSchema), createPayment);
router.post('/orders/:awb/verify-payment', paymentLimiter, validateRequest(verifyPaymentSchema), verifyPayment);
router.post('/orders/:awb/refund', refundLimiter, validateRequest(refundSchema), refundPayment);
router.get('/orders/:awb/payment-status', paymentLimiter, checkPaymentStatus);

// Tracking routes
router.post('/orders/:awb/subscribe', trackingLimiter, validateRequest(subscribeTrackingSchema), subscribeTracking);

// Webhook routes (no authentication required)
router.post('/webhooks/tracking', handleTrackingWebhook);

export default router; 