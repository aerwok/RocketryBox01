import mongoose from 'mongoose';
import xlsx from 'xlsx';
import { AppError } from '../../../middleware/errorHandler.js';
// import { io } from '../../../server.js'; // Temporarily disabled to fix shipping flow
import { getCourierHandler } from '../../../utils/courierBooking.js';
import { bookShipment, calculateShippingRates, getPartnerDetails, trackShipment } from '../../../utils/shipping.js';
import SellerOrder from '../models/order.model.js';
import Seller from '../models/seller.model.js';
import SellerShipment from '../models/shipment.model.js';
import WalletTransaction from '../models/walletTransaction.model.js';

// Safe socket emission helper (non-critical)
const safeEmit = (event, data) => {
  try {
    // Socket.IO disabled temporarily to fix shipping flow
    // if (io && typeof io.emit === 'function') {
    //   io.emit(event, data);
    // }
    console.log(`🔔 Socket Event (disabled): ${event}`, data);
  } catch (error) {
    console.warn(`Socket emission failed for ${event}:`, error.message);
  }
};

// Create a shipment from an order
export const createShipment = async (req, res, next) => {
  try {
    const { orderId, courier, awb, pickupDate } = req.body;
    const sellerId = req.user.id;

    // Check if order exists and belongs to the seller
    const order = await SellerOrder.findOne({
      _id: orderId,
      seller: sellerId
    });

    if (!order) {
      return next(new AppError('Order not found or does not belong to you', 404));
    }

    // Create new shipment
    const shipment = await SellerShipment.create({
      seller: sellerId,
      orderId,
      courier,
      awb,
      pickupDate: pickupDate || new Date(),
      status: 'Booked',
      channel: 'MANUAL'
    });

    // Update order status
    order.status = 'Shipped';
    order.shippingDetails = {
      courier,
      trackingNumber: awb,
      shippedAt: new Date()
    };
    await order.save();

    // Emit event for real-time updates
    io.emit('shipment:created', {
      sellerId,
      orderId,
      shipmentId: shipment._id,
      status: 'Booked'
    });

    res.status(201).json({
      success: true,
      message: 'Shipment created successfully',
      data: shipment
    });
  } catch (error) {
    next(new AppError(error.message, 400));
  }
};

// Create shipments in bulk
export const createBulkShipments = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { shipments } = req.body;
    const sellerId = req.user.id;
    const createdShipments = [];
    const updatedOrders = [];

    // Process each shipment
    for (const shipment of shipments) {
      const { orderId, courier, awb, pickupDate } = shipment;

      // Check if order exists and belongs to the seller
      const order = await SellerOrder.findOne({
        _id: orderId,
        seller: sellerId
      }).session(session);

      if (!order) {
        // Skip invalid orders
        continue;
      }

      // Create shipment
      const newShipment = await SellerShipment.create([{
        seller: sellerId,
        orderId,
        courier,
        awb,
        pickupDate: pickupDate || new Date(),
        status: 'Booked',
        channel: 'EXCEL'
      }], { session });

      // Update order status
      order.status = 'Shipped';
      order.shippingDetails = {
        courier,
        trackingNumber: awb,
        shippedAt: new Date()
      };
      await order.save({ session });

      createdShipments.push(newShipment[0]);
      updatedOrders.push(order);
    }

    await session.commitTransaction();
    session.endSession();

    // Emit events for real-time updates
    createdShipments.forEach(shipment => {
      io.emit('shipment:created', {
        sellerId,
        orderId: shipment.orderId,
        shipmentId: shipment._id,
        status: 'Booked'
      });
    });

    res.status(201).json({
      success: true,
      message: `${createdShipments.length} shipments created successfully`,
      data: createdShipments
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(new AppError(error.message, 400));
  }
};

