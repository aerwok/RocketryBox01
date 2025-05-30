import crypto from 'crypto';
import { AppError } from '../../../middleware/errorHandler.js';
import Order from '../models/order.model.js';
import { sendEmail } from '../../../utils/email.js';
import { sendSMS, SMS_TEMPLATES } from '../../../utils/sms.js';
import Payment from '../models/payment.model.js';

// Verify webhook signature
const verifyWebhookSignature = (payload, signature) => {
  const hmac = crypto.createHmac('sha256', process.env.WEBHOOK_SECRET);
  const calculatedSignature = hmac.update(JSON.stringify(payload)).digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(calculatedSignature)
  );
};

// Handle tracking webhook
export const handleTrackingWebhook = async (req, res, next) => {
  try {
    const signature = req.headers['x-webhook-signature'];
    if (!signature) {
      return next(new AppError('Missing webhook signature', 401));
    }

    if (!verifyWebhookSignature(req.body, signature)) {
      return next(new AppError('Invalid webhook signature', 401));
    }

    const { awb, status, location, description, code } = req.body;

    const order = await Order.findOne({ awb });
    if (!order) {
      return next(new AppError('Order not found', 404));
    }

    // Update tracking information
    order.tracking.status = status;
    order.tracking.currentLocation = location;
    order.tracking.timeline.push({
      status,
      location,
      timestamp: new Date(),
      description,
      code
    });

    // Update order status if needed
    if (status === 'In Transit') {
      order.status = 'In Transit';
    } else if (status === 'Out for Delivery') {
      order.status = 'Out for Delivery';
    } else if (status === 'Delivered') {
      order.status = 'Delivered';
    }

    await order.save();

    // Send notifications based on subscription preferences
    const customer = await order.populate('customer');
    if (customer.tracking.subscription) {
      const { channels, frequency } = customer.tracking.subscription;

      if (channels.includes('email') && customer.preferences.notifications.email) {
        await sendEmail({
          to: customer.email,
          subject: `Tracking Update - Order ${awb}`,
          text: `Your order ${awb} is now ${status} at ${location}. ${description}`
        });
      }

      if (channels.includes('sms') && customer.preferences.notifications.sms) {
        await sendSMS({
          to: customer.phone,
          templateId: SMS_TEMPLATES.TRACKING_UPDATE.templateId,
          variables: {
            trackingId: awb,
            status,
            location
          }
        });
      }
    }

    res.status(200).json({
      success: true,
      data: {
        message: 'Tracking update processed successfully'
      }
    });
  } catch (error) {
    next(new AppError(error.message, 400));
  }
};

/**
 * Razorpay Webhook Controller
 * Handles automatic payment status updates via webhooks
 */

class WebhookController {

  /**
   * Handle Razorpay webhook events
   */
  static async handleRazorpayWebhook(req, res) {
    try {
      console.log('🔔 Razorpay webhook received:', {
        event: req.body.event,
        paymentId: req.body.payload?.payment?.entity?.id,
        timestamp: new Date().toISOString()
      });

      // Verify webhook signature
      const isValidSignature = WebhookController.verifyWebhookSignature(
        req.body,
        req.headers['x-razorpay-signature'],
        process.env.RAZORPAY_WEBHOOK_SECRET
      );

      if (!isValidSignature) {
        console.error('❌ Invalid webhook signature');
        return res.status(400).json({
          success: false,
          error: 'Invalid webhook signature'
        });
      }

      const { event, payload } = req.body;
      
      // Handle different webhook events
      switch (event) {
        case 'payment.captured':
          await WebhookController.handlePaymentCaptured(payload.payment.entity);
          break;
          
        case 'payment.failed':
          await WebhookController.handlePaymentFailed(payload.payment.entity);
          break;
          
        case 'payment.authorized':
          await WebhookController.handlePaymentAuthorized(payload.payment.entity);
          break;
          
        case 'order.paid':
          await WebhookController.handleOrderPaid(payload.order.entity, payload.payment.entity);
          break;
          
        case 'refund.created':
          await WebhookController.handleRefundCreated(payload.refund.entity);
          break;
          
        case 'refund.processed':
          await WebhookController.handleRefundProcessed(payload.refund.entity);
          break;
          
        default:
          console.log(`ℹ️ Unhandled webhook event: ${event}`);
      }

      // Always respond with 200 to acknowledge receipt
      res.status(200).json({
        success: true,
        message: 'Webhook processed successfully'
      });

    } catch (error) {
      console.error('❌ Webhook processing error:', error);
      
      // Still return 200 to avoid webhook retries for application errors
      res.status(200).json({
        success: false,
        error: 'Webhook processing failed',
        details: error.message
      });
    }
  }

