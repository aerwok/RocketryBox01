import SellerShipment from '../models/shipment.model.js';
import SellerOrder from '../models/order.model.js';
import NDR from '../models/ndr.model.js';
import { AppError } from '../../../middleware/errorHandler.js';
import xlsx from 'xlsx';
import { bookOrderWithCourier } from '../../../utils/courierBooking.js';

// Create a shipment from an order
export const createShipment = async (req, res, next) => {
  try {
    const { orderId, courier, pickupDate } = req.body;
    if (!orderId || !courier) throw new AppError('orderId and courier are required', 400);
    const order = await SellerOrder.findById(orderId);
    if (!order) throw new AppError('Order not found', 404);
    // Check if shipment already exists
    const existing = await SellerShipment.findOne({ orderId });
    if (existing) throw new AppError('Shipment already exists for this order', 400);
    // Book with courier API
    const booking = await bookOrderWithCourier(order, courier);
    const shipment = new SellerShipment({
      seller: req.user.id,
      orderId,
      awb: booking.awb,
      courier,
      status: 'Booked',
      pickupDate: pickupDate ? new Date(pickupDate) : undefined,
      weight: order.product.weight,
      dimensions: order.product.dimensions,
      shippingCharge: order.payment.shippingCharge,
      channel: order.channel,
      trackingUrl: booking.trackingUrl,
      label: booking.label
    });
    await shipment.save();
    // Optionally update order status
    order.status = 'Processing';
    order.updatedAt = new Date();
    await order.save();
    res.status(201).json({ success: true, data: shipment });
  } catch (error) {
    next(error);
  }
};

// Create shipments in bulk
export const createBulkShipments = async (req, res, next) => {
  try {
    const { shipments } = req.body; // Array of { orderId, courier, pickupDate }
    if (!Array.isArray(shipments) || shipments.length === 0) throw new AppError('No shipments provided', 400);
    const results = { success: 0, failed: 0, errors: [] };
    for (const s of shipments) {
      try {
        const order = await SellerOrder.findById(s.orderId);
        if (!order) throw new Error('Order not found');
        const existing = await SellerShipment.findOne({ orderId: s.orderId });
        if (existing) throw new Error('Shipment already exists');
        const booking = await bookOrderWithCourier(order, s.courier);
        const shipment = new SellerShipment({
          seller: req.user.id,
          orderId: s.orderId,
          awb: booking.awb,
          courier: s.courier,
          status: 'Booked',
          pickupDate: s.pickupDate ? new Date(s.pickupDate) : undefined,
          weight: order.product.weight,
          dimensions: order.product.dimensions,
          shippingCharge: order.payment.shippingCharge,
          channel: order.channel,
          trackingUrl: booking.trackingUrl,
          label: booking.label
        });
        await shipment.save();
        order.status = 'Processing';
        order.updatedAt = new Date();
        await order.save();
        results.success++;
      } catch (err) {
        results.failed++;
        results.errors.push({ orderId: s.orderId, error: err.message });
      }
    }
    res.status(200).json({ success: true, data: results });
  } catch (error) {
    next(error);
  }
};

// List/filter/search shipments
export const getShipments = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status, courier, startDate, endDate, search, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    const query = { seller: req.user.id };
    if (status) query.status = status;
    if (courier) query.courier = courier;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }
    if (search) {
      query.$or = [
        { awb: { $regex: search, $options: 'i' } },
        { courier: { $regex: search, $options: 'i' } }
      ];
    }
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    const shipments = await SellerShipment.find(query)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    const total = await SellerShipment.countDocuments(query);
    res.status(200).json({
      success: true,
      data: shipments,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
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
    const { status, description, location } = req.body;
    if (!status) throw new AppError('Status is required', 400);
    const shipment = await SellerShipment.findOne({ _id: req.params.id, seller: req.user.id });
    if (!shipment) throw new AppError('Shipment not found', 404);
    shipment.status = status;
    shipment.updatedAt = new Date();
    shipment.trackingHistory.push({ status, description, location, timestamp: new Date() });
    await shipment.save();

    // Automate NDR creation if status is Exception
    if (status === 'Exception') {
      const existingNDR = await NDR.findOne({ shipmentId: shipment._id });
      if (!existingNDR) {
        // Fetch order for more details
        const order = await SellerOrder.findById(shipment.orderId);
        await NDR.create({
          orderId: order._id,
          awb: shipment.awb,
          shipmentId: shipment._id,
          customer: order.customer,
          seller: {
            id: order.seller,
            name: req.user.name,
            contact: req.user.phone
          },
          courier: {
            name: shipment.courier,
            trackingUrl: shipment.trackingUrl || ''
          },
          attempts: 1,
          attemptHistory: [{
            date: new Date().toISOString().slice(0, 10),
            time: new Date().toISOString().slice(11, 19),
            status: 'Exception',
            reason: description || '',
            agentRemarks: description || ''
          }],
          status: 'Pending',
          reason: description || '',
          recommendedAction: '',
          currentLocation: shipment.currentLocation || {},
          products: [order.product]
        });
      }
    }

    res.status(200).json({ success: true, data: shipment });
  } catch (error) {
    next(error);
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