import crypto from 'crypto';
import Razorpay from 'razorpay';
import Payment from '../modules/customer/models/payment.model.js';

/**
 * Razorpay Service
 * Handles all Razorpay payment operations
 */

class RazorpayService {
  constructor() {
    // Initialize Razorpay instance with your credentials
    this.razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });

    // Validate credentials are provided
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      console.error('❌ Razorpay credentials not found in environment variables');
      console.error('Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in your .env file');
    }

    // console.log('🔧 Razorpay Service initialized with key:',
    //   process.env.RAZORPAY_KEY_ID || 'rzp_test_f3lgnRdSjAnm6y'
    // );
  }

  /**
   * Create Razorpay order
   */
  async createOrder(orderData) {
    try {
      const { amount, currency = 'INR', receipt, notes = {} } = orderData;

      // Convert amount to paise (Razorpay expects amount in smallest unit)
      const amountInPaise = Math.round(amount * 100);

      // Validate receipt length (Razorpay limit is 40 characters)
      let finalReceipt = receipt || `order_${Date.now()}`;
      if (finalReceipt.length > 40) {
        console.warn('⚠️ Receipt too long, truncating:', finalReceipt);
        finalReceipt = finalReceipt.substring(0, 40);
      }

      const razorpayOrder = await this.razorpay.orders.create({
        amount: amountInPaise,
        currency,
        receipt: finalReceipt,
        notes: {
          ...notes,
          created_by: 'RocketryBox',
          created_at: new Date().toISOString()
        }
      });

      console.log('✅ Razorpay order created:', {
        id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency
      });

      return {
        success: true,
        order: razorpayOrder,
        keyId: process.env.RAZORPAY_KEY_ID
      };

    } catch (error) {
      console.error('❌ Error creating Razorpay order:', error);
      return {
        success: false,
        error: error.message,
        details: error
      };
    }
  }

  /**
   * Verify payment signature
   */
  verifyPaymentSignature(paymentData) {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = paymentData;

      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return {
          success: true,
          isValid: false,
          error: 'Missing required payment data'
        };
      }

      // Create expected signature
      const body = razorpay_order_id + '|' + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(body.toString())
        .digest('hex');

      // Simple string comparison (secure enough for testing)
      const isValid = razorpay_signature === expectedSignature;

      console.log('🔐 Payment signature verification:', {
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        isValid
      });

      return {
        success: true,
        isValid,
        expectedSignature: isValid ? expectedSignature : undefined
      };

    } catch (error) {
      console.error('❌ Error verifying payment signature:', error);
      return {
        success: false,
        isValid: false,
        error: error.message
      };
    }
  }

  /**
   * Fetch payment details from Razorpay
   */
  async fetchPayment(paymentId) {
    try {
      const payment = await this.razorpay.payments.fetch(paymentId);

      console.log('📋 Payment details fetched:', {
        id: payment.id,
        status: payment.status,
        amount: payment.amount,
        method: payment.method
      });

      return {
        success: true,
        payment
      };

    } catch (error) {
      console.error('❌ Error fetching payment:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Create refund
   */
  async createRefund(paymentId, refundData = {}) {
    try {
      const { amount, notes = {} } = refundData;

      const refundOptions = {
        notes: {
          ...notes,
          refunded_by: 'RocketryBox',
          refunded_at: new Date().toISOString()
        }
      };

      // Add amount if partial refund
      if (amount) {
        refundOptions.amount = Math.round(amount * 100); // Convert to paise
      }

      const refund = await this.razorpay.payments.refund(paymentId, refundOptions);

      console.log('💸 Refund created:', {
        id: refund.id,
        paymentId: refund.payment_id,
        amount: refund.amount,
        status: refund.status
      });

      return {
        success: true,
        refund
      };

    } catch (error) {
      console.error('❌ Error creating refund:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Fetch order details
   */
  async fetchOrder(orderId) {
    try {
      const order = await this.razorpay.orders.fetch(orderId);

      console.log('📄 Order details fetched:', {
        id: order.id,
        status: order.status,
        amount: order.amount
      });

      return {
        success: true,
        order
      };

    } catch (error) {
      console.error('❌ Error fetching order:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch order',
        details: error
      };
    }
  }

  /**
   * Get all payments for an order
   */
  async getOrderPayments(orderId) {
    try {
      const payments = await this.razorpay.orders.fetchPayments(orderId);

      console.log('💳 Order payments fetched:', {
        orderId,
        paymentCount: payments.count,
        totalAmount: payments.items.reduce((sum, p) => sum + p.amount, 0)
      });

      return {
        success: true,
        payments: payments.items,
        count: payments.count
      };

    } catch (error) {
      console.error('❌ Error fetching order payments:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Process payment verification and update database
   */
  async processPaymentVerification(paymentData) {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = paymentData;

      // Step 1: Verify signature
      const signatureVerification = this.verifyPaymentSignature(paymentData);
      if (!signatureVerification.isValid) {
        return {
          success: false,
          error: 'Invalid payment signature'
        };
      }

      // Step 2: Fetch payment details from Razorpay
      const paymentDetails = await this.fetchPayment(razorpay_payment_id);
      if (!paymentDetails.success) {
        return {
          success: false,
          error: 'Failed to fetch payment details'
        };
      }

      // Step 3: Find payment in database
      const payment = await Payment.findOne({ razorpayOrderId: razorpay_order_id });
      if (!payment) {
        return {
          success: false,
          error: 'Payment record not found'
        };
      }

      // Step 4: Update payment status
      const updatedPayment = await Payment.findByIdAndUpdate(
        payment._id,
        {
          razorpayPaymentId: razorpay_payment_id,
          razorpaySignature: razorpay_signature,
          status: paymentDetails.payment.status === 'captured' ? 'completed' : 'attempted',
          paymentMethod: paymentDetails.payment.method,
          paidAt: paymentDetails.payment.status === 'captured' ? new Date() : undefined,
          metadata: {
            ...payment.metadata,
            verificationProcessedAt: new Date(),
            razorpayData: paymentDetails.payment
          }
        },
        { new: true }
      );

      console.log('✅ Payment verification processed:', {
        paymentId: payment._id,
        razorpayPaymentId: razorpay_payment_id,
        status: updatedPayment.status
      });

      return {
        success: true,
        payment: updatedPayment,
        razorpayPayment: paymentDetails.payment
      };

    } catch (error) {
      console.error('❌ Error processing payment verification:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get Razorpay configuration for frontend
   */
  getConfig() {
    return {
      keyId: process.env.RAZORPAY_KEY_ID,
      currency: 'INR',
      prefill: {
        name: '',
        email: '',
        contact: ''
      },
      theme: {
        color: '#2563eb' // RocketryBox blue theme
      },
      modal: {
        ondismiss: function () {
          console.log('Payment modal closed');
        }
      }
    };
  }

  /**
   * Health check for Razorpay service
   */
  async healthCheck() {
    try {
      // Try to create a test order with minimum amount
      const testOrder = await this.razorpay.orders.create({
        amount: 100, // ₹1 in paise
        currency: 'INR',
        receipt: `health_check_${Date.now()}`,
        notes: {
          purpose: 'health_check',
          created_at: new Date().toISOString()
        }
      });

      console.log('🩺 Razorpay health check passed:', testOrder.id);

      return {
        success: true,
        status: 'healthy',
        testOrderId: testOrder.id,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Razorpay health check failed:', error);
      return {
        success: false,
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

// Export singleton instance
export const razorpayService = new RazorpayService();
export default razorpayService;
