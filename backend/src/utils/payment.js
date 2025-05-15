import Razorpay from 'razorpay';
import crypto from 'crypto';
import { AppError } from '../middleware/errorHandler.js';
import { logger } from './logger.js';

// Check if Razorpay credentials are available
const hasRazorpayCredentials = process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET;

// Initialize Razorpay or create a mock implementation
let razorpay;

if (hasRazorpayCredentials) {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
  });
  logger.info('Razorpay initialized with real credentials');
} else {
  logger.warn('Razorpay credentials not found, using mock implementation');
  // Mock implementation for development
  razorpay = {
    orders: {
      create: async (orderData) => {
        logger.info('Mock Razorpay order created:', orderData);
        return {
          id: 'order_' + Date.now(),
          amount: orderData.amount,
          currency: orderData.currency,
          receipt: orderData.receipt,
          created_at: new Date()
        };
      }
    },
    payments: {
      fetch: async (paymentId) => {
        logger.info('Mock Razorpay payment fetched:', paymentId);
        return {
          id: paymentId,
          order_id: 'order_' + Date.now(),
          amount: 10000, // 100 in paise
          currency: 'INR',
          status: 'captured',
          method: 'card',
          captured: true,
          description: 'Mock payment for development',
          email: 'test@example.com',
          contact: '9999999999',
          notes: {},
          created_at: new Date().getTime() / 1000
        };
      },
      refund: async (paymentId, refundData) => {
        logger.info('Mock Razorpay refund created:', { paymentId, ...refundData });
        return {
          id: 'rfnd_' + Date.now(),
          payment_id: paymentId,
          amount: refundData.amount || 10000,
          currency: 'INR',
          status: 'processed',
          speed: refundData.speed,
          notes: refundData.notes,
          created_at: new Date().getTime() / 1000
        };
      }
    }
  };
}

// Create payment order
export const createPaymentOrder = async ({
  amount,
  currency,
  awbNumber,
  paymentMethod
}) => {
  try {
    // Validate inputs
    if (!amount || !currency || !awbNumber || !paymentMethod) {
      throw new AppError('Missing required parameters', 400);
    }

    // Create Razorpay order
    const order = await razorpay.orders.create({
      amount: amount * 100, // Convert to paise
      currency,
      receipt: awbNumber,
      notes: {
        awbNumber,
        paymentMethod
      }
    });

    return {
      success: true,
      data: {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

// Verify payment
export const verifyPayment = async ({
  razorpay_payment_id,
  razorpay_order_id,
  razorpay_signature
}) => {
  try {
    // Validate inputs
    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      throw new AppError('Missing required parameters', 400);
    }

    // In mock mode, just return success
    if (!hasRazorpayCredentials) {
      logger.info('Mock payment verification:', { razorpay_payment_id, razorpay_order_id });
      return {
        success: true,
        data: {
          paymentId: razorpay_payment_id,
          orderId: razorpay_order_id,
          amount: 10000,
          currency: 'INR',
          status: 'captured',
          method: 'card',
          captured: true,
          description: 'Mock payment verification',
          email: 'test@example.com',
          contact: '9999999999',
          notes: {},
          createdAt: new Date().getTime() / 1000
        }
      };
    }

    // Verify signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    const isValid = expectedSignature === razorpay_signature;

    if (!isValid) {
      throw new AppError('Invalid payment signature', 400);
    }

    // Get payment details
    const payment = await razorpay.payments.fetch(razorpay_payment_id);

    return {
      success: true,
      data: {
        paymentId: payment.id,
        orderId: payment.order_id,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        method: payment.method,
        captured: payment.captured,
        description: payment.description,
        email: payment.email,
        contact: payment.contact,
        notes: payment.notes,
        createdAt: payment.created_at
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

// Refund payment
export const refundPayment = async ({
  paymentId,
  amount,
  speed = 'normal',
  notes = {}
}) => {
  try {
    // Validate inputs
    if (!paymentId) {
      throw new AppError('Payment ID is required', 400);
    }

    // Create refund
    const refund = await razorpay.payments.refund(paymentId, {
      amount: amount ? amount * 100 : undefined, // Convert to paise if amount provided
      speed,
      notes
    });

    return {
      success: true,
      data: {
        refundId: refund.id,
        paymentId: refund.payment_id,
        amount: refund.amount,
        currency: refund.currency,
        status: refund.status,
        speed: refund.speed,
        notes: refund.notes,
        createdAt: refund.created_at
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

// Get payment status
export const getPaymentStatus = async (paymentId) => {
  try {
    // Validate inputs
    if (!paymentId) {
      throw new AppError('Payment ID is required', 400);
    }

    // Get payment details
    const payment = await razorpay.payments.fetch(paymentId);

    return {
      success: true,
      data: {
        paymentId: payment.id,
        orderId: payment.order_id,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        method: payment.method,
        captured: payment.captured,
        description: payment.description,
        email: payment.email,
        contact: payment.contact,
        notes: payment.notes,
        createdAt: payment.created_at
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}; 