import Redis from 'ioredis';
import { logger } from './logger.js';

// Initialize Redis client with connection options
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
});

redis.on('connect', () => {
  logger.info('Redis cache connected');
});

redis.on('error', (err) => {
  logger.error(`Redis error: ${err.message}`);
});

// Cache key constants
export const CACHE_KEYS = {
  // Admin dashboard cache keys
  DASHBOARD_USERS: 'dashboard:users',
  DASHBOARD_ORDERS: 'dashboard:orders',
  DASHBOARD_REVENUE: 'dashboard:revenue',
  DASHBOARD_PRODUCTS: 'dashboard:products',
  DASHBOARD_ACTIVITIES: 'dashboard:activities',
  
  // Customer section cache keys
  CUSTOMER_PROFILE: (id) => `customer:${id}:profile`,
  CUSTOMER_ORDERS: (id) => `customer:${id}:orders`,
  CUSTOMER_RECENT_ORDERS: (id) => `customer:${id}:recent-orders`,
  CUSTOMER_ADDRESS_BOOK: (id) => `customer:${id}:addresses`,
  CUSTOMER_NOTIFICATIONS: (id) => `customer:${id}:notifications`,
  
  // Seller section cache keys
  SELLER_PROFILE: (id) => `seller:${id}:profile`,
  SELLER_ORDERS: (id) => `seller:${id}:orders`,
  SELLER_DASHBOARD: (id) => `seller:${id}:dashboard`,
  SELLER_PRODUCTS: (id) => `seller:${id}:products`,
  SELLER_INVENTORY: (id) => `seller:${id}:inventory`,
  SELLER_RATE_CARD: (id) => `seller:${id}:rate-card`,
  SELLER_SHIPPING_STATS: (id) => `seller:${id}:shipping-stats`,
  
  // Section-specific listing cache keys
  CUSTOMER_LIST: 'customers:list',
  SELLER_LIST: 'sellers:list',
  PRODUCT_LIST: 'products:list',
  ORDER_LIST: 'orders:list',
  
  // Miscellaneous cache keys
  PINCODE_DATA: (pincode) => `pincode:${pincode}`,
  COURIER_RATES: 'courier:rates',
  TRACKING_DATA: (awb) => `tracking:${awb}`
};

// Cache invalidation patterns
export const CACHE_PATTERNS = {
  ALL_DASHBOARD: 'dashboard:*',
  ALL_CUSTOMERS: 'customer:*',
  SPECIFIC_CUSTOMER: (id) => `customer:${id}:*`,
  ALL_SELLERS: 'seller:*',
  SPECIFIC_SELLER: (id) => `seller:${id}:*`,
  ALL_PRODUCTS: 'products:*',
  ALL_ORDERS: 'orders:*'
};

// Default TTL values (in seconds)
export const CACHE_TTL = {
  DASHBOARD: 60, // 1 minute for dashboard data
  PROFILE: 300, // 5 minutes for profile data
  LIST: 120, // 2 minutes for list data
  ORDERS: 180, // 3 minutes for order data
  PRODUCTS: 240, // 4 minutes for product data
  PINCODE: 86400, // 24 hours for pincode data
  RATES: 43200 // 12 hours for rate data
};

/**
 * Get cached data with key
 * @param {string} key - Cache key
 * @returns {Promise<any>} Cached data or null
 */
export const getCache = async (key) => {
  try {
    const cachedData = await redis.get(key);
    if (cachedData) {
      return JSON.parse(cachedData);
    }
    return null;
  } catch (error) {
    logger.error(`Cache get error: ${error.message}`);
    return null;
  }
};

/**
 * Set data in cache with TTL
 * @param {string} key - Cache key
 * @param {any} data - Data to cache
 * @param {number} ttl - Time to live in seconds (default 60)
 */
export const setCache = async (key, data, ttl = 60) => {
  try {
    await redis.set(key, JSON.stringify(data), 'EX', ttl);
  } catch (error) {
    logger.error(`Cache set error: ${error.message}`);
  }
};

/**
 * Delete cached data with key
 * @param {string} key - Cache key
 */
export const deleteCache = async (key) => {
  try {
    await redis.del(key);
  } catch (error) {
    logger.error(`Cache delete error: ${error.message}`);
  }
};

/**
 * Invalidate cache by pattern
 * @param {string} pattern - Key pattern to invalidate
 */
export const invalidateCachePattern = async (pattern) => {
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(keys);
      logger.debug(`Invalidated ${keys.length} cache keys matching pattern: ${pattern}`);
    }
  } catch (error) {
    logger.error(`Cache invalidation error: ${error.message}`);
  }
};

/**
 * Update cached object field without invalidating entire object
 * @param {string} key - Cache key
 * @param {string} field - Field path (e.g., 'user.name')
 * @param {any} value - New value
 * @param {number} ttl - Time to live in seconds (default: keep existing TTL)
 */
export const updateCacheField = async (key, field, value, ttl = null) => {
  try {
    const cachedData = await getCache(key);
    if (!cachedData) return false;
    
    // Update nested field using path notation
    const fieldPath = field.split('.');
    let current = cachedData;
    
    for (let i = 0; i < fieldPath.length - 1; i++) {
      if (!current[fieldPath[i]]) {
        current[fieldPath[i]] = {};
      }
      current = current[fieldPath[i]];
    }
    
    current[fieldPath[fieldPath.length - 1]] = value;
    
    // Get remaining TTL if not specified
    if (ttl === null) {
      ttl = await redis.ttl(key);
      if (ttl < 0) ttl = CACHE_TTL.PROFILE; // Default if no TTL
    }
    
    await setCache(key, cachedData, ttl);
    return true;
  } catch (error) {
    logger.error(`Cache field update error: ${error.message}`);
    return false;
  }
};

export default redis; 