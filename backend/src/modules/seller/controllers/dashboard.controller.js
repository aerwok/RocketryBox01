import SellerOrder from '../models/order.model.js';
import SellerShipment from '../models/shipment.model.js';
import SellerProduct from '../models/product.model.js';
import { AppError } from '../../../middleware/errorHandler.js';

export const getDashboardSummary = async (req, res, next) => {
  try {
    const sellerId = req.user.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Orders
    const totalOrders = await SellerOrder.countDocuments({ seller: sellerId });
    const todayOrders = await SellerOrder.countDocuments({ seller: sellerId, orderDate: { $gte: today } });

    // Shipments
    const totalShipments = await SellerShipment.countDocuments({ seller: sellerId });
    const todayShipments = await SellerShipment.countDocuments({ seller: sellerId, createdAt: { $gte: today } });

    // Delivered
    const totalDelivered = await SellerShipment.countDocuments({ seller: sellerId, status: 'Delivered' });
    const todayDelivered = await SellerShipment.countDocuments({ seller: sellerId, status: 'Delivered', deliveryDate: { $gte: today } });

    // COD
    const codOrders = await SellerOrder.find({ seller: sellerId, 'payment.method': 'COD' });
    const codExpected = codOrders.reduce((sum, o) => sum + (parseFloat(o.payment.amount) || 0), 0);
    const codDue = codOrders.filter(o => o.status !== 'Delivered').reduce((sum, o) => sum + (parseFloat(o.payment.amount) || 0), 0);

    // Revenue
    const prepaidOrders = await SellerOrder.find({ seller: sellerId, 'payment.method': 'Prepaid' });
    const totalRevenue = prepaidOrders.reduce((sum, o) => sum + (parseFloat(o.payment.amount) || 0), 0);
    // For demo, dailyGrowth is random
    const dailyGrowth = Math.round(Math.random() * 1000);

    // NDR (Non-Delivery Report)
    const ndrPending = await SellerShipment.countDocuments({ seller: sellerId, status: 'Exception' });

    // Chart Data
    const orderStatusAgg = await SellerOrder.aggregate([
      { $match: { seller: sellerId } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    const orderStatusDistribution = orderStatusAgg.reduce((acc, cur) => {
      acc[cur._id] = cur.count;
      return acc;
    }, {});

    // Revenue Trend (last 7 days)
    const revenueTrend = [];
    for (let i = 6; i >= 0; i--) {
      const day = new Date();
      day.setDate(day.getDate() - i);
      day.setHours(0, 0, 0, 0);
      const nextDay = new Date(day);
      nextDay.setDate(day.getDate() + 1);
      const dayOrders = await SellerOrder.find({ seller: sellerId, orderDate: { $gte: day, $lt: nextDay }, 'payment.method': 'Prepaid' });
      const value = dayOrders.reduce((sum, o) => sum + (parseFloat(o.payment.amount) || 0), 0);
      revenueTrend.push({ date: day.toISOString().slice(0, 10), value });
    }

    // Monthly Comparison (current vs previous month)
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    const monthStart = new Date(currentYear, currentMonth, 1);
    const prevMonthStart = new Date(prevYear, prevMonth, 1);
    const prevMonthEnd = new Date(currentYear, currentMonth, 0);
    const currentMonthOrders = await SellerOrder.find({ seller: sellerId, orderDate: { $gte: monthStart } });
    const prevMonthOrders = await SellerOrder.find({ seller: sellerId, orderDate: { $gte: prevMonthStart, $lt: prevMonthEnd } });
    const monthlyComparison = [
      {
        month: monthStart.toLocaleString('default', { month: 'short', year: 'numeric' }),
        current: currentMonthOrders.length,
        previous: prevMonthOrders.length
      }
    ];

    // Top Products
    const topProductsAgg = await SellerOrder.aggregate([
      { $match: { seller: sellerId } },
      { $group: {
        _id: '$product.sku',
        name: { $first: '$product.name' },
        quantity: { $sum: '$product.quantity' },
        revenue: { $sum: { $toDouble: '$payment.amount' } }
      } },
      { $sort: { quantity: -1 } },
      { $limit: 5 }
    ]);
    const topProducts = topProductsAgg.map(p => ({
      id: p._id,
      name: p.name,
      quantity: p.quantity,
      revenue: p.revenue
    }));

    res.status(200).json({
      success: true,
      data: {
        stats: {
          orders: { total: totalOrders, todayCount: todayOrders },
          shipments: { total: totalShipments, todayCount: todayShipments },
          delivery: { total: totalDelivered, todayCount: todayDelivered },
          cod: { expected: codExpected, totalDue: codDue },
          revenue: { total: totalRevenue, dailyGrowth },
          ndr: { pending: ndrPending }
        },
        chartData: {
          orderStatusDistribution,
          revenueTrend,
          monthlyComparison
        },
        topProducts
      }
    });
  } catch (error) {
    next(new AppError(error.message, 400));
  }
}; 