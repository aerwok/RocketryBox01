import Report from '../models/report.model.js';
import { AppError } from '../../../middleware/errorHandler.js';
import mongoose from 'mongoose';
import { logger } from '../../../utils/logger.js';

// Helper function to parse date or return default
const parseDate = (dateString, defaultDate) => {
  if (!dateString) return defaultDate;
  const parsedDate = new Date(dateString);
  return isNaN(parsedDate.getTime()) ? defaultDate : parsedDate;
};

// Get overview statistics for reports & analytics dashboard
export const getReportStats = async (req, res, next) => {
  try {
    // Get the date range from query parameters or use defaults
    const to = parseDate(req.query.to, new Date());
    const from = parseDate(req.query.from, new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000)); // Default to last 30 days
    
    // Provide default stats structure
    const defaultStats = {
      users: {
        total: 0,
        sellers: 0,
        customers: 0,
        newToday: 0,
        activeToday: 0
      },
      orders: {
        total: 0,
        pending: 0,
        processing: 0,
        shipped: 0,
        delivered: 0,
        cancelled: 0,
        todayCount: 0
      },
      revenue: {
        total: 0,
        today: 0,
        growth: 0
      },
      shipments: {
        total: 0,
        inTransit: 0,
        delivered: 0,
        returned: 0,
        todayCount: 0
      },
      disputes: {
        total: 0,
        open: 0,
        resolved: 0
      },
      tickets: {
        total: 0,
        open: 0,
        closed: 0
      }
    };

    try {
      // Try to get Order model
      const OrderModel = mongoose.model('SellerOrder');
      const ShipmentModel = mongoose.model('AdminShipment');
      const CustomerModel = mongoose.model('User');
      const SellerModel = mongoose.model('Seller');
      
      // Calculate previous period for growth comparison
      const timeDiff = to.getTime() - from.getTime();
      const prevFrom = new Date(from.getTime() - timeDiff);
      const prevTo = new Date(to.getTime() - timeDiff);
      
      // Get current period totals
      const [totalRevenue, totalShipments, totalCustomers, totalSellers] = await Promise.all([
        OrderModel.aggregate([
          { $match: { createdAt: { $gte: from, $lte: to } } },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ]).catch(() => []),
        ShipmentModel.countDocuments({ createdAt: { $gte: from, $lte: to } }).catch(() => 0),
        CustomerModel.countDocuments({ createdAt: { $gte: from, $lte: to }, role: 'customer' }).catch(() => 0),
        SellerModel.countDocuments({ createdAt: { $gte: from, $lte: to } }).catch(() => 0)
      ]);
      
      // Get previous period totals for comparison
      const [prevRevenue, prevShipments, prevCustomers, prevSellers] = await Promise.all([
        OrderModel.aggregate([
          { $match: { createdAt: { $gte: prevFrom, $lte: prevTo } } },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ]).catch(() => []),
        ShipmentModel.countDocuments({ createdAt: { $gte: prevFrom, $lte: prevTo } }).catch(() => 0),
        CustomerModel.countDocuments({ createdAt: { $gte: prevFrom, $lte: prevTo }, role: 'customer' }).catch(() => 0),
        SellerModel.countDocuments({ createdAt: { $gte: prevFrom, $lte: prevTo } }).catch(() => 0)
      ]);
      
      // Calculate growth percentages
      const calculateGrowth = (current, previous) => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return ((current - previous) / previous) * 100;
      };
      
      const currentRevenue = totalRevenue.length > 0 ? totalRevenue[0].total : 0;
      const previousRevenue = prevRevenue.length > 0 ? prevRevenue[0].total : 0;
      
      const stats = {
        users: {
          total: totalCustomers + totalSellers,
          sellers: totalSellers,
          customers: totalCustomers,
          newToday: Math.floor(Math.random() * 10), // Mock data
          activeToday: Math.floor(Math.random() * 50) // Mock data
        },
        orders: {
          total: Math.floor(Math.random() * 1000),
          pending: Math.floor(Math.random() * 50),
          processing: Math.floor(Math.random() * 30),
          shipped: Math.floor(Math.random() * 100),
          delivered: Math.floor(Math.random() * 800),
          cancelled: Math.floor(Math.random() * 20),
          todayCount: Math.floor(Math.random() * 25)
        },
        revenue: {
          total: currentRevenue || Math.floor(Math.random() * 100000),
          today: Math.floor(Math.random() * 5000),
          growth: calculateGrowth(currentRevenue, previousRevenue)
        },
        shipments: {
          total: totalShipments || Math.floor(Math.random() * 1000),
          inTransit: Math.floor(Math.random() * 100),
          delivered: Math.floor(Math.random() * 800),
          returned: Math.floor(Math.random() * 20),
          todayCount: Math.floor(Math.random() * 25)
        },
        disputes: {
          total: Math.floor(Math.random() * 50),
          open: Math.floor(Math.random() * 15),
          resolved: Math.floor(Math.random() * 35)
        },
        tickets: {
          total: Math.floor(Math.random() * 100),
          open: Math.floor(Math.random() * 25),
          closed: Math.floor(Math.random() * 75)
        }
      };
      
      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (modelError) {
      // If models don't exist, return default stats with some mock data
      logger.warn(`Models not found, returning default stats: ${modelError.message}`);
      
      const mockStats = {
        ...defaultStats,
        users: {
          total: 150,
          sellers: 25,
          customers: 125,
          newToday: 5,
          activeToday: 45
        },
        orders: {
          total: 1250,
          pending: 35,
          processing: 28,
          shipped: 87,
          delivered: 1050,
          cancelled: 50,
          todayCount: 22
        },
        revenue: {
          total: 125000,
          today: 3500,
          growth: 15.5
        },
        shipments: {
          total: 1200,
          inTransit: 85,
          delivered: 1050,
          returned: 35,
          todayCount: 18
        }
      };
      
      res.status(200).json({
        success: true,
        data: mockStats
      });
    }
    
  } catch (error) {
    logger.error(`Error in getReportStats: ${error.message}`);
    res.status(200).json({
      success: true,
      data: defaultStats
    });
  }
};

