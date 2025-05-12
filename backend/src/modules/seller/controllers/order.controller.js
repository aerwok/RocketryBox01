import SellerOrder from '../models/order.model.js';
import SellerShipment from '../models/shipment.model.js';
import Seller from '../models/seller.model.js';
import WalletTransaction from '../models/walletTransaction.model.js';
import { AppError } from '../../../middleware/errorHandler.js';
import { validateOrder, validateBulkOrderStatus } from '../validators/order.validator.js';
import xlsx from 'xlsx';
import { Readable } from 'stream';
import { calculateCourierRates } from '../../../utils/courierRates.js';
import { getPincodeDetails } from '../../../utils/pincode.js';

// Create a new order
export const createOrder = async (req, res, next) => {
  try {
    const { error } = validateOrder(req.body);
    if (error) throw new AppError(error.details[0].message, 400);

    // Get seller's pickup pincode
    const seller = await Seller.findById(req.user.id);
    const sellerPincode = seller.pickupPincode;
    if (!sellerPincode) {
      throw new AppError('Seller pickup pincode not configured', 400);
    }

    // Validate pickup and delivery pincodes
    const pickupDetails = await getPincodeDetails(sellerPincode);
    const deliveryDetails = await getPincodeDetails(req.body.customer.address.pincode);

    if (!pickupDetails || !deliveryDetails) {
      throw new AppError('Invalid pickup or delivery pincode', 400);
    }

    // Calculate shipping rates
    const weight = parseFloat(req.body.product.weight);
    const isCOD = req.body.payment.method === 'COD';
    const courierRates = await calculateCourierRates({
      weight,
      pickupPincode: sellerPincode,
      deliveryPincode: req.body.customer.address.pincode,
      isCOD
    });

    // Find the best rate (lowest cost)
    const bestRate = courierRates.reduce((min, rate) =>
      rate.total < min.total ? rate : min
    );

    // Update payment details with shipping charges
    const shippingCharge = bestRate.total.toString();
    const codCharge = isCOD ? bestRate.cod.toString() : '0';
    const total = (
      parseFloat(req.body.payment.amount) +
      parseFloat(shippingCharge) +
      parseFloat(codCharge)
    ).toString();

    // Wallet debit logic
    const currentBalance = parseFloat(seller.walletBalance || '0');
    if (currentBalance < parseFloat(shippingCharge)) {
      throw new AppError('Insufficient wallet balance for shipping charge', 402);
    }
    // Deduct shipping charge and update wallet
    seller.walletBalance = (currentBalance - parseFloat(shippingCharge)).toFixed(2);
    await seller.save();
    // Record wallet transaction
    await WalletTransaction.create({
      seller: seller._id,
      orderId: null, // Will update after order is created
      type: 'Debit',
      amount: shippingCharge,
      remark: 'Shipping charge debited for new order',
      closingBalance: seller.walletBalance
    });

    const order = new SellerOrder({
      ...req.body,
      seller: req.user.id,
      orderDate: new Date(),
      status: 'Pending',
      payment: {
        ...req.body.payment,
        shippingCharge,
        codCharge,
        total
      },
      courier: bestRate.courier,
      shippingDetails: {
        zone: bestRate.zone,
        weight: weight.toString(),
        chargeableWeight: bestRate.weight.toString(),
        baseRate: bestRate.base.toString(),
        additionalCharges: bestRate.addlCharge.toString(),
        codCharges: codCharge,
        totalCharges: shippingCharge
      },
      orderTimeline: [{ status: 'Pending', timestamp: new Date(), comment: 'Order created' }]
    });

    await order.save();
    // Update wallet transaction with orderId
    await WalletTransaction.updateOne(
      { seller: seller._id, orderId: null, type: 'Debit', amount: shippingCharge },
      { orderId: order._id }
    );

    res.status(201).json({
      success: true,
      data: {
        order,
        availableRates: courierRates
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get all orders with pagination and filters
export const getOrders = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      startDate,
      endDate,
      search,
      sortBy = 'orderDate',
      sortOrder = 'desc'
    } = req.query;

    const query = { seller: req.user.id };
    
    // Apply filters
    if (status) query.status = status;
    if (startDate || endDate) {
      query.orderDate = {};
      if (startDate) query.orderDate.$gte = new Date(startDate);
      if (endDate) query.orderDate.$lte = new Date(endDate);
    }
    if (search) {
      query.$or = [
        { orderId: { $regex: search, $options: 'i' } },
        { 'customer.name': { $regex: search, $options: 'i' } },
        { 'customer.phone': { $regex: search, $options: 'i' } }
      ];
    }

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const orders = await SellerOrder.find(query)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await SellerOrder.countDocuments(query);

    res.status(200).json({
      success: true,
      data: orders,
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

// Get single order by ID
export const getOrder = async (req, res, next) => {
  try {
    const order = await SellerOrder.findOne({
      _id: req.params.id,
      seller: req.user.id
    });

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    next(error);
  }
};

// Update order status
export const updateOrderStatus = async (req, res, next) => {
  try {
    const { status, comment } = req.body;
    if (!status) throw new AppError('Status is required', 400);

    const order = await SellerOrder.findOne({ _id: req.params.id, seller: req.user.id });
    if (!order) throw new AppError('Order not found', 404);

    order.status = status;
    order.updatedAt = new Date();
    order.orderTimeline.push({ status, timestamp: new Date(), comment: comment || '' });
    await order.save();

    // If there's an associated shipment, update its status too
    if (order.awb && status === 'Cancelled') {
      await SellerShipment.findOneAndUpdate(
        { awb: order.awb },
        { status: 'Cancelled', updatedAt: new Date() }
      );
    }

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    next(error);
  }
};

// Cancel order
export const cancelOrder = async (req, res, next) => {
  try {
    const order = await SellerOrder.findOne({
      _id: req.params.id,
      seller: req.user.id
    });

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    if (order.status === 'Delivered') {
      throw new AppError('Cannot cancel a delivered order', 400);
    }

    order.status = 'Cancelled';
    order.updatedAt = new Date();
    await order.save();

    // If there's an associated shipment, update its status too
    if (order.awb) {
      await SellerShipment.findOneAndUpdate(
        { awb: order.awb },
        { status: 'Cancelled', updatedAt: new Date() }
      );
    }

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    next(error);
  }
};

// Get order statistics
export const getOrderStats = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const query = { seller: req.user.id };

    if (startDate || endDate) {
      query.orderDate = {};
      if (startDate) query.orderDate.$gte = new Date(startDate);
      if (endDate) query.orderDate.$lte = new Date(endDate);
    }

    const stats = await SellerOrder.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: { $toDouble: '$payment.amount' } }
        }
      }
    ]);

    const totalOrders = await SellerOrder.countDocuments(query);
    const totalAmount = await SellerOrder.aggregate([
      { $match: query },
      { $group: { _id: null, total: { $sum: { $toDouble: '$payment.amount' } } } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalOrders,
        totalAmount: totalAmount[0]?.total || 0,
        statusBreakdown: stats
      }
    });
  } catch (error) {
    next(error);
  }
};

