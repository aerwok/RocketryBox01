import { AppError } from '../../../middleware/errorHandler.js';
import { logger } from '../../../utils/logger.js';
import Seller from '../../seller/models/seller.model.js';
import Customer from '../../customer/models/customer.model.js';
import Order from '../../order/models/order.model.js';
import Session from '../models/session.model.js';
import Shipment from '../../shipping/models/shipment.model.js';
import Ticket from '../../support/models/ticket.model.js';
import WeightDispute from '../../seller/models/weightDispute.model.js';
import { getRealtimeDashboardData } from '../services/realtime.service.js';

/**
 * Get dashboard overview statistics
 * @route GET /api/v2/admin/dashboard/overview
 * @access Private (Admin only)
 */
export const getDashboardOverview = async (req, res, next) => {
  try {
    // Get today's date for filtering
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Get user statistics
    const [
      totalUsers,
      totalSellers,
      totalCustomers,
      newTodayUsers,
      activeTodaySessions
    ] = await Promise.all([
      // Total users (sellers + customers)
      Promise.all([
        Seller.countDocuments(),
        Customer.countDocuments()
      ]).then(counts => counts.reduce((acc, count) => acc + count, 0)),
      
      // Total sellers
      Seller.countDocuments(),
      
      // Total customers
      Customer.countDocuments(),
      
      // New users today
      Promise.all([
        Seller.countDocuments({ createdAt: { $gte: today } }),
        Customer.countDocuments({ createdAt: { $gte: today } })
      ]).then(counts => counts.reduce((acc, count) => acc + count, 0)),
      
      // Active users today (based on sessions)
      Session.countDocuments({ 
        isActive: true, 
        lastActive: { $gte: today } 
      })
    ]);
    
    // Get order statistics
    const [
      totalOrders,
      pendingOrders,
      processingOrders,
      shippedOrders,
      deliveredOrders,
      cancelledOrders,
      todayOrders
    ] = await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ status: 'Pending' }),
      Order.countDocuments({ status: 'Processing' }),
      Order.countDocuments({ status: 'Shipped' }),
      Order.countDocuments({ status: 'Delivered' }),
      Order.countDocuments({ status: 'Cancelled' }),
      Order.countDocuments({ createdAt: { $gte: today } })
    ]);
    
    // Get revenue statistics
    const totalRevenue = await Order.aggregate([
      { $match: { status: { $ne: 'Cancelled' } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]).then(result => (result.length > 0 ? result[0].total : 0));
    
    const todayRevenue = await Order.aggregate([
      { 
        $match: { 
          status: { $ne: 'Cancelled' },
          createdAt: { $gte: today }
        } 
      },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]).then(result => (result.length > 0 ? result[0].total : 0));
    
    // Calculate revenue growth (today vs. yesterday)
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const dayBefore = new Date(yesterday);
    dayBefore.setHours(0, 0, 0, 0);
    
    const yesterdayRevenue = await Order.aggregate([
      { 
        $match: { 
          status: { $ne: 'Cancelled' },
          createdAt: { $gte: dayBefore, $lt: today }
        } 
      },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]).then(result => (result.length > 0 ? result[0].total : 0));
    
    const revenueGrowth = yesterdayRevenue > 0 
      ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100 
      : 0;
    
    // Get shipment statistics
    const [
      totalShipments,
      inTransitShipments,
      deliveredShipments,
      returnedShipments,
      todayShipments
    ] = await Promise.all([
      Shipment.countDocuments(),
      Shipment.countDocuments({ status: 'In Transit' }),
      Shipment.countDocuments({ status: 'Delivered' }),
      Shipment.countDocuments({ status: 'Returned' }),
      Shipment.countDocuments({ createdAt: { $gte: today } })
    ]);
    
    // Get support statistics
    const [
      totalDisputes,
      openDisputes,
      resolvedDisputes,
      totalTickets,
      openTickets,
      closedTickets
    ] = await Promise.all([
      WeightDispute.countDocuments(),
      WeightDispute.countDocuments({ status: 'Open' }),
      WeightDispute.countDocuments({ status: 'Resolved' }),
      Ticket.countDocuments(),
      Ticket.countDocuments({ status: { $in: ['New', 'In Progress'] } }),
      Ticket.countDocuments({ status: { $in: ['Resolved', 'Closed'] } })
    ]);
    
    // Assemble response
    const overview = {
      users: {
        total: totalUsers,
        sellers: totalSellers,
        customers: totalCustomers,
        newToday: newTodayUsers,
        activeToday: activeTodaySessions
      },
      orders: {
        total: totalOrders,
        pending: pendingOrders,
        processing: processingOrders,
        shipped: shippedOrders,
        delivered: deliveredOrders,
        cancelled: cancelledOrders,
        todayCount: todayOrders
      },
      revenue: {
        total: totalRevenue,
        today: todayRevenue,
        growth: revenueGrowth
      },
      shipments: {
        total: totalShipments,
        inTransit: inTransitShipments,
        delivered: deliveredShipments,
        returned: returnedShipments,
        todayCount: todayShipments
      },
      disputes: {
        total: totalDisputes,
        open: openDisputes,
        resolved: resolvedDisputes
      },
      tickets: {
        total: totalTickets,
        open: openTickets,
        closed: closedTickets
      }
    };
    
    res.status(200).json({
      success: true,
      data: overview
    });
  } catch (error) {
    logger.error(`Error in getDashboardOverview: ${error.message}`);
    next(new AppError('Failed to fetch dashboard overview', 500));
  }
};

