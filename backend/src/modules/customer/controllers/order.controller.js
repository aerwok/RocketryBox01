import Order from '../models/order.model.js';
import Customer from '../models/customer.model.js';
import { AppError } from '../../../middleware/errorHandler.js';
import { sendEmail } from '../../../utils/email.js';
import { sendSMS, SMS_TEMPLATES } from '../../../utils/sms.js';
import { calculateShippingRates } from '../../../utils/shipping.js';
import { createPaymentOrder, verifyPayment } from '../../../utils/payment.js';
import { calculateCourierRates } from '../../../utils/courierRates.js';
import { getDelhiveryRates } from '../../../utils/delhivery.js';
import { getBluedartRates } from '../../../utils/bluedart.js';
import { getDTDCRates } from '../../../utils/dtdc.js';
import { getEkartRates } from '../../../utils/ekart.js';
import { getXpressbeesRates } from '../../../utils/xpressbees.js';
import { emitEvent, EVENT_TYPES } from '../../../utils/eventEmitter.js';

// Create new order
export const createOrder = async (req, res, next) => {
  try {
    const {
      pickupAddress,
      deliveryAddress,
      package: packageDetails,
      serviceType,
      paymentMethod,
      instructions,
      pickupDate
    } = req.body;

    // Calculate shipping rates
    const rates = await calculateShippingRates({
      weight: packageDetails.weight,
      dimensions: packageDetails.dimensions,
      pickupPincode: pickupAddress.pincode,
      deliveryPincode: deliveryAddress.pincode,
      serviceType
    });

    if (!rates.success) {
      return next(new AppError('Failed to calculate shipping rates', 400));
    }

    // Create order
    const order = await Order.create({
      customer: req.user.id,
      pickupAddress,
      deliveryAddress,
      package: packageDetails,
      serviceType,
      paymentMethod,
      amount: rates.data.totalRate,
      estimatedDelivery: rates.data.estimatedDelivery,
      instructions,
      pickupDate: new Date(pickupDate)
    });

    // Emit order created event for real-time dashboard updates
    emitEvent(EVENT_TYPES.ORDER_CREATED, {
      orderId: order._id,
      awb: order.awb,
      customerId: req.user.id,
      amount: order.amount,
      status: order.status
    });

    // Send order confirmation
    const customer = await Customer.findById(req.user.id);
    if (customer.preferences.notifications.email) {
      await sendEmail({
        to: customer.email,
        subject: 'Order Confirmation - RocketryBox',
        text: `Your order has been created successfully. AWB Number: ${order.awb}`
      });
    }

    if (customer.preferences.notifications.sms) {
      await sendSMS({
        to: customer.phone,
        templateId: SMS_TEMPLATES.TRACKING_UPDATE.templateId,
        variables: {
          trackingId: order.awb,
          status: 'Booked',
          location: pickupAddress.city
        }
      });
    }

    res.status(201).json({
      success: true,
      data: {
        message: 'Order created successfully',
        order: {
          id: order._id,
          awb: order.awb,
          status: order.status,
          estimatedDelivery: order.estimatedDelivery,
          amount: order.amount,
          label: order.label,
          createdAt: order.createdAt
        }
      }
    });
  } catch (error) {
    next(new AppError(error.message, 400));
  }
};