// List/filter/search shipments
export const getShipments = async (req, res, next) => {
  try {
    const {
      status,
      search,
      startDate,
      endDate,
      sort = '-createdAt',
      limit = 10,
      page = 1
    } = req.query;
    const sellerId = req.user.id;

    // Build filter object
    const filter = { seller: sellerId };
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { awb: { $regex: search, $options: 'i' } },
        { courier: { $regex: search, $options: 'i' } }
      ];
    }
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    // Calculate pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Execute query with pagination
    const [shipments, total] = await Promise.all([
      SellerShipment.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .populate({
          path: 'orderId',
          select: 'orderId customer.name total items'
        }),
      SellerShipment.countDocuments(filter)
    ]);

    res.status(200).json({
      success: true,
      count: shipments.length,
      total,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      data: shipments
    });
  } catch (error) {
    next(new AppError(error.message, 400));
  }
};

// Get shipment details
export const getShipment = async (req, res, next) => {
  try {
    const shipment = await SellerShipment.findOne({ _id: req.params.id, seller: req.user.id });
    if (!shipment) throw new AppError('Shipment not found', 404);
    res.status(200).json({ success: true, data: shipment });
  } catch (error) {
    next(error);
  }
};

// Update shipment status
export const updateShipmentStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const sellerId = req.user.id;

    // Validate status
    const validStatuses = ['Booked', 'In-transit', 'Delivered', 'Pending Pickup', 'Cancelled', 'Exception'];
    if (!validStatuses.includes(status)) {
      return next(new AppError(`Invalid status. Must be one of: ${validStatuses.join(', ')}`, 400));
    }

    // Find and update shipment
    const shipment = await SellerShipment.findOneAndUpdate(
      { _id: id, seller: sellerId },
      {
        status,
        updatedAt: new Date(),
        $push: {
          trackingHistory: {
            status,
            timestamp: new Date(),
            description: `Status updated to ${status}`,
            location: 'System Update'
          }
        }
      },
      { new: true }
    );

    if (!shipment) {
      return next(new AppError('Shipment not found', 404));
    }

    // If delivered, update order status
    if (status === 'Delivered') {
      await SellerOrder.findByIdAndUpdate(
        shipment.orderId,
        { status: 'Delivered', deliveredAt: new Date() }
      );
    }

    // Emit event for real-time updates
    io.emit('shipment:status_updated', {
      sellerId,
      shipmentId: shipment._id,
      orderId: shipment.orderId,
      status
    });

    res.status(200).json({
      success: true,
      message: 'Shipment status updated successfully',
      data: shipment
    });
  } catch (error) {
    next(new AppError(error.message, 400));
  }
};

// Add a tracking event
export const addTrackingEvent = async (req, res, next) => {
  try {
    const { status, description, location } = req.body;
    if (!status) throw new AppError('Status is required', 400);
    const shipment = await SellerShipment.findOne({ _id: req.params.id, seller: req.user.id });
    if (!shipment) throw new AppError('Shipment not found', 404);
    shipment.trackingHistory.push({ status, description, location, timestamp: new Date() });
    await shipment.save();
    res.status(200).json({ success: true, data: shipment.trackingHistory });
  } catch (error) {
    next(error);
  }
};

// Get tracking history
export const getTrackingHistory = async (req, res, next) => {
  try {
    const shipment = await SellerShipment.findOne({ _id: req.params.id, seller: req.user.id });
    if (!shipment) throw new AppError('Shipment not found', 404);
    res.status(200).json({ success: true, data: shipment.trackingHistory });
  } catch (error) {
    next(error);
  }
};

// Export manifest (Excel)
export const getManifest = async (req, res, next) => {
  try {
    const { startDate, endDate, status } = req.query;
    const query = { seller: req.user.id };
    if (status) query.status = status;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }
    const shipments = await SellerShipment.find(query).lean();
    const excelData = shipments.map(s => ({
      'AWB': s.awb,
      'Order ID': s.orderId,
      'Courier': s.courier,
      'Status': s.status,
      'Pickup Date': s.pickupDate ? s.pickupDate.toISOString().split('T')[0] : '',
      'Delivery Date': s.deliveryDate ? s.deliveryDate.toISOString().split('T')[0] : '',
      'Weight': s.weight,
      'Dimensions': s.dimensions ? `${s.dimensions.length}x${s.dimensions.width}x${s.dimensions.height}` : '',
      'Shipping Charge': s.shippingCharge
    }));
    const wb = xlsx.utils.book_new();
    const ws = xlsx.utils.json_to_sheet(excelData);
    xlsx.utils.book_append_sheet(wb, ws, 'Manifest');
    const excelBuffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=manifest.xlsx');
    res.send(excelBuffer);
  } catch (error) {
    next(error);
  }
};

