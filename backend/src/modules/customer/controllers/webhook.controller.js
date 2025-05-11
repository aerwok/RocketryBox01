import crypto from 'crypto';
import { AppError } from '../../../middleware/errorHandler.js';
import Order from '../models/order.model.js';
import { sendEmail } from '../../../utils/email.js';
import { sendSMS, SMS_TEMPLATES } from '../../../utils/sms.js';

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