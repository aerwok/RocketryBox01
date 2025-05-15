import { emitAdminDashboardUpdate } from '../../../utils/socketio.js';
import { logger } from '../../../utils/logger.js';
import Seller from '../../seller/models/seller.model.js';
import Customer from '../../customer/models/customer.model.js';
import Order from '../../seller/models/order.model.js';
import { 
  getCache, 
  setCache, 
  CACHE_KEYS,
  invalidateCachePattern,
  CACHE_PATTERNS
} from '../../../utils/cache.js';

// Constants
const CACHE_TTL = 60; // 60 seconds cache TTL
const SECTION_CACHE_TTL = 30; // 30 seconds for section data

/**
 * Get users statistics with caching
 * @returns {Promise<Object>} User statistics
 */
export const getUsersStats = async () => {
  try {
    // Try to get from cache first
    const cachedData = await getCache(CACHE_KEYS.DASHBOARD_USERS);
    if (cachedData) {
      return cachedData;
    }

    // Get today's date for filtering
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Optimized query using MongoDB aggregation instead of multiple queries
    const [sellerStats, customerStats] = await Promise.all([
      Seller.aggregate([
        {
          $facet: {
            // Total count
            total: [{ $count: 'count' }],
            // New today count
            newToday: [
              { $match: { createdAt: { $gte: today } } },
              { $count: 'count' }
            ],
            // Active recently count
            active: [
              { $match: { lastActive: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } } },
              { $count: 'count' }
            ]
          }
        }
      ]),
      Customer.aggregate([
        {
          $facet: {
            // Total count
            total: [{ $count: 'count' }],
            // New today count
            newToday: [
              { $match: { createdAt: { $gte: today } } },
              { $count: 'count' }
            ],
            // Active recently count
            active: [
              { $match: { lastActive: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } } },
              { $count: 'count' }
            ]
          }
        }
      ])
    ]);

    // Extract counts from aggregation results
    const totalSellers = sellerStats[0].total[0]?.count || 0;
    const newTodaySellers = sellerStats[0].newToday[0]?.count || 0;
    const activeSellers = sellerStats[0].active[0]?.count || 0;
    
    const totalCustomers = customerStats[0].total[0]?.count || 0;
    const newTodayCustomers = customerStats[0].newToday[0]?.count || 0;
    const activeCustomers = customerStats[0].active[0]?.count || 0;

    // Assemble user stats
    const usersData = {
      total: totalSellers + totalCustomers,
      sellers: totalSellers,
      customers: totalCustomers,
      newToday: newTodaySellers + newTodayCustomers,
      activeSellers,
      activeCustomers
    };
    
    // Cache the result
    await setCache(CACHE_KEYS.DASHBOARD_USERS, usersData, SECTION_CACHE_TTL);
    
    return usersData;
  } catch (error) {
    logger.error(`Error getting user stats: ${error.message}`);
    throw error;
  }
};

/**
 * Get orders statistics with caching
 * @returns {Promise<Object>} Order statistics
 */
export const getOrdersStats = async () => {
  try {
    // Try to get from cache first
    const cachedData = await getCache(CACHE_KEYS.DASHBOARD_ORDERS);
    if (cachedData) {
      return cachedData;
    }

    // Get today's date for filtering
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Optimized query using MongoDB aggregation
    const orderStats = await Order.aggregate([
      {
        $facet: {
          // Today's orders count
          todayCount: [
            { $match: { createdAt: { $gte: today } } },
            { $count: 'count' }
          ],
          // Pending orders count
          pending: [
            { $match: { status: 'Pending' } },
            { $count: 'count' }
          ],
          // Recent orders
          recent: [
            { $sort: { createdAt: -1 } },
            { $limit: 5 },
            { 
              $lookup: {
                from: 'customers',
                localField: 'customer',
                foreignField: '_id',
                as: 'customerInfo'
              }
            },
            {
              $lookup: {
                from: 'sellers',
                localField: 'seller',
                foreignField: '_id',
                as: 'sellerInfo'
              }
            },
            {
              $project: {
                _id: 1,
                orderNumber: 1,
                totalAmount: 1,
                status: 1,
                createdAt: 1,
                customer: { $arrayElemAt: ['$customerInfo.name', 0] },
                customerEmail: { $arrayElemAt: ['$customerInfo.email', 0] },
                seller: { $arrayElemAt: ['$sellerInfo.businessName', 0] },
                sellerEmail: { $arrayElemAt: ['$sellerInfo.email', 0] }
              }
            }
          ]
        }
      }
    ]);
    
    // Extract data from aggregation results
    const ordersData = {
      todayCount: orderStats[0].todayCount[0]?.count || 0,
      pending: orderStats[0].pending[0]?.count || 0,
      recent: orderStats[0].recent || []
    };
    
    // Cache the result
    await setCache(CACHE_KEYS.DASHBOARD_ORDERS, ordersData, SECTION_CACHE_TTL);
    
    return ordersData;
  } catch (error) {
    logger.error(`Error getting order stats: ${error.message}`);
    throw error;
  }
};

/**
 * Get revenue statistics with caching
 * @returns {Promise<Object>} Revenue statistics
 */
