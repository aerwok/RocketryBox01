import { AppError } from '../../../middleware/errorHandler.js';
import { logger } from '../../../utils/logger.js';
import Customer from '../../customer/models/customer.model.js';
import Order from '../../order/models/order.model.js';
import Seller from '../../seller/models/seller.model.js';
import WeightDispute from '../../seller/models/weightDispute.model.js';
import Shipment from '../../shipping/models/shipment.model.js';
import Ticket from '../../support/models/ticket.model.js';
import Session from '../models/session.model.js';
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
    const [totalRevenue, todayRevenue] = await Promise.all([
      Order.aggregate([
        { $match: { status: { $ne: 'Cancelled' } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]).then(result => (result.length > 0 ? result[0].total : 0)),

      Order.aggregate([
        {
          $match: {
            status: { $ne: 'Cancelled' },
            createdAt: { $gte: today }
          }
        },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]).then(result => (result.length > 0 ? result[0].total : 0))
    ]);

    // Calculate revenue growth (compare with yesterday)
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayRevenue = await Order.aggregate([
      {
        $match: {
          status: { $ne: 'Cancelled' },
          createdAt: {
            $gte: yesterday,
            $lt: today
          }
        }
      },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]).then(result => (result.length > 0 ? result[0].total : 0));

    const revenueGrowth = yesterdayRevenue > 0
      ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue * 100).toFixed(2)
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
 * Get KPI data for dashboard
 * @route GET /api/v2/admin/dashboard/kpi
 * @access Private (Admin only)
 */
export const getKPI = async (req, res, next) => {
  try {
    // Basic KPI data
    const kpiData = {
      averageOrderValue: 0,
      orderCompletionRate: 0,
      returnRate: 0,
      averageDeliveryTime: 0,
      userAcquisitionCost: 0,
      revenueGrowth: 0,
      activeSellers: 0,
      topPerformingSellers: [],
      topCouriers: []
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

/**
 * Get shipments data for dashboard
 * @route GET /api/v2/admin/dashboard/shipments
 * @access Private (Admin only)
 */
export const getShipments = async (req, res, next) => {
  try {
    // Mock shipments data for now
    const mockShipments = [
      {
        id: '1',
        awbNumber: 'AWB123456789',
        orderId: 'ORD001',
        customer: 'John Doe',
        status: 'In Transit',
        courier: 'BlueDart',
        createdAt: new Date(),
        estimatedDelivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
      },
      {
        id: '2',
        awbNumber: 'AWB987654321',
        orderId: 'ORD002',
        customer: 'Jane Smith',
        status: 'Delivered',
        courier: 'Delhivery',
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        deliveredAt: new Date()
      },
      {
        id: '3',
        awbNumber: 'AWB456789123',
        orderId: 'ORD003',
        customer: 'Bob Johnson',
        status: 'Pending Pickup',
        courier: 'Ecom Express',
        createdAt: new Date(),
        estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
      }
    ];

    res.status(200).json({
      success: true,
      data: mockShipments
    });
  } catch (error) {
    logger.error(`Error in getShipments: ${error.message}`);
    next(new AppError('Failed to fetch shipments', 500));
  }
};