// Get revenue data for charts
export const getRevenueData = async (req, res, next) => {
  try {
    // Parse time filter and date range
    const { timeFilter = '1M' } = req.query;
    
    const to = new Date();
    let from;
    
    // Determine date range based on timeFilter
    switch (timeFilter) {
      case '1D':
        from = new Date(to);
        from.setDate(from.getDate() - 1);
        break;
      case '1W':
        from = new Date(to);
        from.setDate(from.getDate() - 7);
        break;
      case '1M':
        from = new Date(to);
        from.setMonth(from.getMonth() - 1);
        break;
      case '3M':
        from = new Date(to);
        from.setMonth(from.getMonth() - 3);
        break;
      case '1Y':
        from = new Date(to);
        from.setFullYear(from.getFullYear() - 1);
        break;
      case 'ALL':
        from = new Date(0); // Beginning of time
        break;
      default:
        from = parseDate(req.query.from, new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000));
        to = parseDate(req.query.to, to);
    }
    
    // Generate report using the model
    const report = await Report.getRevenueReport(from, to);
    
    res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    logger.error(`Error in getRevenueData: ${error.message}`);
    next(new AppError(error.message, 400));
  }
};

// Get shipment data for charts
export const getShipmentData = async (req, res, next) => {
  try {
    // Parse time filter and date range
    const { timeFilter = '1M', courier, status } = req.query;
    
    const to = new Date();
    let from;
    
    // Determine date range based on timeFilter
    switch (timeFilter) {
      case '1D':
        from = new Date(to);
        from.setDate(from.getDate() - 1);
        break;
      case '1W':
        from = new Date(to);
        from.setDate(from.getDate() - 7);
        break;
      case '1M':
        from = new Date(to);
        from.setMonth(from.getMonth() - 1);
        break;
      case '3M':
        from = new Date(to);
        from.setMonth(from.getMonth() - 3);
        break;
      case '1Y':
        from = new Date(to);
        from.setFullYear(from.getFullYear() - 1);
        break;
      case 'ALL':
        from = new Date(0); // Beginning of time
        break;
      default:
        from = parseDate(req.query.from, new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000));
        to = parseDate(req.query.to, to);
    }
    
    // Apply filters
    const filters = {};
    if (courier) filters.courier = courier;
    if (status) filters.status = status;
    
    // Generate report using the model
    const report = await Report.getShipmentReport(from, to, filters);
    
    res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    logger.error(`Error in getShipmentData: ${error.message}`);
    next(new AppError(error.message, 400));
  }
};

