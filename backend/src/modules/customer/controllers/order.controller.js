import CustomerOrder from '../models/customerOrder.model.js';
import Customer from '../models/customer.model.js';
import { AppError } from '../../../middleware/errorHandler.js';
import { sendEmail } from '../../../utils/email.js';
import { sendSMS, SMS_TEMPLATES } from '../../../utils/sms.js';
import { calculateShippingRates } from '../../../utils/shipping.js';
import { createPaymentOrder, verifyPayment, getPaymentStatus } from '../../../utils/payment.js';
import { calculateCourierRates } from '../../../utils/courierRates.js';
import { calculateRate as calculateDelhiveryRate } from '../../../utils/delhivery.js';
import { calculateRate as calculateBluedartRate } from '../../../utils/bluedart.js';
import { calculateRate as calculateDTDCRate } from '../../../utils/dtdc.js';
import { calculateRate as calculateEkartRate } from '../../../utils/ekart.js';
import { calculateRate as calculateXpressbeesRate } from '../../../utils/xpressbees.js';
import { emitEvent, EVENT_TYPES } from '../../../utils/eventEmitter.js';
import { logger } from '../../../utils/logger.js';

// Create new order
/**
 * Get order by ID
 */
export const getOrderById = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const customerId = req.user.id;

    const order = await CustomerOrder.findOne({
      _id: orderId,
      customerId: customerId
    }).populate('paymentId');

    if (!order) {
      return next(new AppError('Order not found', 404));
    }

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    logger.error('Error fetching order:', error);
    next(new AppError('Failed to fetch order details', 500));
  }
};

/**
 * Get order history for customer
 */
export const getOrderHistory = async (req, res, next) => {
  try {
    const customerId = req.user.id;
    const { page = 1, limit = 10, status } = req.query;

    const filter = { customerId };
    if (status) {
      filter.status = status;
    }

    const orders = await CustomerOrder.find(filter)
      .populate('paymentId', 'status amount paidAt')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await CustomerOrder.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Error fetching order history:', error);
    next(new AppError('Failed to fetch order history', 500));
  }
};

