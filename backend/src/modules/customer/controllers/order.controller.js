import CustomerOrder from '../models/customerOrder.model.js';
import Customer from '../models/customer.model.js';
import { AppError } from '../../../middleware/errorHandler.js';
import { sendEmail } from '../../../utils/email.js';
import { sendSMS, SMS_TEMPLATES } from '../../../utils/sms.js';
import { createPaymentOrder, verifyPayment, getPaymentStatus } from '../../../utils/payment.js';
import { emitEvent, EVENT_TYPES } from '../../../utils/eventEmitter.js';
import { logger } from '../../../utils/logger.js';
import rateCardService from '../../../services/ratecard.service.js';
import mongoose from 'mongoose';

// Utility function to format monetary values to 2 decimal places
const formatMoney = (amount) => {
  return Math.round(amount * 100) / 100;
};

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

    // Transform order data to match frontend expectations
    const transformedOrder = {
      _id: order._id,
      orderNumber: order.orderNumber || 'N/A',
      
      // Flattened structure for payment page compatibility
      receiverName: order.deliveryAddress?.name || 'N/A',
      receiverAddress1: order.deliveryAddress?.address?.line1 || 'N/A',
      receiverAddress2: order.deliveryAddress?.address?.line2 || '',
      receiverCity: order.deliveryAddress?.address?.city || 'N/A',
      receiverState: order.deliveryAddress?.address?.state || 'N/A',
      receiverPincode: order.deliveryAddress?.address?.pincode || 'N/A',
      receiverMobile: order.deliveryAddress?.phone || 'N/A',
      weight: order.packageDetails?.weight || 0,
      length: order.packageDetails?.dimensions?.length || 10,
      width: order.packageDetails?.dimensions?.width || 10,
      height: order.packageDetails?.dimensions?.height || 10,
      packageType: order.selectedProvider?.serviceType || 'standard',
      pickupDate: order.createdAt,
      
      // Nested structure for OrderDetails page
      packageDetails: {
        weight: order.packageDetails?.weight || 0,
        dimensions: {
          length: order.packageDetails?.dimensions?.length || 10,
          width: order.packageDetails?.dimensions?.width || 10,
          height: order.packageDetails?.dimensions?.height || 10
        },
        declaredValue: order.packageDetails?.declaredValue || 0
      },
      pickupAddress: {
        name: order.pickupAddress?.name || 'N/A',
        phone: order.pickupAddress?.phone || 'N/A',
        address: {
          line1: order.pickupAddress?.address?.line1 || 'N/A',
          line2: order.pickupAddress?.address?.line2 || '',
          city: order.pickupAddress?.address?.city || 'N/A',
          state: order.pickupAddress?.address?.state || 'N/A',
          pincode: order.pickupAddress?.address?.pincode || 'N/A',
          country: order.pickupAddress?.address?.country || 'India'
        }
      },
      deliveryAddress: {
        name: order.deliveryAddress?.name || 'N/A',
        phone: order.deliveryAddress?.phone || 'N/A',
        address: {
          line1: order.deliveryAddress?.address?.line1 || 'N/A',
          line2: order.deliveryAddress?.address?.line2 || '',
          city: order.deliveryAddress?.address?.city || 'N/A',
          state: order.deliveryAddress?.address?.state || 'N/A',
          pincode: order.deliveryAddress?.address?.pincode || 'N/A',
          country: order.deliveryAddress?.address?.country || 'India'
        }
      },
      selectedProvider: {
        name: order.selectedProvider?.name || 'Generic Courier',
        serviceType: order.selectedProvider?.serviceType || 'standard',
        estimatedDays: order.selectedProvider?.estimatedDays || '3-5',
        totalRate: parseFloat(order.selectedProvider?.totalRate) || 0
      },
      
      // Payment and shipping info
      shippingPartner: {
        name: order.selectedProvider?.name || 'Generic Courier',
        rate: parseFloat(order.shippingRate) || 0
      },
      shippingRate: parseFloat(order.shippingRate) || 0,
      status: order.status || 'pending',
      paymentStatus: order.paymentStatus || 'pending',
      totalAmount: parseFloat(order.totalAmount) || 0,
      awb: order.awb || null,
      trackingUrl: order.trackingUrl || null,
      createdAt: order.createdAt
    };

    console.log('Transformed order data:', {
      orderId: order._id,
      orderNumber: transformedOrder.orderNumber,
      shippingPartner: transformedOrder.shippingPartner,
      totalAmount: transformedOrder.totalAmount,
      packageDetails: {
        weight: transformedOrder.weight,
        dimensions: {
          length: transformedOrder.length,
          width: transformedOrder.width,
          height: transformedOrder.height
        },
        declaredValue: transformedOrder.declaredValue
      },
      addresses: {
        pickup: !!order.pickupAddress,
        delivery: !!order.deliveryAddress
      },
      rawData: {
        hasPackageDetails: !!order.packageDetails,
        hasSelectedProvider: !!order.selectedProvider,
        shippingRateRaw: order.shippingRate,
        totalAmountRaw: order.totalAmount
      }
    });

    res.status(200).json({
      success: true,
      data: transformedOrder
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

    // Debug logging
    console.log('🔍 getOrderHistory called with:', {
      customerId: customerId,
      customerIdType: typeof customerId,
      userObject: {
        id: req.user.id,
        email: req.user.email,
        name: req.user.name
      },
      queryParams: { page, limit, status }
    });

    // Convert string customerId to ObjectId for proper matching
    const customerObjectId = new mongoose.Types.ObjectId(customerId);

    const filter = { customerId: customerObjectId };
    if (status && status !== 'All' && status !== 'undefined' && status !== 'null') {
      // Map frontend status to backend status
      const statusMapping = {
        'Booked': 'confirmed',
        'Processing': 'pending',
        'In Transit': 'shipped',
        'Out for Delivery': 'shipped', // Map to shipped for now
        'Delivered': 'delivered',
        'Returned': 'cancelled'
      };
      filter.status = statusMapping[status] || status.toLowerCase();
    }

    console.log('🔍 MongoDB filter:', filter);

    const orders = await CustomerOrder.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await CustomerOrder.countDocuments(filter);

    console.log('🔍 Query results:', {
      ordersFound: orders.length,
      totalCount: total
    });

    // Transform orders to match frontend expected format
    const transformedOrders = orders.map(order => {
      // Map backend status to frontend status
      const statusMapping = {
        'pending': 'Processing',
        'confirmed': 'Booked',
        'shipped': 'In Transit',
        'delivered': 'Delivered',
        'cancelled': 'Returned'
      };

      return {
        date: order.createdAt.toISOString().split('T')[0], // Format as YYYY-MM-DD
        awb: order.awb || order.orderNumber,
        consigne: order.deliveryAddress?.name || 'N/A',
        product: order.packageDetails?.weight ? `${order.packageDetails.weight}kg Package` : 'Package',
        courier: order.courierPartner || order.selectedProvider?.name || 'RocketryBox',
        amount: order.totalAmount || 0,
        label: order.trackingUrl || '#',
        status: statusMapping[order.status] || order.status,
        edd: order.estimatedDelivery 
          ? order.estimatedDelivery.toISOString().split('T')[0] 
          : 'TBD',
        pdfUrl: order.trackingUrl || '#',
        // Include original order data for details page
        _id: order._id,
        orderNumber: order.orderNumber,
        paymentStatus: order.paymentStatus
      };
    });

    res.status(200).json({
      success: true,
      data: {
        orders: transformedOrders,
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
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
      // Calculate shipping rates if no provider selected using unified service
      const rateResult = await rateCardService.calculateShippingRate({
        fromPincode: pickupAddress.pincode,
        toPincode: deliveryAddress.pincode,
        weight: packageDetails.weight,
        dimensions: packageDetails.dimensions || { length: 10, width: 10, height: 10 },
        mode: serviceType === 'express' ? 'Air' : 'Surface',
        orderType: serviceType === 'cod' ? 'cod' : 'prepaid',
        codCollectableAmount: packageDetails.declaredValue || 0,
        includeRTO: false
      });

      if (!rateResult.success || !rateResult.calculations.length) {
        return next(new AppError('No shipping rates available for the given parameters', 400));
      }

      // Use the cheapest rate for order creation
      const cheapestRate = rateResult.calculations[0];
      selectedRate = {
        id: cheapestRate.rateCardId,
        courier: cheapestRate.courier,
        provider: { 
          name: cheapestRate.courier, 
          estimatedDays: rateResult.deliveryEstimate 
        },
        totalRate: cheapestRate.total,
        estimatedDelivery: rateResult.deliveryEstimate
      };
      totalRate = cheapestRate.total;
      console.log('Using calculated rate from unified service:', selectedRate);
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
        totalRate: formatMoney(totalRate),
        estimatedDays: selectedRate.provider?.estimatedDays || selectedRate.estimatedDelivery || '3-5'
      },
      shippingRate: formatMoney(totalRate),
      totalAmount: formatMoney(totalRate), // Store just the shipping rate, let frontend calculate full total
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
          totalAmount: formatMoney(order.totalAmount),
          shippingRate: formatMoney(order.shippingRate),
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
    if (!['standard', 'express', 'cod'].includes(serviceType)) {
      throw new AppError('Invalid service type. Must be standard, express, or cod', 400);
    }

    // Get rates for BOTH Surface and Air modes to give customers all options
    const [surfaceResult, airResult] = await Promise.all([
      // Surface/Standard rates
      rateCardService.calculateShippingRate({
        fromPincode: pickupPincode,
        toPincode: deliveryPincode,
        weight,
        dimensions: { length: 10, width: 10, height: 10 }, // Default dimensions
        mode: 'Surface',
        orderType: serviceType === 'cod' ? 'cod' : 'prepaid',
        codCollectableAmount: 0,
        includeRTO: false
      }),
      // Air/Express rates  
      rateCardService.calculateShippingRate({
        fromPincode: pickupPincode,
        toPincode: deliveryPincode,
        weight,
        dimensions: { length: 10, width: 10, height: 10 }, // Default dimensions
        mode: 'Air',
        orderType: serviceType === 'cod' ? 'cod' : 'prepaid',
        codCollectableAmount: 0,
        includeRTO: false
      })
    ]);

    // Combine all calculations from both modes
    let allCalculations = [];
    let zone = 'Rest of India';
    let billedWeight = weight;
    let deliveryEstimate = '4-6 days';

    if (surfaceResult.success) {
      allCalculations.push(...surfaceResult.calculations.map(calc => ({
        ...calc,
        serviceMode: 'Surface',
        serviceLabel: 'Standard'
      })));
      zone = surfaceResult.zone;
      billedWeight = surfaceResult.billedWeight;
      deliveryEstimate = surfaceResult.deliveryEstimate;
    }

    if (airResult.success) {
      allCalculations.push(...airResult.calculations.map(calc => ({
        ...calc,
        serviceMode: 'Air',
        serviceLabel: 'Express'
      })));
      // Use faster delivery estimate for air if available
      if (airResult.deliveryEstimate && airResult.deliveryEstimate !== '4-6 days') {
        deliveryEstimate = airResult.deliveryEstimate;
      }
    }

    if (allCalculations.length === 0) {
      throw new AppError('No shipping rates available for the given parameters', 404);
    }

    // Format the responses to show all available options
    const formattedRates = allCalculations.map(calc => ({
      courier: calc.courier,
      mode: calc.serviceLabel.toLowerCase(), // 'standard' or 'express'
      service: calc.serviceLabel.toLowerCase(), // 'standard' or 'express'
      serviceType: calc.serviceMode, // 'Surface' or 'Air'
      productName: calc.productName, // Show the actual product name
      rate: formatMoney(calc.total),
      estimatedDelivery: calc.serviceMode === 'Air' ? 
        rateCardService.getDeliveryEstimate(zone, 'Air') : 
        rateCardService.getDeliveryEstimate(zone, 'Surface'),
      codCharge: formatMoney(calc.codCharges || 0),
      available: true,
      breakdown: {
        baseRate: formatMoney(calc.baseRate || 0),
        additionalCharges: formatMoney((calc.addlRate * (calc.weightMultiplier - 1)) || 0),
        shippingCost: formatMoney(calc.shippingCost || 0),
        gst: formatMoney(calc.gst || 0),
        total: formatMoney(calc.total)
      }
    }));

    // Sort rates by price (lowest first)
    formattedRates.sort((a, b) => a.rate - b.rate);

    // Group rates by service type for better organization
    const standardRates = formattedRates.filter(rate => rate.serviceType === 'Surface');
    const expressRates = formattedRates.filter(rate => rate.serviceType === 'Air');

    const response = {
      success: true,
      data: {
        rates: formattedRates,
        ratesByType: {
          standard: standardRates,
          express: expressRates
        },
        zone: zone,
        chargeableWeight: formatMoney(billedWeight || 0),
        summary: {
          totalOptions: formattedRates.length,
          standardOptions: standardRates.length,
          expressOptions: expressRates.length,
          cheapestRate: formatMoney(formattedRates[0]?.rate || 0),
          cheapestStandard: formatMoney(standardRates[0]?.rate || 0),
          cheapestExpress: formatMoney(expressRates[0]?.rate || 0),
          fastestDelivery: deliveryEstimate
        }
      }
    };

    logger.info(`Customer rate calculation successful for ${pickupPincode} → ${deliveryPincode}`, {
      zone: zone,
      totalRates: formattedRates.length,
      standardRates: standardRates.length,
      expressRates: expressRates.length,
      cheapestRate: formattedRates[0]?.rate
    });

    res.status(200).json(response);
  } catch (error) {
    logger.error(`Customer rate calculation failed: ${error.message}`);
    next(new AppError(error.message, error.statusCode || 400));
  }
};

/**
 * Get order status counts for customer
 */
export const getOrderStatusCounts = async (req, res, next) => {
  try {
    const customerId = req.user.id;

    // Convert string customerId to ObjectId for proper matching
    const customerObjectId = new mongoose.Types.ObjectId(customerId);

    // Get all status counts
    const statusCounts = await CustomerOrder.aggregate([
      { $match: { customerId: customerObjectId } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // Map backend statuses to frontend expected statuses
    const statusMapping = {
      'pending': 'Processing',
      'confirmed': 'Booked',
      'shipped': 'In Transit',
      'delivered': 'Delivered',
      'cancelled': 'Returned'
    };

    // Format the response with frontend expected status names
    const counts = {
      'All': 0,
      'Booked': 0,
      'Processing': 0,
      'In Transit': 0,
      'Out for Delivery': 0,
      'Delivered': 0,
      'Returned': 0
    };

    // Calculate total and individual counts
    statusCounts.forEach(item => {
      const mappedStatus = statusMapping[item._id] || item._id;
      if (counts.hasOwnProperty(mappedStatus)) {
        counts[mappedStatus] = item.count;
      } else {
        // Handle any unmapped statuses by adding them to a generic category
        console.log(`Warning: Unmapped status "${item._id}" found`);
      }
      counts['All'] += item.count;
    });

    res.status(200).json({
      success: true,
      data: counts
    });
  } catch (error) {
    logger.error('Error fetching order status counts:', error);
    next(new AppError('Failed to fetch order status counts', 500));
  }
}; 