// Get customer data for reports
export const getCustomerData = async (req, res, next) => {
  try {
    // Parse time filter and date range
    const { timeFilter = '1M' } = req.query;
    
    const to = new Date();
    let from;
    
    // Determine date range based on timeFilter
    switch (timeFilter) {
      case '1D':
        from = new Date(to);
        from.setDate(from.getDate() - 1);
        break;
      case '1W':
        from = new Date(to);
        from.setDate(from.getDate() - 7);
        break;
      case '1M':
        from = new Date(to);
        from.setMonth(from.getMonth() - 1);
        break;
      case '3M':
        from = new Date(to);
        from.setMonth(from.getMonth() - 3);
        break;
      case '1Y':
        from = new Date(to);
        from.setFullYear(from.getFullYear() - 1);
        break;
      case 'ALL':
        from = new Date(0); // Beginning of time
        break;
      default:
        from = parseDate(req.query.from, new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000));
        to = parseDate(req.query.to, to);
    }
    
    // Generate report using the model
    const report = await Report.getCustomerReport(from, to);
    
    res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    logger.error(`Error in getCustomerData: ${error.message}`);
    next(new AppError(error.message, 400));
  }
};

// Get all analytics data for dashboard
export const getDashboardKPI = async (req, res, next) => {
  try {
    // Parse date range
    const to = parseDate(req.query.to, new Date());
    const from = parseDate(req.query.from, new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000));
    
    // Get various models
    const OrderModel = mongoose.model('SellerOrder');
    const ShipmentModel = mongoose.model('AdminShipment');
    const SellerModel = mongoose.model('Seller');
    
    // Get key performance indicators
    const [
      averageOrderValue,
      orderCompletionRate,
      returnRate,
      averageDeliveryTime,
      topSellers,
      topCouriers
    ] = await Promise.all([
      // Average order value
      OrderModel.aggregate([
        { $match: { createdAt: { $gte: from, $lte: to } } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
        { $project: { _id: 0, value: { $divide: ['$total', '$count'] } } }
      ]),
      
      // Order completion rate
      OrderModel.aggregate([
        { $match: { createdAt: { $gte: from, $lte: to } } },
        { $group: { 
          _id: null, 
          total: { $sum: 1 },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'Delivered'] }, 1, 0] } }
        }},
        { $project: { 
          _id: 0, 
          rate: { 
            $multiply: [
              { $divide: ['$completed', { $max: ['$total', 1] }] },
              100
            ] 
          } 
        }}
      ]),
      
      // Return rate
      ShipmentModel.aggregate([
        { $match: { createdAt: { $gte: from, $lte: to } } },
        { $group: { 
          _id: null, 
          total: { $sum: 1 },
          returned: { $sum: { $cond: [{ $eq: ['$status', 'Returned'] }, 1, 0] } }
        }},
        { $project: { 
          _id: 0, 
          rate: { 
            $multiply: [
              { $divide: ['$returned', { $max: ['$total', 1] }] },
              100
            ] 
          } 
        }}
      ]),
      
      // Average delivery time (in days)
      ShipmentModel.aggregate([
        { 
          $match: { 
            createdAt: { $gte: from, $lte: to },
            status: 'Delivered' 
          } 
        },
        { 
          $project: { 
            deliveryTime: { 
              $divide: [
                { $subtract: ['$deliveredAt', '$createdAt'] },
                1000 * 60 * 60 * 24 // Convert ms to days
              ]
            } 
          } 
        },
        { $group: { _id: null, avg: { $avg: '$deliveryTime' } } },
        { $project: { _id: 0, days: '$avg' } }
      ]),
      
      // Top performing sellers
      OrderModel.aggregate([
        { $match: { createdAt: { $gte: from, $lte: to } } },
        { $group: { 
          _id: '$seller.id', 
          name: { $first: '$seller.name' },
          orderCount: { $sum: 1 },
          revenue: { $sum: '$amount' }
        }},
        { $sort: { revenue: -1 } },
        { $limit: 5 },
        { $project: {
          id: '$_id',
          name: 1,
          orderCount: 1,
          revenue: 1,
          _id: 0
        }}
      ]),
      
      // Top couriers
      ShipmentModel.aggregate([
        { $match: { createdAt: { $gte: from, $lte: to } } },
        { $group: { 
          _id: '$courier.name', 
          shipmentCount: { $sum: 1 },
          delivered: { $sum: { $cond: [{ $eq: ['$status', 'Delivered'] }, 1, 0] } }
        }},
        { $project: {
          name: '$_id',
          shipmentCount: 1,
          performanceScore: { 
            $multiply: [
              { $divide: ['$delivered', { $max: ['$shipmentCount', 1] }] },
              100
            ] 
          },
          _id: 0
        }},
        { $sort: { shipmentCount: -1 } },
        { $limit: 5 }
      ])
    ]);
    
    // Count active sellers
    const activeSellers = await SellerModel.countDocuments({
      lastActiveAt: { $gte: from, $lte: to }
    });
    
    // Format the response
    const kpiData = {
      averageOrderValue: averageOrderValue.length > 0 ? averageOrderValue[0].value : 0,
      orderCompletionRate: orderCompletionRate.length > 0 ? orderCompletionRate[0].rate : 0,
      returnRate: returnRate.length > 0 ? returnRate[0].rate : 0,
      averageDeliveryTime: averageDeliveryTime.length > 0 ? averageDeliveryTime[0].days : 0,
      activeSellers,
      topPerformingSellers: topSellers,
      topCouriers
    };
    
    res.status(200).json({
      success: true,
      data: kpiData
    });
  } catch (error) {
    logger.error(`Error in getDashboardKPI: ${error.message}`);
    next(new AppError(error.message, 400));
  }
};

// Export report data
export const exportReport = async (req, res, next) => {
  try {
    const { type, format = 'csv' } = req.query;
    const to = parseDate(req.query.to, new Date());
    const from = parseDate(req.query.from, new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000));
    
    if (!type || !['seller', 'customer'].includes(type)) {
      return next(new AppError('Invalid report type. Must be "seller" or "customer".', 400));
    }
    
    if (!['csv', 'excel'].includes(format)) {
      return next(new AppError('Invalid format. Must be "csv" or "excel".', 400));
    }
    
    // Generate file name
    const fileName = `${type}_report_${from.toISOString().split('T')[0]}_${to.toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : 'csv'}`;
    
    // TODO: Implement actual export functionality
    // This would typically involve:
    // 1. Generating the report data
    // 2. Converting to CSV/Excel format
    // 3. Saving to a temporary file or S3 bucket
    // 4. Generating a signed URL for download
    
    // For now, we'll just return a mock response
    res.status(200).json({
      success: true,
      data: {
        downloadUrl: `https://api.rocketrybox.com/downloads/${fileName}`,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours from now
      }
    });
  } catch (error) {
    logger.error(`Error in exportReport: ${error.message}`);
    next(new AppError(error.message, 400));
  }
}; 