// Export orders to Excel
export const exportOrders = async (req, res, next) => {
  try {
    const { startDate, endDate, status } = req.query;
    const query = { seller: req.user.id };

    if (status) query.status = status;
    if (startDate || endDate) {
      query.orderDate = {};
      if (startDate) query.orderDate.$gte = new Date(startDate);
      if (endDate) query.orderDate.$lte = new Date(endDate);
    }

    const orders = await SellerOrder.find(query).lean();

    // Transform orders for Excel
    const excelData = orders.map(order => ({
      'Order ID': order.orderId,
      'Order Date': order.orderDate.toISOString().split('T')[0],
      'Customer Name': order.customer.name,
      'Customer Phone': order.customer.phone,
      'Customer Email': order.customer.email,
      'Product Name': order.product.name,
      'Product SKU': order.product.sku,
      'Quantity': order.product.quantity,
      'Price': order.product.price,
      'Payment Method': order.payment.method,
      'Amount': order.payment.amount,
      'Status': order.status,
      'AWB': order.awb || '',
      'Courier': order.courier || ''
    }));

    // Create workbook and worksheet
    const wb = xlsx.utils.book_new();
    const ws = xlsx.utils.json_to_sheet(excelData);

    // Add worksheet to workbook
    xlsx.utils.book_append_sheet(wb, ws, 'Orders');

    // Generate buffer
    const excelBuffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });

    // Set headers for file download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=orders.xlsx');

    // Send file
    res.send(excelBuffer);
  } catch (error) {
    next(error);
  }
};