// List orders
export const listOrders = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      query,
      sortField = 'createdAt',
      sortDirection = 'desc',
      status,
      startDate,
      endDate
    } = req.query;

    // Build query
    const filter = { customer: req.user.id };
    if (status) filter.status = status;
    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    if (query) {
      filter.$or = [
        { awb: { $regex: query, $options: 'i' } },
        { 'pickupAddress.city': { $regex: query, $options: 'i' } },
        { 'deliveryAddress.city': { $regex: query, $options: 'i' } }
      ];
    }

    // Execute query
    const orders = await Order.find(filter)
      .sort({ [sortField]: sortDirection === 'desc' ? -1 : 1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Order.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: {
        orders,
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(new AppError(error.message, 400));
  }
};

// Get order details
export const getOrderDetails = async (req, res, next) => {
  try {
    const { awb } = req.params;

    const order = await Order.findOne({
      awb,
      customer: req.user.id
    });

    if (!order) {
      return next(new AppError('Order not found', 404));
    }

    res.status(200).json({
      success: true,
      data: {
        order,
        tracking: {
          status: order.tracking.status,
          currentLocation: order.tracking.currentLocation,
          estimatedDelivery: order.estimatedDelivery,
          timeline: order.getStatusTimeline()
        }
      }
    });
  } catch (error) {
    next(new AppError(error.message, 400));
  }
};

// Download order label
export const downloadLabel = async (req, res, next) => {
  try {
    const { awb } = req.params;

    const order = await Order.findOne({
      awb,
      customer: req.user.id
    }).select('+label');

    if (!order) {
      return next(new AppError('Order not found', 404));
    }

    if (!order.label) {
      return next(new AppError('Label not available', 404));
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=label-${awb}.pdf`);
    res.send(Buffer.from(order.label, 'base64'));
  } catch (error) {
    next(new AppError(error.message, 400));
  }
};

// Create payment order
export const createPayment = async (req, res, next) => {
  try {
    const { amount, currency, awbNumber, paymentMethod } = req.body;

    const order = await Order.findOne({
      awb: awbNumber,
      customer: req.user.id
    });

    if (!order) {
      return next(new AppError('Order not found', 404));
    }

    if (order.status !== 'Booked') {
      return next(new AppError('Order cannot be paid', 400));
    }

    const paymentOrder = await createPaymentOrder({
      amount,
      currency,
      awbNumber,
      paymentMethod
    });

    res.status(200).json({
      success: true,
      data: paymentOrder
    });
  } catch (error) {
    next(new AppError(error.message, 400));
  }
};

// Verify payment
export const verifyPayment = async (req, res, next) => {
  try {
    const {
      awbNumber,
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature
    } = req.body;

    const order = await Order.findOne({
      awb: awbNumber,
      customer: req.user.id
    });

    if (!order) {
      return next(new AppError('Order not found', 404));
    }

    const payment = await verifyPayment({
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature
    });

    if (payment.success) {
      order.status = 'Processing';
      await order.save();

      // Send payment confirmation
      const customer = await Customer.findById(req.user.id);
      if (customer.preferences.notifications.email) {
        await sendEmail({
          to: customer.email,
          subject: 'Payment Confirmation - RocketryBox',
          text: `Payment successful for order ${order.awb}. Amount: ${order.amount}`
        });
      }

      if (customer.preferences.notifications.sms) {
        await sendSMS({
          to: customer.phone,
          templateId: SMS_TEMPLATES.TRACKING_UPDATE.templateId,
          variables: {
            trackingId: order.awb,
            status: 'Processing',
            location: order.pickupAddress.city
          }
        });
      }
    }

    res.status(200).json({
      success: true,
      data: {
        message: 'Payment verified successfully',
        payment
      }
    });
  } catch (error) {
    next(new AppError(error.message, 400));
  }
};

// Subscribe to tracking updates
export const subscribeTracking = async (req, res, next) => {
  try {
    const { awb } = req.params;
    const { channels, frequency } = req.body;

    const order = await Order.findOne({
      awb,
      customer: req.user.id
    });

    if (!order) {
      return next(new AppError('Order not found', 404));
    }

    // Add tracking subscription
    order.tracking.subscription = {
      channels,
      frequency,
      status: 'active'
    };

    await order.save();

    res.status(200).json({
      success: true,
      data: {
        message: 'Tracking subscription successful',
        subscription: order.tracking.subscription
      }
    });
  } catch (error) {
    next(new AppError(error.message, 400));
  }
};

// Refund payment
export const refundPayment = async (req, res, next) => {
  try {
    const { awb } = req.params;
    const { amount, reason } = req.body;

    const order = await Order.findOne({
      awb,
      customer: req.user.id
    });

    if (!order) {
      return next(new AppError('Order not found', 404));
    }

    if (order.status === 'Delivered') {
      return next(new AppError('Cannot refund a delivered order', 400));
    }

    const refund = await refundPayment({
      paymentId: order.paymentId,
      amount,
      notes: {
        reason,
        awb: order.awb
      }
    });

    if (!refund.success) {
      return next(new AppError(refund.error, 400));
    }

    // Update order status
    order.status = 'Cancelled';
    order.refund = {
      id: refund.data.refundId,
      amount: refund.data.amount,
      status: refund.data.status,
      createdAt: refund.data.createdAt
    };
    await order.save();

    // Send refund notification
    const customer = await Customer.findById(req.user.id);
    if (customer.preferences.notifications.email) {
      await sendEmail({
        to: customer.email,
        subject: 'Refund Processed - RocketryBox',
        text: `Refund of ${refund.data.amount} has been processed for order ${order.awb}.`
      });
    }

    if (customer.preferences.notifications.sms) {
      await sendSMS({
        to: customer.phone,
        templateId: SMS_TEMPLATES.REFUND_PROCESSED.templateId,
        variables: {
          amount: refund.data.amount,
          awb: order.awb
        }
      });
    }

    res.status(200).json({
      success: true,
      data: {
        message: 'Refund processed successfully',
        refund: refund.data
      }
    });
  } catch (error) {
    next(new AppError(error.message, 400));
  }
};

// Check payment status
export const checkPaymentStatus = async (req, res, next) => {
  try {
    const { awb } = req.params;

    const order = await Order.findOne({
      awb,
      customer: req.user.id
    }).select('+paymentId');

    if (!order) {
      return next(new AppError('Order not found', 404));
    }

    if (!order.paymentId) {
      return res.status(200).json({
        success: true,
        data: {
          status: 'pending',
          message: 'Payment not initiated'
        }
      });
    }

    const payment = await getPaymentStatus(order.paymentId);

    res.status(200).json({
      success: true,
      data: {
        status: payment.status,
        amount: payment.amount,
        currency: payment.currency,
        createdAt: payment.created_at,
        updatedAt: payment.updated_at
      }
    });
  } catch (error) {
    next(new AppError(error.message, 400));
  }
};

export const calculateRates = async (req, res, next) => {
  try {
    const { weight, pickupPincode, deliveryPincode, serviceType } = req.body;
    const isCOD = false; // COD not allowed for customers

    // Fetch real-time rates from all partners in parallel
    const [delhivery, bluedart, dtdc, ekart, xpressbees, staticRates] = await Promise.all([
      getDelhiveryRates({ pickupPincode, deliveryPincode, weight, cod: isCOD }),
      getBluedartRates({ pickupPincode, deliveryPincode, weight, cod: isCOD }),
      getDTDCRates({ pickupPincode, deliveryPincode, weight, cod: isCOD }),
      getEkartRates({ pickupPincode, deliveryPincode, weight, cod: isCOD }),
      getXpressbeesRates({ pickupPincode, deliveryPincode, weight, cod: isCOD }),
      calculateCourierRates({ weight, pickupPincode, deliveryPincode, isCOD })
    ]);

    // Merge and flatten all rates
    const rates = [
      ...delhivery,
      ...bluedart,
      ...dtdc,
      ...ekart,
      ...xpressbees,
      ...staticRates
    ];

    // Sort rates by price (lowest first)
    rates.sort((a, b) => a.rate - b.rate);

    res.status(200).json({
      success: true,
      data: {
        rates,
        summary: {
          totalCouriers: rates.length,
          cheapestRate: rates[0]?.rate || 0,
          fastestDelivery: rates.reduce((fastest, current) => {
            // Parse days from estimatedDelivery string
            const currentDays = parseInt((current.estimatedDelivery || '').split('-')[0]);
            const fastestDays = parseInt((fastest.estimatedDelivery || '').split('-')[0]);
            return currentDays < fastestDays ? current : fastest;
          }, rates[0])?.estimatedDelivery || 'N/A'
        }
      }
    });
  } catch (error) {
    next(new AppError(error.message, 400));
  }
}; 