// Handle return/NDR
export const handleReturn = async (req, res, next) => {
  try {
    const { status, description } = req.body;
    if (!status || !['Returned', 'NDR'].includes(status)) throw new AppError('Status must be Returned or NDR', 400);
    const shipment = await SellerShipment.findOne({ _id: req.params.id, seller: req.user.id });
    if (!shipment) throw new AppError('Shipment not found', 404);
    shipment.status = status;
    shipment.updatedAt = new Date();
    shipment.trackingHistory.push({ status, description, timestamp: new Date() });
    await shipment.save();
    res.status(200).json({ success: true, data: shipment });
  } catch (error) {
    next(error);
  }
};

/**
 * Get shipping rates for package
 * @route POST /api/v2/seller/shipments/rates
 * @access Private (Seller only)
 */
export const getShippingRates = async (req, res, next) => {
  try {
    const {
      weight,
      dimensions,
      pickupPincode,
      deliveryPincode,
      cod,
      declaredValue
    } = req.body;

    // Validate required fields
    if (!weight || !dimensions || !pickupPincode || !deliveryPincode) {
      return next(new AppError('Missing required parameters', 400));
    }

    // Calculate shipping rates using our integrated system
    const packageDetails = {
      weight,
      dimensions,
      cod: cod || false,
      declaredValue: declaredValue || 0
    };

    const deliveryDetails = {
      pickupPincode,
      deliveryPincode
    };

    const rates = await calculateShippingRates(packageDetails, deliveryDetails);

    res.status(200).json({
      success: true,
      data: {
        rates
      }
    });
  } catch (error) {
    next(new AppError(error.message, 400));
  }
};

/**
 * Book a shipment with courier API
 * @route POST /api/v2/seller/shipments/book
 * @access Private (Seller only)
 */
export const bookCourierShipment = async (req, res, next) => {
  try {
    const {
      orderId,
      courierCode,
      serviceType,
      packageDetails,
      pickupDetails,
      deliveryDetails
    } = req.body;

    const sellerId = req.user.id;

    // Check if order exists and belongs to the seller
    const order = await SellerOrder.findOne({
      _id: orderId,
      seller: sellerId
    });

    if (!order) {
      return next(new AppError('Order not found or does not belong to you', 404));
    }

    // Validate courier code and get handler
    const courierHandler = await getCourierHandler(courierCode);
    if (!courierHandler) {
      return next(new AppError(`Invalid or unavailable courier: ${courierCode}`, 400));
    }

    // Prepare shipment details
    const shipmentDetails = {
      referenceNumber: order.orderNumber,
      serviceType,
      weight: packageDetails.weight,
      dimensions: packageDetails.dimensions,
      declaredValue: packageDetails.declaredValue || order.total,
      cod: order.paymentMethod === 'COD',
      codAmount: order.paymentMethod === 'COD' ? order.total : 0,
      consignee: {
        name: order.customer.name,
        phone: order.customer.phone,
        email: order.customer.email,
        address: {
          line1: order.shippingAddress.street,
          line2: order.shippingAddress.landmark || '',
          city: order.shippingAddress.city,
          state: order.shippingAddress.state,
          pincode: order.shippingAddress.pincode,
          country: order.shippingAddress.country || 'India'
        }
      },
      shipper: {
        name: pickupDetails.name,
        phone: pickupDetails.phone,
        email: pickupDetails.email,
        address: {
          line1: pickupDetails.address.street,
          line2: pickupDetails.address.landmark || '',
          city: pickupDetails.address.city,
          state: pickupDetails.address.state,
          pincode: pickupDetails.address.pincode,
          country: pickupDetails.address.country || 'India'
        }
      }
    };

    // Book the shipment with the courier
    const bookingResponse = await courierHandler.bookShipment(shipmentDetails);

    if (!bookingResponse.success) {
      return next(new AppError(bookingResponse.error || 'Failed to book shipment', 400));
    }

    // Create shipment record
    const shipment = await SellerShipment.create({
      seller: sellerId,
      orderId,
      courier: courierCode,
      awb: bookingResponse.awb,
      pickupDate: new Date(),
      status: 'Booked',
      channel: 'API',
      weight: packageDetails.weight,
      dimensions: packageDetails.dimensions,
      shippingCharge: packageDetails.shippingCharge || 0,
      trackingHistory: [{
        status: 'Booked',
        timestamp: new Date(),
        description: 'Shipment booked successfully',
        location: 'System'
      }]
    });

    // Update order status
    order.status = 'Shipped';
    order.shippingDetails = {
      courier: courierCode,
      trackingNumber: bookingResponse.awb,
      shippedAt: new Date(),
      label: bookingResponse.label
    };
    await order.save();

    // Emit event for real-time updates
    io.emit('shipment:created', {
      sellerId,
      orderId,
      shipmentId: shipment._id,
      status: 'Booked'
    });

    res.status(201).json({
      success: true,
      message: 'Shipment booked successfully',
      data: {
        shipment,
        booking: {
          awb: bookingResponse.awb,
          trackingUrl: bookingResponse.trackingUrl,
          label: bookingResponse.label,
          manifest: bookingResponse.manifest
        }
      }
    });
  } catch (error) {
    next(new AppError(error.message, 400));
  }
};

