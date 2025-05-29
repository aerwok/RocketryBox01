import Razorpay from 'razorpay';
import crypto from 'crypto';
import { AppError } from '../../../middleware/errorHandler.js';
import CustomerOrder from '../models/customerOrder.model.js';
import Payment from '../models/payment.model.js';
import { logger } from '../../../utils/logger.js';
import { bookShipment } from '../../../utils/shipping.js';

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/**
 * Create Razorpay payment order
 */
export const createPaymentOrder = async (req, res, next) => {
  try {
    const { orderId, amount } = req.body;
    const customerId = req.user.id;

    // Validate order exists and belongs to customer
    const order = await CustomerOrder.findOne({ 
      _id: orderId, 
      customerId: customerId,
      paymentStatus: 'pending'
    });

    if (!order) {
      return next(new AppError('Order not found or already paid', 404));
    }

    // Create Razorpay order
    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(amount * 100), // Convert to paise
      currency: 'INR',
      receipt: `order_${order.orderNumber}`,
      notes: {
        orderId: order._id.toString(),
        customerId: customerId,
        orderNumber: order.orderNumber
      }
    });

    // Create payment record
    const payment = new Payment({
      orderId: order._id,
      customerId: customerId,
      razorpayOrderId: razorpayOrder.id,
      amount: amount,
      currency: 'INR',
      status: 'created'
    });

    await payment.save();

    logger.info('Payment order created:', {
      orderId: order._id,
      razorpayOrderId: razorpayOrder.id,
      amount: amount
    });

    res.status(200).json({
      success: true,
      data: {
        razorpayOrderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        orderId: order._id
      }
    });
  } catch (error) {
    logger.error('Error creating payment order:', error);
    next(new AppError('Failed to create payment order', 500));
  }
};

/**
 * Verify payment and generate AWB
 */
export const verifyPayment = async (req, res, next) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderId
    } = req.body;

    const customerId = req.user.id;

    // Find payment record
    const payment = await Payment.findOne({
      razorpayOrderId: razorpay_order_id,
      customerId: customerId
    });

    if (!payment) {
      return next(new AppError('Payment record not found', 404));
    }

    // Verify signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      // Update payment status to failed
      payment.status = 'failed';
      payment.failureReason = 'Invalid signature';
      await payment.save();

      return next(new AppError('Payment verification failed', 400));
    }

    // Find the order
    const order = await CustomerOrder.findById(orderId);
    if (!order) {
      return next(new AppError('Order not found', 404));
    }

    // Update payment record
    payment.razorpayPaymentId = razorpay_payment_id;
    payment.razorpaySignature = razorpay_signature;
    payment.status = 'completed';
    payment.paidAt = new Date();
    await payment.save();

    // Update order status
    order.paymentStatus = 'paid';
    order.status = 'confirmed';
    order.paymentId = payment._id;
    await order.save();

    logger.info('Payment verified successfully:', {
      orderId: order._id,
      paymentId: razorpay_payment_id,
      amount: payment.amount
    });

    // Generate AWB asynchronously
    generateAWBAsync(order);

    res.status(200).json({
      success: true,
      data: {
        paymentId: razorpay_payment_id,
        orderId: order._id,
        status: 'verified'
      }
    });
  } catch (error) {
    logger.error('Error verifying payment:', error);
    next(new AppError('Payment verification failed', 500));
  }
};

/**
 * Generate AWB asynchronously after payment
 */
const generateAWBAsync = async (order) => {
  try {
    logger.info('Starting AWB generation for order:', order._id);

    // Prepare shipment details for booking
    const shipmentDetails = {
      serviceType: order.selectedProvider.serviceType,
      weight: order.packageDetails.weight,
      dimensions: order.packageDetails.dimensions,
      declaredValue: order.packageDetails.declaredValue,
      cod: false, // Always prepaid for customers
      codAmount: 0,
      
      // Shipper details (pickup)
      shipper: {
        name: order.pickupAddress.name,
        phone: order.pickupAddress.phone,
        email: order.pickupAddress.email || '',
        address: order.pickupAddress.address
      },
      
      // Consignee details (delivery)
      consignee: {
        name: order.deliveryAddress.name,
        phone: order.deliveryAddress.phone,
        email: order.deliveryAddress.email || '',
        address: order.deliveryAddress.address
      },
      
      // Additional details
      referenceNumber: order.orderNumber,
      invoiceNumber: order.orderNumber,
      commodity: 'General Goods'
    };

    // Book shipment with the selected provider
    const bookingResponse = await bookShipment(
      order.selectedProvider.name,
      shipmentDetails
    );

    if (bookingResponse.success) {
      // Update order with AWB details
      order.awb = bookingResponse.awb;
      order.trackingUrl = bookingResponse.trackingUrl;
      order.courierPartner = bookingResponse.courierName;
      order.bookingType = bookingResponse.bookingType;
      order.status = 'shipped';
      
      if (bookingResponse.bookingType === 'MANUAL_REQUIRED') {
        order.notes = `Manual booking required. ${bookingResponse.message}`;
      }
      
      await order.save();

      logger.info('AWB generated successfully:', {
        orderId: order._id,
        awb: bookingResponse.awb,
        courier: bookingResponse.courierName,
        bookingType: bookingResponse.bookingType
      });
    } else {
      // AWB generation failed, but order is still confirmed
      order.status = 'confirmed';
      order.notes = `AWB generation failed: ${bookingResponse.error}. Manual processing required.`;
      await order.save();

      logger.error('AWB generation failed:', {
        orderId: order._id,
        error: bookingResponse.error
      });
    }
  } catch (error) {
    logger.error('Error in AWB generation:', {
      orderId: order._id,
      error: error.message
    });
    
    // Update order with error note
    try {
      order.status = 'confirmed';
      order.notes = `AWB generation error: ${error.message}. Manual processing required.`;
      await order.save();
    } catch (saveError) {
      logger.error('Failed to update order with AWB error:', saveError);
    }
  }
};

/**
 * Get payment history for customer
 */
export const getPaymentHistory = async (req, res, next) => {
  try {
    const customerId = req.user.id;
    const { page = 1, limit = 10 } = req.query;

    const payments = await Payment.find({ customerId })
      .populate('orderId', 'orderNumber status totalAmount')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Payment.countDocuments({ customerId });

    res.status(200).json({
      success: true,
      data: payments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Error fetching payment history:', error);
    next(new AppError('Failed to fetch payment history', 500));
  }
};

/**
 * Get payment details by ID
 */
export const getPaymentById = async (req, res, next) => {
  try {
    const { paymentId } = req.params;
    const customerId = req.user.id;

    const payment = await Payment.findOne({
      _id: paymentId,
      customerId: customerId
    }).populate('orderId');

    if (!payment) {
      return next(new AppError('Payment not found', 404));
    }

    res.status(200).json({
      success: true,
      data: payment
    });
  } catch (error) {
    logger.error('Error fetching payment details:', error);
    next(new AppError('Failed to fetch payment details', 500));
  }
}; 