// Generate sample template for order import
export const generateImportTemplate = async (req, res, next) => {
  try {
    const templateData = [{
      'Order ID': 'ORD123456',
      'Customer Name': 'John Doe',
      'Customer Phone': '9876543210',
      'Customer Email': 'john@example.com',
      'Street': '123 Main St',
      'City': 'Mumbai',
      'State': 'Maharashtra',
      'Pincode': '400001',
      'Country': 'India',
      'Product Name': 'Sample Product',
      'Product SKU': 'SKU123',
      'Quantity': '1',
      'Price': '1000.00',
      'Weight': '1.5',
      'Length': '10',
      'Width': '10',
      'Height': '5',
      'Payment Method': 'Prepaid',
      'Amount': '1000.00',
      'Shipping Charge': '50.00',
      'GST': '180.00',
      'Total': '1230.00'
    }];

    const wb = xlsx.utils.book_new();
    const ws = xlsx.utils.json_to_sheet(templateData);

    // Add column descriptions
    const descriptions = {
      'Order ID': 'Unique order identifier (required)',
      'Customer Name': 'Full name of the customer (required)',
      'Customer Phone': '10-digit phone number (required)',
      'Customer Email': 'Valid email address (required)',
      'Street': 'Street address (required)',
      'City': 'City name (required)',
      'State': 'State name (required)',
      'Pincode': '6-digit pincode (required)',
      'Country': 'Country name (defaults to India)',
      'Product Name': 'Name of the product (required)',
      'Product SKU': 'Unique product identifier (required)',
      'Quantity': 'Number of items (required, min: 1)',
      'Price': 'Product price (required, min: 0)',
      'Weight': 'Product weight in kg (required)',
      'Length': 'Package length in cm (required)',
      'Width': 'Package width in cm (required)',
      'Height': 'Package height in cm (required)',
      'Payment Method': 'COD or Prepaid (required)',
      'Amount': 'Product amount (required)',
      'Shipping Charge': 'Shipping cost (required)',
      'GST': 'GST amount (required)',
      'Total': 'Total amount including all charges (required)'
    };

    // Add descriptions as comments
    ws['!comments'] = descriptions;

    xlsx.utils.book_append_sheet(wb, ws, 'Order Template');
    const excelBuffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=order_import_template.xlsx');
    res.send(excelBuffer);
  } catch (error) {
    next(error);
  }
};

// Import orders from Excel
export const importOrders = async (req, res, next) => {
  try {
    if (!req.file) {
      throw new AppError('Please upload an Excel file', 400);
    }

    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(worksheet);

    if (data.length === 0) {
      throw new AppError('Excel file is empty', 400);
    }

    const results = {
      success: 0,
      failed: 0,
      errors: [],
      warnings: []
    };

    // Track unique order IDs to prevent duplicates
    const processedOrderIds = new Set();

    for (const [index, row] of data.entries()) {
      try {
        // Check for duplicate order IDs
        if (processedOrderIds.has(row['Order ID'])) {
          throw new Error('Duplicate Order ID');
        }
        processedOrderIds.add(row['Order ID']);

        // Validate required fields
        const requiredFields = [
          'Order ID', 'Customer Name', 'Customer Phone', 'Customer Email',
          'Street', 'City', 'State', 'Pincode', 'Product Name', 'Product SKU',
          'Quantity', 'Price', 'Weight', 'Length', 'Width', 'Height',
          'Payment Method', 'Amount', 'Shipping Charge', 'GST', 'Total'
        ];

        const missingFields = requiredFields.filter(field => !row[field]);
        if (missingFields.length > 0) {
          throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
        }

        // Validate phone number
        if (!/^[0-9]{10}$/.test(row['Customer Phone'])) {
          throw new Error('Invalid phone number format');
        }

        // Validate email
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row['Customer Email'])) {
          throw new Error('Invalid email format');
        }

        // Validate pincode
        if (!/^[0-9]{6}$/.test(row['Pincode'])) {
          throw new Error('Invalid pincode format');
        }

        // Validate numeric fields
        const numericFields = {
          'Quantity': { min: 1 },
          'Price': { min: 0 },
          'Length': { min: 0 },
          'Width': { min: 0 },
          'Height': { min: 0 }
        };

        for (const [field, rules] of Object.entries(numericFields)) {
          const value = parseFloat(row[field]);
          if (isNaN(value) || value < rules.min) {
            throw new Error(`Invalid ${field}: must be a number >= ${rules.min}`);
          }
        }

        // Validate payment method
        if (!['COD', 'Prepaid'].includes(row['Payment Method'])) {
          throw new Error('Invalid payment method: must be COD or Prepaid');
        }

        const orderData = {
          orderId: row['Order ID'],
          customer: {
            name: row['Customer Name'],
            phone: row['Customer Phone'],
            email: row['Customer Email'],
            address: {
              street: row['Street'],
              city: row['City'],
              state: row['State'],
              pincode: row['Pincode'],
              country: row['Country'] || 'India'
            }
          },
          product: {
            name: row['Product Name'],
            sku: row['Product SKU'],
            quantity: parseInt(row['Quantity']),
            price: parseFloat(row['Price']),
            weight: row['Weight'],
            dimensions: {
              length: parseFloat(row['Length']),
              width: parseFloat(row['Width']),
              height: parseFloat(row['Height'])
            }
          },
          payment: {
            method: row['Payment Method'],
            amount: row['Amount'].toString(),
            shippingCharge: row['Shipping Charge'].toString(),
            gst: row['GST'].toString(),
            total: row['Total'].toString()
          },
          channel: 'EXCEL'
        };

        const { error } = validateOrder(orderData);
        if (error) {
          throw new Error(error.details[0].message);
        }

        // Check if order ID already exists
        const existingOrder = await SellerOrder.findOne({ orderId: orderData.orderId });
        if (existingOrder) {
          throw new Error('Order ID already exists in the system');
        }

        const order = new SellerOrder({
          ...orderData,
          seller: req.user.id,
          orderDate: new Date(),
          status: 'Pending'
        });

        await order.save();
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          row: index + 2, // Excel row number (1-based + header)
          orderId: row['Order ID'],
          error: error.message
        });
      }
    }

    // Add warnings if any
    if (results.failed > 0) {
      results.warnings.push(`${results.failed} orders failed to import. Check the errors array for details.`);
    }

    res.status(200).json({
      success: true,
      data: results
    });
  } catch (error) {
    next(error);
  }
};