/**
 * Get key performance indicators
 * @route GET /api/v2/admin/dashboard/kpi
 * @access Private (Admin only)
 */
export const getKPI = async (req, res, next) => {
  try {
    const { from, to } = req.query;
    
    let dateFilter = {};
    
    if (from && to) {
      dateFilter = {
        createdAt: {
          $gte: new Date(from),
          $lte: new Date(to)
        }
      };
    } else if (from) {
      dateFilter = {
        createdAt: { $gte: new Date(from) }
      };
    } else if (to) {
      dateFilter = {
        createdAt: { $lte: new Date(to) }
      };
    }
    
    // Calculate average order value
    const avgOrderValue = await Order.aggregate([
      { $match: { ...dateFilter, status: { $ne: 'Cancelled' } } },
      { $group: { _id: null, avg: { $avg: '$totalAmount' } } }
    ]).then(result => (result.length > 0 ? result[0].avg : 0));
    
    // Calculate order completion rate
    const [totalOrders, completedOrders] = await Promise.all([
      Order.countDocuments(dateFilter),
      Order.countDocuments({ ...dateFilter, status: 'Delivered' })
    ]);
    
    const orderCompletionRate = totalOrders > 0 
      ? (completedOrders / totalOrders) * 100 
      : 0;
    
    // Calculate return rate
    const returnedOrders = await Order.countDocuments({ 
      ...dateFilter, 
      status: 'Returned' 
    });
    
    const returnRate = totalOrders > 0 
      ? (returnedOrders / totalOrders) * 100 
      : 0;
    
    // Calculate average delivery time
    const deliveryTimes = await Order.aggregate([
      { 
        $match: { 
          ...dateFilter, 
          status: 'Delivered',
          deliveredAt: { $exists: true },
          createdAt: { $exists: true }
        } 
      },
      { 
        $project: { 
          deliveryTime: { 
            $divide: [
              { $subtract: ['$deliveredAt', '$createdAt'] }, 
              3600000 // Convert ms to hours
            ] 
          } 
        } 
      },
      { $group: { _id: null, avg: { $avg: '$deliveryTime' } } }
    ]).then(result => (result.length > 0 ? result[0].avg : 0));
    
    // Calculate user acquisition cost (placeholder calculation)
    const marketingExpenses = 1000; // Placeholder value
    const newUsers = await Promise.all([
      Seller.countDocuments({ 
        ...dateFilter, 
        createdAt: { $exists: true } 
      }),
      Customer.countDocuments({ 
        ...dateFilter, 
        createdAt: { $exists: true } 
      })
    ]).then(counts => counts.reduce((acc, count) => acc + count, 0));
    
    const userAcquisitionCost = newUsers > 0 
      ? marketingExpenses / newUsers 
      : 0;
    
    // Calculate revenue growth
    const periodStart = from ? new Date(from) : new Date(new Date().setMonth(new Date().getMonth() - 1));
    const periodEnd = to ? new Date(to) : new Date();
    
    const previousStart = new Date(periodStart);
    previousStart.setDate(previousStart.getDate() - (periodEnd - periodStart) / (1000 * 60 * 60 * 24));
    
    const [currentPeriodRevenue, previousPeriodRevenue] = await Promise.all([
      Order.aggregate([
        { 
          $match: { 
            status: { $ne: 'Cancelled' },
            createdAt: { $gte: periodStart, $lte: periodEnd }
          } 
        },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]).then(result => (result.length > 0 ? result[0].total : 0)),
      
      Order.aggregate([
        { 
          $match: { 
            status: { $ne: 'Cancelled' },
            createdAt: { $gte: previousStart, $lt: periodStart }
          } 
        },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]).then(result => (result.length > 0 ? result[0].total : 0))
    ]);
    
    const revenueGrowth = previousPeriodRevenue > 0 
      ? ((currentPeriodRevenue - previousPeriodRevenue) / previousPeriodRevenue) * 100 
      : 0;
    
    // Get active sellers count
    const activeSellers = await Seller.countDocuments({
      ...dateFilter,
      status: 'Active'
    });
    
    // Get top performing sellers
    const topSellers = await Order.aggregate([
      { $match: { ...dateFilter, status: { $ne: 'Cancelled' } } },
      { $group: {
        _id: '$seller',
        orderCount: { $sum: 1 },
        revenue: { $sum: '$totalAmount' }
      }},
      { $sort: { revenue: -1 } },
      { $limit: 5 },
      { $lookup: {
        from: 'sellers',
        localField: '_id',
        foreignField: '_id',
        as: 'sellerInfo'
      }},
      { $unwind: '$sellerInfo' },
      { $project: {
        id: '$_id',
        name: '$sellerInfo.name',
        orderCount: 1,
        revenue: 1
      }}
    ]);
    
    // Get top couriers
    const topCouriers = await Shipment.aggregate([
      { $match: dateFilter },
      { $group: {
        _id: '$courier',
        shipmentCount: { $sum: 1 },
        deliveredCount: {
          $sum: { $cond: [{ $eq: ['$status', 'Delivered'] }, 1, 0] }
        }
      }},
      { $project: {
        name: '$_id',
        shipmentCount: 1,
        performanceScore: {
          $multiply: [
            { $divide: ['$deliveredCount', '$shipmentCount'] },
            100
          ]
        }
      }},
      { $sort: { shipmentCount: -1 } },
      { $limit: 5 }
    ]);
    
    // Assemble response
    const kpiData = {
      averageOrderValue: avgOrderValue,
      orderCompletionRate: orderCompletionRate,
      returnRate: returnRate,
      averageDeliveryTime: deliveryTimes,
      userAcquisitionCost: userAcquisitionCost,
      revenueGrowth: revenueGrowth,
      activeSellers: activeSellers,
      topPerformingSellers: topSellers,
      topCouriers: topCouriers
    };
    
    res.status(200).json({
      success: true,
      data: kpiData
    });
  } catch (error) {
    logger.error(`Error in getKPI: ${error.message}`);
    next(new AppError('Failed to fetch KPI data', 500));
  }
};

/**
 * Get real-time dashboard data
 * @route GET /api/v2/admin/dashboard/realtime
 * @access Private (Admin only)
 */
export const getRealtimeData = async (req, res, next) => {
  try {
    const dashboardData = await getRealtimeDashboardData();
    
    res.status(200).json({
      success: true,
      data: dashboardData
    });
  } catch (error) {
    logger.error(`Error in getRealtimeData: ${error.message}`);
    next(new AppError('Failed to fetch real-time dashboard data', 500));
  }
}; 