/**
 * Track a shipment
 * @route GET /api/v2/seller/shipments/:id/track
 * @access Private (Seller only)
 */
export const trackShipmentStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const sellerId = req.user.id;

    // Find the shipment
    const shipment = await SellerShipment.findOne({
      _id: id,
      seller: sellerId
    });

    if (!shipment) {
      return next(new AppError('Shipment not found', 404));
    }

    // Track the shipment with the courier's API
    const trackingInfo = await trackShipment(shipment.awb, shipment.courier);

    if (trackingInfo.success) {
      // Update shipment status and tracking history
      shipment.status = trackingInfo.status || shipment.status;

      // Only add new tracking events
      if (trackingInfo.trackingHistory && trackingInfo.trackingHistory.length > 0) {
        // Add any new tracking events not already in the history
        trackingInfo.trackingHistory.forEach(event => {
          const existingEvent = shipment.trackingHistory.find(
            e => e.timestamp.getTime() === new Date(event.timestamp).getTime() &&
              e.status === event.status
          );

          if (!existingEvent) {
            shipment.trackingHistory.push({
              status: event.status,
              timestamp: event.timestamp,
              description: event.description || event.statusDetail,
              location: event.location
            });
          }
        });

        // Sort tracking history by timestamp (newest first)
        shipment.trackingHistory.sort((a, b) => b.timestamp - a.timestamp);
      }

      // If delivered, update order status and delivery date
      if (trackingInfo.status === 'Delivered' && shipment.status !== 'Delivered') {
        shipment.status = 'Delivered';
        shipment.deliveryDate = trackingInfo.timestamp || new Date();

        // Update order
        await SellerOrder.findByIdAndUpdate(
          shipment.orderId,
          {
            status: 'Delivered',
            deliveredAt: shipment.deliveryDate
          }
        );
      }

      await shipment.save();
    }

    res.status(200).json({
      success: true,
      data: {
        shipment,
        trackingInfo: trackingInfo.success ? {
          status: trackingInfo.status,
          statusDetail: trackingInfo.statusDetail,
          currentLocation: trackingInfo.currentLocation,
          timestamp: trackingInfo.timestamp,
          estimatedDelivery: trackingInfo.estimatedDelivery,
          trackingHistory: trackingInfo.trackingHistory
        } : null
      }
    });
  } catch (error) {
    next(new AppError(error.message, 400));
  }
};

/**
 * Ship order with rate selection and wallet deduction (IDEAL WORKFLOW)
 * @route POST /api/v2/seller/shipments/ship-with-payment
 * @access Private (Seller only)
 */