  /**
   * Verify Razorpay webhook signature
   */
  static verifyWebhookSignature(payload, signature, secret) {
    try {
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(JSON.stringify(payload))
        .digest('hex');
      
      return crypto.timingSafeEqual(
        Buffer.from(signature, 'utf8'),
        Buffer.from(expectedSignature, 'utf8')
      );
    } catch (error) {
      console.error('❌ Signature verification error:', error);
      return false;
    }
  }

  /**
   * Handle payment.captured event
   */
  static async handlePaymentCaptured(paymentEntity) {
    try {
      console.log('✅ Processing payment.captured:', paymentEntity.id);
      
      const payment = await Payment.findOne({ 
        razorpayOrderId: paymentEntity.order_id 
      });
      
      if (!payment) {
        console.error('❌ Payment not found for order:', paymentEntity.order_id);
        return;
      }

      // Update payment status
      await Payment.findByIdAndUpdate(payment._id, {
        razorpayPaymentId: paymentEntity.id,
        status: 'completed',
        paymentMethod: paymentEntity.method,
        paidAt: new Date(paymentEntity.created_at * 1000),
        metadata: {
          ...payment.metadata,
          webhookProcessedAt: new Date(),
          razorpayData: {
            method: paymentEntity.method,
            bank: paymentEntity.bank,
            wallet: paymentEntity.wallet,
            vpa: paymentEntity.vpa,
            card_id: paymentEntity.card_id
          }
        }
      });

      // Update order status
      await Order.findByIdAndUpdate(payment.orderId, {
        paymentStatus: 'paid',
        status: 'confirmed',
        paidAt: new Date()
      });

      console.log('✅ Payment captured successfully:', {
        paymentId: payment._id,
        razorpayPaymentId: paymentEntity.id,
        amount: paymentEntity.amount / 100 // Convert paise to rupees
      });

    } catch (error) {
      console.error('❌ Error handling payment.captured:', error);
      throw error;
    }
  }

  /**
   * Handle payment.failed event
   */
  static async handlePaymentFailed(paymentEntity) {
    try {
      console.log('❌ Processing payment.failed:', paymentEntity.id);
      
      const payment = await Payment.findOne({ 
        razorpayOrderId: paymentEntity.order_id 
      });
      
      if (!payment) {
        console.error('❌ Payment not found for order:', paymentEntity.order_id);
        return;
      }

      // Update payment status
      await Payment.findByIdAndUpdate(payment._id, {
        razorpayPaymentId: paymentEntity.id,
        status: 'failed',
        failureReason: paymentEntity.error_description || 'Payment failed',
        paymentMethod: paymentEntity.method,
        metadata: {
          ...payment.metadata,
          webhookProcessedAt: new Date(),
          errorCode: paymentEntity.error_code,
          errorDescription: paymentEntity.error_description,
          razorpayData: paymentEntity
        }
      });

      // Update order status
      await Order.findByIdAndUpdate(payment.orderId, {
        paymentStatus: 'failed',
        status: 'payment_failed'
      });

      console.log('❌ Payment failed:', {
        paymentId: payment._id,
        reason: paymentEntity.error_description
      });

    } catch (error) {
      console.error('❌ Error handling payment.failed:', error);
      throw error;
    }
  }

  /**
   * Handle payment.authorized event
   */
  static async handlePaymentAuthorized(paymentEntity) {
    try {
      console.log('🔄 Processing payment.authorized:', paymentEntity.id);
      
      const payment = await Payment.findOne({ 
        razorpayOrderId: paymentEntity.order_id 
      });
      
      if (!payment) {
        console.error('❌ Payment not found for order:', paymentEntity.order_id);
        return;
      }

      // Update payment status to attempted (authorized but not captured)
      await Payment.findByIdAndUpdate(payment._id, {
        razorpayPaymentId: paymentEntity.id,
        status: 'attempted',
        paymentMethod: paymentEntity.method,
        metadata: {
          ...payment.metadata,
          webhookProcessedAt: new Date(),
          razorpayData: paymentEntity
        }
      });

      console.log('🔄 Payment authorized:', {
        paymentId: payment._id,
        razorpayPaymentId: paymentEntity.id
      });

    } catch (error) {
      console.error('❌ Error handling payment.authorized:', error);
      throw error;
    }
  }