// Bulk update order status
export const bulkUpdateStatus = async (req, res, next) => {
  try {
    const { orderIds, status } = req.body;
    const { error } = validateBulkOrderStatus({ status });
    if (error) throw new AppError(error.details[0].message, 400);

    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      throw new AppError('Please provide an array of order IDs', 400);
    }

    const result = await SellerOrder.updateMany(
      {
        _id: { $in: orderIds },
        seller: req.user.id
      },
      {
        $set: {
          status,
          updatedAt: new Date()
        }
      }
    );

    // If orders have associated shipments, update their status too
    if (status === 'Cancelled') {
      const orders = await SellerOrder.find({
        _id: { $in: orderIds },
        seller: req.user.id,
        awb: { $exists: true, $ne: null }
      });

      const awbs = orders.map(order => order.awb);
      if (awbs.length > 0) {
        await SellerShipment.updateMany(
          { awb: { $in: awbs } },
          { status: 'Cancelled', updatedAt: new Date() }
        );
      }
    }

    res.status(200).json({
      success: true,
      data: {
        modified: result.modifiedCount,
        total: orderIds.length
      }
    });
  } catch (error) {
    next(error);
  }
};

// Add a note to an order
export const addOrderNote = async (req, res, next) => {
  try {
    const { note } = req.body;
    if (!note) throw new AppError('Note is required', 400);
    const order = await SellerOrder.findOne({ _id: req.params.id, seller: req.user.id });
    if (!order) throw new AppError('Order not found', 404);
    order.notes.push({ note, createdBy: req.user.id });
    await order.save();
    res.status(200).json({ success: true, data: order.notes });
  } catch (error) {
    next(error);
  }
};

// Get order timeline
export const getOrderTimeline = async (req, res, next) => {
  try {
    const order = await SellerOrder.findOne({ _id: req.params.id, seller: req.user.id });
    if (!order) throw new AppError('Order not found', 404);
    res.status(200).json({ success: true, data: order.orderTimeline });
  } catch (error) {
    next(error);
  }
};

// Get order notes
export const getOrderNotes = async (req, res, next) => {
  try {
    const order = await SellerOrder.findOne({ _id: req.params.id, seller: req.user.id }).populate('notes.createdBy', 'name email');
    if (!order) throw new AppError('Order not found', 404);
    res.status(200).json({ success: true, data: order.notes });
  } catch (error) {
    next(error);
  }
}; 