export const shipOrderWithWalletPayment = async (req, res, next) => {
  try {
    const {
      orderId,
      selectedRate // The rate selected from availableRates
    } = req.body;

    const sellerId = req.user.id;

    // Debug logging
    console.log(`🚀 Ship order request received:`, {
      orderId,
      selectedRate,
      sellerId,
      requestBody: req.body
    });

    // Check what orders exist for this seller
    const existingOrders = await SellerOrder.find({ seller: sellerId }).select('orderId status customer.name');
    console.log(`📋 Existing orders for seller ${sellerId}:`, existingOrders.map(o => ({
      orderId: o.orderId,
      status: o.status,
      customerName: o.customer?.name
    })));

    // Get seller for wallet operations
    const seller = await Seller.findById(sellerId);
    if (!seller) {
      return next(new AppError('Seller not found', 404));
    }

    // Check if order exists and belongs to the seller
    const order = await SellerOrder.findOne({
      orderId: orderId, // Search by orderId field instead of _id
      seller: sellerId,
      status: { $in: ['Created', 'not-booked'] } // Allow both Created and not-booked status
    });

    console.log(`🔍 Order lookup result:`, {
      orderId,
      sellerId,
      found: !!order,
      orderData: order ? {
        orderId: order.orderId,
        status: order.status,
        hasCustomer: !!order.customer,
        customerName: order.customer?.name,
        hasProduct: !!order.product,
        hasPayment: !!order.payment
      } : null
    });

    if (!order) {
      console.log(`❌ Order not found: orderId=${orderId}, sellerId=${sellerId}`);
      return next(new AppError(`Order not found with ID: ${orderId}. Please ensure the order exists and belongs to you.`, 404));
    }

    // Validate that we have real customer data (not defaults)
    if (!order.customer || !order.customer.name || !order.customer.address || !order.customer.address.pincode) {
      console.log(`❌ Order missing customer data:`, {
        hasCustomer: !!order.customer,
        customerName: order.customer?.name,
        hasAddress: !!order.customer?.address,
        pincode: order.customer?.address?.pincode
      });
      return next(new AppError(`Order ${orderId} is missing required customer information`, 400));
    }

    // Validate selected rate
    if (!selectedRate || !selectedRate.courier || !selectedRate.total) {
      return next(new AppError('Valid rate selection is required', 400));
    }

    // Check wallet balance BEFORE booking
    const currentBalance = parseFloat(seller.walletBalance || '0');
    const shippingCharge = parseFloat(selectedRate.total);

    if (currentBalance < shippingCharge) {
      return next(new AppError(`Insufficient wallet balance. Required: ₹${shippingCharge}, Available: ₹${currentBalance}`, 402));
    }

    // Validate courier code and get partner details
    const partnerDetails = await getPartnerDetails(selectedRate.courier);
    if (!partnerDetails) {
      console.log(`❌ Partner details not found for courier: ${selectedRate.courier}`);
      return next(new AppError(`Invalid or unavailable courier: ${selectedRate.courier}`, 400));
    }

    console.log(`✅ Partner details found for ${selectedRate.courier}:`, {
      name: partnerDetails.name,
      id: partnerDetails.id
    });

    // Prepare shipment details for courier API
    const shipmentDetails = {
      referenceNumber: order.orderId,
      serviceType: selectedRate.mode || 'Standard',
      weight: parseFloat(order.product.weight),
      dimensions: order.product.dimensions || { length: 10, width: 10, height: 10 },
      declaredValue: parseFloat(order.payment.amount) || 100,
      cod: order.payment.method === 'COD',
      codAmount: order.payment.method === 'COD' ? parseFloat(order.payment.amount) : 0,
      consignee: {
        name: order.customer.name,
        phone: order.customer.phone,
        email: order.customer.email,
        address: {
          line1: order.customer.address.street,
          line2: order.customer.address.landmark || '',
          city: order.customer.address.city,
          state: order.customer.address.state,
          pincode: order.customer.address.pincode,
          country: order.customer.address.country || 'India'
        }
      },
      shipper: {
        name: seller.businessName || seller.name,
        phone: seller.phone,
        email: seller.email,
        address: {
          line1: seller.address?.street || 'Default Address',
          line2: seller.address?.landmark || '',
          city: seller.address?.city || 'City',
          state: seller.address?.state || 'State',
          pincode: seller.address?.pincode || '110001',
          country: seller.address?.country || 'India'
        }
      }
    };

    console.log(`📋 Shipment Details Debug:`, {
      orderId: order.orderId,
      receiverName: shipmentDetails.consignee.name,
      receiverPhone: shipmentDetails.consignee.phone,
      receiverAddress: shipmentDetails.consignee.address,
      shipperName: shipmentDetails.shipper.name,
      shipperAddress: shipmentDetails.shipper.address,
      weight: shipmentDetails.weight,
      cod: shipmentDetails.cod,
      codAmount: shipmentDetails.codAmount,
      fullShipmentDetails: JSON.stringify(shipmentDetails, null, 2)
    });

    // Book the shipment with the courier API
    console.log(`📦 Booking shipment with ${selectedRate.courier} for order ${order.orderId}`);
    const bookingResponse = await bookShipment(selectedRate.courier, shipmentDetails);

    if (!bookingResponse.success) {
      return next(new AppError(bookingResponse.error || 'Failed to book shipment with courier', 400));
    }

    // SUCCESS: Now deduct from wallet and create records
    console.log(`💰 Deducting ₹${shippingCharge} from wallet`);

    // Update seller wallet balance
    seller.walletBalance = (currentBalance - shippingCharge).toFixed(2);
    await seller.save();

    // Record wallet transaction
    const walletTransaction = await WalletTransaction.create({
      seller: seller._id,
      orderId: order._id,
      type: 'Debit',
      amount: shippingCharge.toString(),
      remark: `Shipping charge for ${selectedRate.courier} - Order: ${order.orderId}`,
      closingBalance: seller.walletBalance
    });

    // Create shipment record
    const shipment = await SellerShipment.create({
      seller: sellerId,
      orderId: order._id,
      courier: selectedRate.courier,
      awb: bookingResponse.awb,
      pickupDate: new Date(),
      status: 'Booked',
      channel: 'MANUAL',
      weight: order.product.weight,
      dimensions: order.product.dimensions,
      shippingCharge: shippingCharge,
      trackingHistory: [{
        status: 'Booked',
        timestamp: new Date(),
        description: `Shipment booked with ${selectedRate.courier}`,
        location: 'System'
      }]
    });

    // Update order with shipping details and status
    order.status = 'Shipped';
    order.courier = selectedRate.courier;
    order.awb = bookingResponse.awb;
    order.payment.shippingCharge = shippingCharge.toString();
    order.payment.total = (parseFloat(order.payment.amount) + shippingCharge).toString();
    order.shippingDetails = {
      courier: selectedRate.courier,
      trackingNumber: bookingResponse.awb,
      shippedAt: new Date(),
      zone: selectedRate.zone,
      weight: order.product.weight,
      chargeableWeight: selectedRate.weight?.toString(),
      baseRate: selectedRate.base?.toString(),
      additionalCharges: selectedRate.addlCharge?.toString(),
      totalCharges: shippingCharge.toString()
    };
    order.orderTimeline.push({
      status: 'Shipped',
      timestamp: new Date(),
      comment: `Shipped with ${selectedRate.courier} - AWB: ${bookingResponse.awb}`
    });

    await order.save();

    // Emit real-time events (using safe emission)
    safeEmit('shipment:created', {
      sellerId,
      orderId: order._id,
      shipmentId: shipment._id,
      status: 'Booked'
    });

    safeEmit('wallet:updated', {
      sellerId,
      newBalance: seller.walletBalance,
      transaction: walletTransaction
    });

    console.log(`✅ Order ${order.orderId} shipped successfully with ${selectedRate.courier}`);

    res.status(201).json({
      success: true,
      message: `Order shipped successfully with ${selectedRate.courier}`,
      data: {
        order: {
          orderId: order.orderId,
          status: order.status,
          awb: order.awb,
          courier: order.courier
        },
        shipment: {
          id: shipment._id,
          awb: shipment.awb,
          status: shipment.status,
          courier: shipment.courier
        },
        booking: {
          awb: bookingResponse.awb,
          trackingUrl: bookingResponse.trackingUrl,
          label: bookingResponse.label,
          manifest: bookingResponse.manifest
        },
        payment: {
          charged: shippingCharge,
          walletBalance: seller.walletBalance,
          transactionId: walletTransaction._id
        }
      }
    });
  } catch (error) {
    console.error('Error in shipOrderWithWalletPayment:', error);
    next(new AppError(error.message, 400));
  }
};
