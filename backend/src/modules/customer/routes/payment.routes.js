import express from 'express';
import { protect } from '../../../middleware/auth.js';
import { 
  createPaymentOrder, 
  verifyPayment, 
  getPaymentHistory,
  getPaymentById 
} from '../controllers/payment.controller.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Create Razorpay payment order
router.post('/create-order', createPaymentOrder);

// Verify payment after successful payment
router.post('/verify', verifyPayment);

// Get payment history for the customer
router.get('/history', getPaymentHistory);

// Get specific payment details
router.get('/:paymentId', getPaymentById);

export default router; 