export const createOrder = async (req, res, next) => {
  try {
    console.log('CreateOrder - Request body:', JSON.stringify(req.body, null, 2));
    console.log('CreateOrder - User:', req.user);
    
    const {
      pickupAddress,
      deliveryAddress,
      package: packageDetails,
      selectedProvider,
      serviceType,
      paymentMethod,
      instructions,
      pickupDate
    } = req.body;

    // Add validation for required fields
    if (!pickupAddress || !pickupAddress.pincode) {
      return next(new AppError('Pickup address with pincode is required', 400));
    }
    
    if (!deliveryAddress || !deliveryAddress.pincode) {
      return next(new AppError('Delivery address with pincode is required', 400));
    }
    
    if (!packageDetails || !packageDetails.weight) {
      return next(new AppError('Package details with weight is required', 400));
    }

    console.log('Pickup pincode:', pickupAddress.pincode);
    console.log('Delivery pincode:', deliveryAddress.pincode);
    console.log('Selected provider:', selectedProvider);

    let selectedRate;
    let totalRate;

    if (selectedProvider) {
      // Use the provider selected by the user
      selectedRate = {
        id: selectedProvider.id,
        courier: selectedProvider.name,
        provider: { name: selectedProvider.name, estimatedDays: selectedProvider.estimatedDays },
        totalRate: selectedProvider.totalRate,
        estimatedDelivery: selectedProvider.estimatedDays
      };
      totalRate = selectedProvider.totalRate;
      console.log('Using user-selected provider:', selectedProvider.name);
    } else {
      // Calculate shipping rates if no provider selected
      const rates = await calculateShippingRates({
        weight: packageDetails.weight,
        dimensions: packageDetails.dimensions,
        pickupPincode: pickupAddress.pincode,
        deliveryPincode: deliveryAddress.pincode,
        serviceType
      });

      if (!rates || rates.length === 0) {
        return next(new AppError('No shipping rates available for the given parameters', 400));
      }

      // Use the first (cheapest) rate for order creation
      selectedRate = rates[0];
      totalRate = selectedRate.totalRate || selectedRate.total || 0;
      console.log('Using calculated rate:', selectedRate);
    }
    
    // Calculate estimated delivery date (add 3-5 days to current date)
    const estimatedDeliveryDays = 3; // Default to 3 days
    const estimatedDeliveryDate = new Date();
    estimatedDeliveryDate.setDate(estimatedDeliveryDate.getDate() + estimatedDeliveryDays);

    // Ensure package has items array (required by schema)
    const packageData = {
      ...packageDetails,
      items: packageDetails.items || [
        {
          name: 'Package Item',
          quantity: 1,
          value: packageDetails.declaredValue || 100
        }
      ]
    };

    // Create order data matching CustomerOrder model structure
    const orderData = {
      customerId: req.user.id,
      packageDetails: {
        weight: packageDetails.weight,
        dimensions: packageDetails.dimensions || { length: 10, width: 10, height: 10 },
        declaredValue: packageDetails.declaredValue || 100
      },
      pickupAddress: {
        name: pickupAddress.name,
        phone: pickupAddress.phone,
        email: pickupAddress.email,
        address: {
          line1: pickupAddress.address1 || pickupAddress.line1,
          line2: pickupAddress.address2 || pickupAddress.line2,
          city: pickupAddress.city,
          state: pickupAddress.state,
          pincode: pickupAddress.pincode,
          country: pickupAddress.country || 'India'
        }
      },
      deliveryAddress: {
        name: deliveryAddress.name,
        phone: deliveryAddress.phone,
        email: deliveryAddress.email,
        address: {
          line1: deliveryAddress.address1 || deliveryAddress.line1,
          line2: deliveryAddress.address2 || deliveryAddress.line2,
          city: deliveryAddress.city,
          state: deliveryAddress.state,
          pincode: deliveryAddress.pincode,
          country: deliveryAddress.country || 'India'
        }
      },
      selectedProvider: {
        id: selectedRate.id || 'generic',
        name: selectedRate.provider?.name || selectedRate.courier || 'Generic Courier',
        serviceType: serviceType,
        totalRate: totalRate,
        estimatedDays: selectedRate.provider?.estimatedDays || selectedRate.estimatedDelivery || '3-5'
      },
      shippingRate: totalRate,
      totalAmount: totalRate + (totalRate * 0.18), // Add 18% service charges
      instructions: instructions || ''
    };

    console.log('Creating order with data:', JSON.stringify(orderData, null, 2));

    const order = await CustomerOrder.create(orderData);

    console.log('Order created successfully:', {
      id: order._id,
      awb: order.awb,
      status: order.status
    });

    // Emit order created event for real-time dashboard updates
    try {
      emitEvent(EVENT_TYPES.ORDER_CREATED, {
        orderId: order._id,
        orderNumber: order.orderNumber,
        awb: order.awb,
        customerId: req.user.id,
        totalAmount: order.totalAmount,
        status: order.status
      });
    } catch (eventError) {
      console.error('Error emitting event:', eventError);
      // Don't fail the request if event emission fails
    }

    // Send order confirmation (but don't fail if notifications fail)
    try {
      const customer = await Customer.findById(req.user.id);
      if (customer && customer.preferences && customer.preferences.notifications) {
        if (customer.preferences.notifications.email) {
          await sendEmail({
            to: customer.email,
            subject: 'Order Confirmation - RocketryBox',
            text: `Your order has been created successfully. Order Number: ${order.orderNumber}`
          });
        }

        if (customer.preferences.notifications.sms) {
          await sendSMS({
            to: customer.phone,
            templateId: SMS_TEMPLATES.TRACKING_UPDATE.templateId,
            variables: {
              trackingId: order.orderNumber,
              status: 'Pending',
              location: pickupAddress.city
            }
          });
        }
      }
    } catch (notificationError) {
      console.error('Error sending notifications:', notificationError);
      // Don't fail the request if notifications fail
    }

    res.status(201).json({
      success: true,
      data: {
        message: 'Order created successfully',
        order: {
          id: order._id,
          orderNumber: order.orderNumber,
          status: order.status,
          paymentStatus: order.paymentStatus,
          totalAmount: order.totalAmount,
          shippingRate: order.shippingRate,
          awb: order.awb,
          createdAt: order.createdAt
        }
      }
    });
  } catch (error) {
    console.error('CreateOrder error:', error);
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
    const filter = { customerId: req.user.id };
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
    const orders = await CustomerOrder.find(filter)
      .sort({ [sortField]: sortDirection === 'desc' ? -1 : 1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await CustomerOrder.countDocuments(filter);

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

    const order = await CustomerOrder.findOne({
      awb,
      customerId: req.user.id
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

    const order = await CustomerOrder.findOne({
      awb,
      customerId: req.user.id
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

    const order = await CustomerOrder.findOne({
      awb: awbNumber,
      customerId: req.user.id
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
export const verifyOrderPayment = async (req, res, next) => {
  try {
    const {
      awbNumber,
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature
    } = req.body;

    const order = await CustomerOrder.findOne({
      awb: awbNumber,
      customerId: req.user.id
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

    const order = await CustomerOrder.findOne({
      awb,
      customerId: req.user.id
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

    const order = await CustomerOrder.findOne({
      awb,
      customerId: req.user.id
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

    const order = await CustomerOrder.findOne({
      awb,
      customerId: req.user.id
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
    
    // Validate required fields
    if (!weight || !pickupPincode || !deliveryPincode || !serviceType) {
      throw new AppError('Missing required fields: weight, pickupPincode, deliveryPincode, and serviceType are required', 400);
    }

    // Validate weight
    if (weight < 0.1) {
      throw new AppError('Weight must be at least 0.1 kg', 400);
    }

    // Validate pincodes
    if (!/^\d{6}$/.test(pickupPincode) || !/^\d{6}$/.test(deliveryPincode)) {
      throw new AppError('Invalid pincode format. Pincodes must be 6 digits', 400);
    }

    // Validate service type (only standard and express allowed for customers)
    if (!['standard', 'express'].includes(serviceType)) {
      throw new AppError('Invalid service type. Must be either standard or express', 400);
    }

    // Prepare package and delivery details
    const packageDetails = {
      weight,
      dimensions: { length: 10, width: 10, height: 10 }, // Default dimensions if not provided
      serviceType
    };
    
    const deliveryDetails = {
      pickupPincode,
      deliveryPincode
    };

    // Calculate rates using the shipping utility
    const rates = await calculateShippingRates(packageDetails, deliveryDetails);

    if (!rates || rates.length === 0) {
      throw new AppError('No shipping rates available for the given parameters', 404);
    }

    // Format the responses to a consistent structure
    const formattedRates = rates.map(rate => ({
      courier: rate.provider?.name || rate.courier || 'Unknown',
      mode: rate.provider?.expressDelivery ? 'express' : (rate.serviceType || 'standard'),
      service: rate.provider?.expressDelivery ? 'express' : (rate.serviceType || 'standard'),
      rate: rate.totalRate || rate.total || 0,
      estimatedDelivery: rate.provider?.estimatedDays || rate.estimatedDelivery || '3-5 days',
      codCharge: rate.breakdown?.codCharge || rate.breakdown?.cod || 0,
      available: true
    }));

    // Sort rates by price (lowest first)
    formattedRates.sort((a, b) => a.rate - b.rate);

    const response = {
      success: true,
      data: {
        rates: formattedRates,
        summary: {
          totalCouriers: formattedRates.length,
          cheapestRate: formattedRates[0]?.rate || 0,
          fastestDelivery: formattedRates.reduce((fastest, current) => {
            // Parse days from estimatedDelivery string
            const currentDays = parseInt((current.estimatedDelivery || '').split('-')[0]);
            const fastestDays = parseInt((fastest.estimatedDelivery || '').split('-')[0]);
            return currentDays < fastestDays ? current : fastest;
          }, formattedRates[0])?.estimatedDelivery || 'N/A'
        }
      }
    };

    res.status(200).json(response);
  } catch (error) {
    next(new AppError(error.message, error.statusCode || 400));
  }
}; 