export const getRevenueStats = async () => {
  try {
    // Try to get from cache first
    const cachedData = await getCache(CACHE_KEYS.DASHBOARD_REVENUE);
    if (cachedData) {
      return cachedData;
    }

    // Get today's date for filtering
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Get today's revenue with a single aggregation
    const revenueStats = await Order.aggregate([
      {
        $match: { 
          status: { $ne: 'Cancelled' },
          createdAt: { $gte: today }
        }
      },
      {
        $group: {
          _id: null,
          today: { $sum: '$totalAmount' }
        }
      }
    ]);
    
    const revenueData = {
      today: revenueStats.length > 0 ? revenueStats[0].today : 0
    };
    
    // Cache the result
    await setCache(CACHE_KEYS.DASHBOARD_REVENUE, revenueData, SECTION_CACHE_TTL);
    
    return revenueData;
  } catch (error) {
    logger.error(`Error getting revenue stats: ${error.message}`);
    throw error;
  }
};

/**
 * Get top selling products with caching
 * @returns {Promise<Object>} Product statistics
 */
export const getProductStats = async () => {
  try {
    // Try to get from cache first
    const cachedData = await getCache(CACHE_KEYS.DASHBOARD_PRODUCTS);
    if (cachedData) {
      return cachedData;
    }

    // Get today's date for filtering
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Get top selling products
    const topSellingProducts = await Order.aggregate([
      { $match: { createdAt: { $gte: today } } },
      { $unwind: '$items' },
      { 
        $group: { 
          _id: '$items.productId',
          productName: { $first: '$items.productName' },
          totalQuantity: { $sum: '$items.quantity' },
          totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
        } 
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: 5 }
    ]);
    
    const productsData = {
      topSelling: topSellingProducts || []
    };
    
    // Cache the result
    await setCache(CACHE_KEYS.DASHBOARD_PRODUCTS, productsData, SECTION_CACHE_TTL);
    
    return productsData;
  } catch (error) {
    logger.error(`Error getting product stats: ${error.message}`);
    throw error;
  }
};

/**
 * Get recent customer activities with caching
 * @returns {Promise<Object>} Activity statistics
 */
export const getActivityStats = async () => {
  try {
    // Try to get from cache first
    const cachedData = await getCache(CACHE_KEYS.DASHBOARD_ACTIVITIES);
    if (cachedData) {
      return cachedData;
    }
    
    // Recent customer activities with paging (for better performance)
    const recentCustomerActivities = await Customer.aggregate([
      { $match: { lastActive: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } } },
      { $project: { 
          name: 1, 
          email: 1, 
          lastActive: 1,
          activity: 1
        } 
      },
      { $sort: { lastActive: -1 } },
      { $limit: 10 }
    ]);
    
    const activitiesData = {
      recentCustomer: recentCustomerActivities || []
    };
    
    // Cache the result
    await setCache(CACHE_KEYS.DASHBOARD_ACTIVITIES, activitiesData, SECTION_CACHE_TTL);
    
    return activitiesData;
  } catch (error) {
    logger.error(`Error getting activity stats: ${error.message}`);
    throw error;
  }
};

/**
 * Get real-time dashboard data with modular sections and caching
 * @returns {Object} Dashboard data
 */
export const getRealtimeDashboardData = async () => {
  try {
    // Try to get complete dashboard data from cache first
    const cachedDashboard = await getCache(CACHE_KEYS.DASHBOARD_REALTIME);
    if (cachedDashboard) {
      return cachedDashboard;
    }
    
    // Fetch all sections in parallel for better performance
    const [users, orders, revenue, products, activities] = await Promise.all([
      getUsersStats(),
      getOrdersStats(),
      getRevenueStats(),
      getProductStats(),
      getActivityStats()
    ]);
    
    // Assemble complete dashboard data
    const dashboardData = {
      users,
      orders,
      revenue,
      products,
      activities,
      timestamp: new Date()
    };
    
    // Cache the complete dashboard data
    await setCache(CACHE_KEYS.DASHBOARD_REALTIME, dashboardData, CACHE_TTL);
    
    return dashboardData;
  } catch (error) {
    logger.error(`Error in getRealtimeDashboardData: ${error.message}`);
    throw error;
  }
};

/**
 * Update a specific section of the dashboard
 * @param {string} section - Section to update (users, orders, etc.)
 * @returns {Promise<Object>} Updated section data
 */
export const updateDashboardSection = async (section) => {
  try {
    let sectionData;
    
    // Update specific section based on the event type
    switch (section) {
      case 'users':
        sectionData = await getUsersStats();
        break;
      case 'orders':
        sectionData = await getOrdersStats();
        break;
      case 'revenue':
        sectionData = await getRevenueStats();
        break;
      case 'products':
        sectionData = await getProductStats();
        break;
      case 'activities':
        sectionData = await getActivityStats();
        break;
      default:
        // If section not specified, update complete dashboard
        return await getRealtimeDashboardData();
    }
    
    // Invalidate section cache
    await invalidateCachePattern(CACHE_PATTERNS[section.toUpperCase()]);
    
    // Return updated section
    return { [section]: sectionData, timestamp: new Date() };
  } catch (error) {
    logger.error(`Error updating dashboard section ${section}: ${error.message}`);
    throw error;
  }
};

/**
 * Broadcast specific dashboard section update
 * @param {string} section - Section to update (users, orders, etc.)
 */
export const broadcastDashboardSectionUpdate = async (section) => {
  try {
    const sectionData = await updateDashboardSection(section);
    emitAdminDashboardUpdate('dashboard-section-update', sectionData);
  } catch (error) {
    logger.error(`Error in broadcastDashboardSectionUpdate: ${error.message}`);
  }
};

/**
 * Broadcast complete dashboard updates to connected clients
 */
export const broadcastDashboardUpdates = async () => {
  try {
    const dashboardData = await getRealtimeDashboardData();
    emitAdminDashboardUpdate('dashboard-update', dashboardData);
  } catch (error) {
    logger.error(`Error in broadcastDashboardUpdates: ${error.message}`);
  }
}; 