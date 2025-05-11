import Razorpay from 'razorpay';
import crypto from 'crypto';
import { AppError } from '../middleware/errorHandler.js';

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

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