  /**
   * Handle order.paid event
   */
  static async handleOrderPaid(orderEntity, paymentEntity) {
    try {
      console.log('💰 Processing order.paid:', orderEntity.id);
      
      // This is a backup handler in case payment.captured wasn't processed
      const payment = await Payment.findOne({ 
        razorpayOrderId: orderEntity.id 
      });
      
      if (!payment) {
        console.error('❌ Payment not found for order:', orderEntity.id);
        return;
      }

      // Only update if not already completed
      if (payment.status !== 'completed') {
        await Payment.findByIdAndUpdate(payment._id, {
          razorpayPaymentId: paymentEntity.id,
          status: 'completed',
          paymentMethod: paymentEntity.method,
          paidAt: new Date(),
          metadata: {
            ...payment.metadata,
            webhookProcessedAt: new Date(),
            processedViaOrderPaid: true
          }
        });

        await Order.findByIdAndUpdate(payment.orderId, {
          paymentStatus: 'paid',
          status: 'confirmed',
          paidAt: new Date()
        });

        console.log('💰 Order paid processed:', {
          paymentId: payment._id,
          orderId: payment.orderId
        });
      }

    } catch (error) {
      console.error('❌ Error handling order.paid:', error);
      throw error;
    }
  }

  /**
   * Handle refund.created event
   */
  static async handleRefundCreated(refundEntity) {
    try {
      console.log('💸 Processing refund.created:', refundEntity.id);
      
      const payment = await Payment.findOne({ 
        razorpayPaymentId: refundEntity.payment_id 
      });
      
      if (!payment) {
        console.error('❌ Payment not found for refund:', refundEntity.payment_id);
        return;
      }

      // Update payment with refund information
      await Payment.findByIdAndUpdate(payment._id, {
        refundId: refundEntity.id,
        refundAmount: refundEntity.amount / 100, // Convert paise to rupees
        refundStatus: 'pending',
        metadata: {
          ...payment.metadata,
          refundCreatedAt: new Date(),
          refundData: refundEntity
        }
      });

      console.log('💸 Refund created:', {
        paymentId: payment._id,
        refundId: refundEntity.id,
        amount: refundEntity.amount / 100
      });

    } catch (error) {
      console.error('❌ Error handling refund.created:', error);
      throw error;
    }
  }

  /**
   * Handle refund.processed event
   */
  static async handleRefundProcessed(refundEntity) {
    try {
      console.log('✅ Processing refund.processed:', refundEntity.id);
      
      const payment = await Payment.findOne({ 
        refundId: refundEntity.id 
      });
      
      if (!payment) {
        console.error('❌ Payment not found for refund:', refundEntity.id);
        return;
      }

      // Update payment refund status
      await Payment.findByIdAndUpdate(payment._id, {
        refundStatus: 'processed',
        refundedAt: new Date(),
        status: 'refunded',
        metadata: {
          ...payment.metadata,
          refundProcessedAt: new Date(),
          refundData: refundEntity
        }
      });

      // Update order status
      await Order.findByIdAndUpdate(payment.orderId, {
        paymentStatus: 'refunded',
        status: 'refunded'
      });

      console.log('✅ Refund processed:', {
        paymentId: payment._id,
        refundId: refundEntity.id,
        amount: refundEntity.amount / 100
      });

    } catch (error) {
      console.error('❌ Error handling refund.processed:', error);
      throw error;
    }
  }

  /**
   * Get webhook statistics
   */
  static async getWebhookStats(req, res) {
    try {
      const stats = await Payment.aggregate([
        {
          $match: {
            'metadata.webhookProcessedAt': { $exists: true }
          }
        },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalAmount: { $sum: '$amount' }
          }
        }
      ]);

      res.json({
        success: true,
        data: {
          webhookStats: stats,
          lastProcessed: await Payment.findOne(
            { 'metadata.webhookProcessedAt': { $exists: true } },
            { 'metadata.webhookProcessedAt': 1, status: 1 }
          ).sort({ 'metadata.webhookProcessedAt': -1 })
        }
      });

    } catch (error) {
      console.error('❌ Error getting webhook stats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get webhook statistics'
      });
    }
  }
}

export default WebhookController; 