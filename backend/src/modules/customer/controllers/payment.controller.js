import Razorpay from 'razorpay';
import crypto from 'crypto';
import { AppError } from '../../../middleware/errorHandler.js';
import CustomerOrder from '../models/customerOrder.model.js';
import Payment from '../models/payment.model.js';
import { logger } from '../../../utils/logger.js';
import { bookShipment } from '../../../utils/shipping.js';
import { razorpayService } from '../../../services/razorpay.service.js';
import Order from '../models/order.model.js';

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/**
 * Payment Controller
 * Handles all payment-related operations
 */

class PaymentController {

  /**
   * Create payment order
   */
  static async createPaymentOrder(req, res, next) {
    try {
      const { orderId, amount, currency = 'INR' } = req.body;
      const customerId = req.user.id; // Assuming user authentication middleware

      // Validate order exists and belongs to customer
      const order = await Order.findOne({ _id: orderId, customerId });
      if (!order) {
        return next(new AppError('Order not found', 404));
      }

      // Create Razorpay order
      const razorpayResult = await razorpayService.createOrder({
        amount,
        currency,
        receipt: `order_${orderId}_${Date.now()}`,
        notes: {
          orderId: orderId.toString(),
          customerId: customerId.toString(),
          customerEmail: req.user.email
        }
      });

      if (!razorpayResult.success) {
        return next(new AppError('Failed to create payment order', 500));
      }

      // Create payment record in database
      const payment = new Payment({
        orderId,
        customerId,
        razorpayOrderId: razorpayResult.order.id,
        amount,
        currency,
        status: 'created',
        metadata: {
          createdAt: new Date(),
          razorpayOrderData: razorpayResult.order
        }
      });

      await payment.save();

      console.log('💳 Payment order created:', {
        paymentId: payment._id,
        razorpayOrderId: razorpayResult.order.id,
        amount,
        orderId
      });

      res.status(201).json({
        success: true,
        data: {
          paymentId: payment._id,
          razorpayOrder: razorpayResult.order,
          keyId: razorpayResult.keyId,
          amount,
          currency,
          prefill: {
            name: req.user.name,
            email: req.user.email,
            contact: req.user.phone
          }
        }
      });

    } catch (error) {
      console.error('❌ Error creating payment order:', error);
      next(new AppError(error.message, 500));
    }
  }

  /**
   * Verify payment
   */
  static async verifyPayment(req, res, next) {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
      const customerId = req.user.id;

      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return next(new AppError('Missing payment verification data', 400));
      }

      // Find payment record
      const payment = await Payment.findOne({ 
        razorpayOrderId: razorpay_order_id,
        customerId 
      });

      if (!payment) {
        return next(new AppError('Payment record not found', 404));
      }

      // Process payment verification
      const verificationResult = await razorpayService.processPaymentVerification({
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature
      });

      if (!verificationResult.success) {
        return next(new AppError(verificationResult.error, 400));
      }

      // Update order status if payment is successful
      if (verificationResult.payment.status === 'completed') {
        await Order.findByIdAndUpdate(payment.orderId, {
          paymentStatus: 'paid',
          status: 'confirmed',
          paidAt: new Date()
        });
      }

      console.log('✅ Payment verified successfully:', {
        paymentId: payment._id,
        razorpayPaymentId: razorpay_payment_id,
        status: verificationResult.payment.status
      });

      res.json({
        success: true,
        data: {
          payment: verificationResult.payment,
          razorpayPayment: verificationResult.razorpayPayment,
          verified: true
        }
      });

    } catch (error) {
      console.error('❌ Error verifying payment:', error);
      next(new AppError(error.message, 500));
    }
  }

  /**
   * Get payment details
   */
  static async getPayment(req, res, next) {
    try {
      const { paymentId } = req.params;
      const customerId = req.user.id;

      const payment = await Payment.findOne({ 
        _id: paymentId, 
        customerId 
      }).populate('orderId');

      if (!payment) {
        return next(new AppError('Payment not found', 404));
      }

      res.json({
        success: true,
        data: { payment }
      });

    } catch (error) {
      console.error('❌ Error fetching payment:', error);
      next(new AppError(error.message, 500));
    }
  }

  /**
   * Get customer payments
   */
  static async getCustomerPayments(req, res, next) {
    try {
      const customerId = req.user.id;
      const { page = 1, limit = 10, status } = req.query;

      const filter = { customerId };
      if (status) filter.status = status;

      const payments = await Payment.find(filter)
        .populate('orderId', 'orderNumber totalAmount status')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await Payment.countDocuments(filter);

      res.json({
        success: true,
        data: {
          payments,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
          }
        }
      });

    } catch (error) {
      console.error('❌ Error fetching customer payments:', error);
      next(new AppError(error.message, 500));
    }
  }

  /**
   * Create refund
   */
  static async createRefund(req, res, next) {
    try {
      const { paymentId } = req.params;
      const { amount, reason } = req.body;
      const customerId = req.user.id;

      // Find payment
      const payment = await Payment.findOne({ 
        _id: paymentId, 
        customerId 
      });

      if (!payment) {
        return next(new AppError('Payment not found', 404));
      }

      if (!payment.canBeRefunded()) {
        return next(new AppError('Payment cannot be refunded', 400));
      }

      // Create refund via Razorpay
      const refundResult = await razorpayService.createRefund(
        payment.razorpayPaymentId,
        {
          amount,
          notes: {
            reason,
            requestedBy: customerId.toString(),
            paymentId: paymentId.toString()
          }
        }
      );

      if (!refundResult.success) {
        return next(new AppError('Failed to create refund', 500));
      }

      // Update payment record
      await Payment.findByIdAndUpdate(paymentId, {
        refundId: refundResult.refund.id,
        refundAmount: refundResult.refund.amount / 100, // Convert from paise
        refundStatus: 'pending',
        metadata: {
          ...payment.metadata,
          refundCreatedAt: new Date(),
          refundReason: reason
        }
      });

      console.log('💸 Refund initiated:', {
        paymentId,
        refundId: refundResult.refund.id,
        amount: refundResult.refund.amount / 100
      });

      res.json({
        success: true,
        data: {
          refund: refundResult.refund,
          message: 'Refund initiated successfully'
        }
      });

    } catch (error) {
      console.error('❌ Error creating refund:', error);
      next(new AppError(error.message, 500));
    }
  }

  /**
   * Get payment statistics
   */
  static async getPaymentStats(req, res, next) {
    try {
      const customerId = req.user.id;
      const { startDate, endDate } = req.query;

      const stats = await Payment.getPaymentStats(customerId, startDate, endDate);

      res.json({
        success: true,
        data: { stats }
      });

    } catch (error) {
      console.error('❌ Error fetching payment stats:', error);
      next(new AppError(error.message, 500));
    }
  }

  /**
   * Get Razorpay configuration
   */
  static async getRazorpayConfig(req, res, next) {
    try {
      const config = razorpayService.getConfig();
      
      res.json({
        success: true,
        data: { config }
      });

    } catch (error) {
      console.error('❌ Error fetching Razorpay config:', error);
      next(new AppError(error.message, 500));
    }
  }

  /**
   * Health check for payment service
   */
  static async healthCheck(req, res, next) {
    try {
      const razorpayHealth = await razorpayService.healthCheck();
      
      res.json({
        success: true,
        data: {
          service: 'payment',
          status: razorpayHealth.status,
          razorpay: razorpayHealth,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('❌ Payment health check failed:', error);
      next(new AppError(error.message, 500));
    }
  }
}

export default PaymentController; 