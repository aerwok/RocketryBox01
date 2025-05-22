import { logger } from './logger.js';
import { createClient } from 'redis';

// In-memory store for fallback mode
const memoryStore = new Map();
const expiryTimes = new Map();

// Redis connection details from environment variables
const REDIS_HOST = process.env.REDIS_HOST || 'redis-13884.c305.ap-south-1-1.ec2.redns.redis-cloud.com';
const REDIS_PORT = process.env.REDIS_PORT || '13884';
const REDIS_USERNAME = process.env.REDIS_USERNAME || 'default';
const REDIS_PASSWORD = process.env.REDIS_PASSWORD || 'GUP1RJOkJVgAhu7ydayYSo9OCwfcrYIZ';

// Construct Redis URL
const REDIS_URL = `redis://${REDIS_USERNAME}:${REDIS_PASSWORD}@${REDIS_HOST}:${REDIS_PORT}`;

// Fallback mode flag
let usingFallbackMode = false;

// Setup fallback mode
function setupFallbackMode() {
  if (usingFallbackMode) return;
  
  usingFallbackMode = true;
  logger.warn('Switching to fallback in-memory implementation');
  
  // Set up cleanup interval for in-memory store
  setInterval(() => {
    try {
      const now = Date.now();
      let expiredCount = 0;
      for (const [key, expiry] of expiryTimes.entries()) {
        if (now > expiry) {
          memoryStore.delete(key);
          expiryTimes.delete(key);
          expiredCount++;
        }
      }
      if (expiredCount > 0) {
        logger.debug(`[FALLBACK] Cleaned up ${expiredCount} expired keys`);
      }
    } catch (error) {
      logger.error(`[FALLBACK] Cleanup error: ${error.message}`);
    }
  }, 30000); // Run cleanup every 30 seconds
}

// Create a dummy Redis client for fallback mode
const dummyRedisClient = {
  isOpen: false,
  connect: async () => { return; },
  get: async () => null,
  set: async () => null,
  setEx: async () => null,
  del: async () => null,
  keys: async () => [],
  incr: async () => 1,
  expire: async () => true,
  on: () => dummyRedisClient // For method chaining
};

// Create Redis client or use dummy
let redisClient;

try {
  logger.info(`Creating Redis client with URL: ${REDIS_URL}`);
  redisClient = createClient({
    url: REDIS_URL,
    socket: {
      reconnectStrategy: (retries) => {
        if (retries > 5) {
          logger.warn(`Failed to connect to Redis after ${retries} attempts, falling back to mock implementation`);
          setupFallbackMode();
          return false; // stop retrying
        }
        const delay = Math.min(retries * 500, 5000); // Wait max 5 seconds between retries
        logger.debug(`Redis reconnect attempt ${retries} in ${delay}ms`);
        return delay;
      },
      connectTimeout: 10000 // 10 seconds timeout for connection
    }
  });
  
  // Handle Redis events
  redisClient.on('error', (err) => {
    logger.error('Redis Client Error:', err.message);
    setupFallbackMode();
  });
  
  redisClient.on('connect', () => logger.info('Redis Client Connected'));
  redisClient.on('ready', () => {
    logger.info('Redis Client Ready');
    usingFallbackMode = false; // Reset fallback mode if connection successful
  });
  redisClient.on('reconnecting', () => logger.info('Redis Client Reconnecting'));
  redisClient.on('end', () => {
    logger.info('Redis Client Connection Ended');
    setupFallbackMode();
  });

  // Try to connect
  redisClient.connect().catch((err) => {
    logger.error('Failed to connect to Redis:', err.message);
    setupFallbackMode();
  });
} catch (error) {
  logger.error('Error creating Redis client:', error.message);
  setupFallbackMode();
  redisClient = dummyRedisClient;
}

// Helper function to check if we should use Redis
const useRedis = async () => {
  if (usingFallbackMode) return false;
  try {
    return redisClient?.isOpen || false;
  } catch (error) {
    logger.error('Error checking Redis connection:', error.message);
    setupFallbackMode();
    return false;
  }
};

// Export Redis health check with more details
export const isRedisHealthy = () => {
  const status = {
    connected: redisClient.isOpen && !usingFallbackMode,
    useFallbackMode: usingFallbackMode,
    clientOpen: redisClient.isOpen,
    memoryStoreSize: memoryStore.size,
    expiryTimesSize: expiryTimes.size
  };
  
  logger.debug(`Redis health status: ${JSON.stringify(status)}`);
  return status;
};

// Add a periodic health check to monitor Redis status
export const startRedisMonitoring = (intervalMs = 60000) => {
  logger.info(`Starting Redis monitoring with ${intervalMs}ms interval`);
  
  const monitoringInterval = setInterval(() => {
    const status = isRedisHealthy();
    
    if (!status.connected) {
      logger.warn(`Redis is disconnected, fallback mode: ${status.useFallbackMode}, memory items: ${status.memoryStoreSize}`);
      
      // Try to reconnect if client is closed and not in fallback mode
      if (!redisClient.isOpen && !usingFallbackMode) {
        logger.info('Attempting to reconnect to Redis...');
        try {
          redisClient.connect().catch(err => {
            logger.error(`Redis reconnection failed: ${err.message}`);
          });
        } catch (error) {
          logger.error(`Error during Redis reconnection attempt: ${error.message}`);
        }
      }
    } else {
      logger.debug('Redis connection is healthy');
    }
  }, intervalMs);
  
  // Clean up monitoring on process exit
  process.on('SIGTERM', () => clearInterval(monitoringInterval));
  process.on('SIGINT', () => clearInterval(monitoringInterval));
  
  return monitoringInterval;
};

// Auto-start monitoring with a 1-minute interval
startRedisMonitoring();

// Session Management
export const setSession = async (userId, sessionData, expiryInSeconds = 3600) => {
  try {
    const key = `session:${userId}`;
    const value = JSON.stringify(sessionData);
    
    if (await useRedis()) {
      await redisClient.setEx(key, expiryInSeconds, value);
    } else {
      memoryStore.set(key, value);
      expiryTimes.set(key, Date.now() + (expiryInSeconds * 1000));
    }
    
    return true;
  } catch (error) {
    logger.error('Redis Set Session Error:', error.message);
    // Fallback
    try {
      const key = `session:${userId}`;
      const value = JSON.stringify(sessionData);
      memoryStore.set(key, value);
      expiryTimes.set(key, Date.now() + (expiryInSeconds * 1000));
      return true;
    } catch (fallbackError) {
      logger.error('Fallback Set Session Error:', fallbackError.message);
      return false;
    }
  }
};

export const getSession = async (userId) => {
  try {
    const key = `session:${userId}`;
    
    let data = null;
    if (await useRedis()) {
      data = await redisClient.get(key);
    } else {
      const expiry = expiryTimes.get(key);
      if (expiry && Date.now() > expiry) {
        memoryStore.delete(key);
        expiryTimes.delete(key);
      } else {
        data = memoryStore.get(key);
      }
    }
    
    return data ? JSON.parse(data) : null;
  } catch (error) {
    logger.error('Redis Get Session Error:', error.message);
    // Fallback
    try {
      const key = `session:${userId}`;
      const expiry = expiryTimes.get(key);
      if (expiry && Date.now() > expiry) {
        memoryStore.delete(key);
        expiryTimes.delete(key);
        return null;
      }
      const data = memoryStore.get(key);
      return data ? JSON.parse(data) : null;
    } catch (fallbackError) {
      logger.error('Fallback Get Session Error:', fallbackError.message);
      return null;
    }
  }
};

export const deleteSession = async (userId) => {
  try {
    const key = `session:${userId}`;
    
    if (await useRedis()) {
      await redisClient.del(key);
    } else {
      memoryStore.delete(key);
      expiryTimes.delete(key);
    }
    
    return true;
  } catch (error) {
    logger.error('Redis Delete Session Error:', error.message);
    // Fallback
    try {
      const key = `session:${userId}`;
      memoryStore.delete(key);
      expiryTimes.delete(key);
      return true;
    } catch (fallbackError) {
      logger.error('Fallback Delete Session Error:', fallbackError.message);
      return false;
    }
  }
};

// OTP Management
export const setOTP = async (userId, otp, expiryInSeconds = 300) => {
  try {
    const key = `otp:${userId}`;
    const data = {
      code: otp,
      attempts: 0,
      createdAt: Date.now()
    };
    const value = JSON.stringify(data);
    
    if (await useRedis()) {
      await redisClient.setEx(key, expiryInSeconds, value);
    } else {
      memoryStore.set(key, value);
      expiryTimes.set(key, Date.now() + (expiryInSeconds * 1000));
    }
    
    return true;
  } catch (error) {
    logger.error('Redis Set OTP Error:', error.message);
    // Fallback
    try {
      const key = `otp:${userId}`;
      const data = {
        code: otp,
        attempts: 0,
        createdAt: Date.now()
      };
      const value = JSON.stringify(data);
      memoryStore.set(key, value);
      expiryTimes.set(key, Date.now() + (expiryInSeconds * 1000));
      return true;
    } catch (fallbackError) {
      logger.error('Fallback Set OTP Error:', fallbackError.message);
      return false;
    }
  }
};

export const getOTP = async (userId) => {
  try {
    const key = `otp:${userId}`;
    
    let data = null;
    if (await useRedis()) {
      data = await redisClient.get(key);
    } else {
      const expiry = expiryTimes.get(key);
      if (expiry && Date.now() > expiry) {
        memoryStore.delete(key);
        expiryTimes.delete(key);
      } else {
        data = memoryStore.get(key);
      }
    }
    
    return data ? JSON.parse(data) : null;
  } catch (error) {
    logger.error('Redis Get OTP Error:', error.message);
    // Fallback
    try {
      const key = `otp:${userId}`;
      const expiry = expiryTimes.get(key);
      if (expiry && Date.now() > expiry) {
        memoryStore.delete(key);
        expiryTimes.delete(key);
        return null;
      }
      const data = memoryStore.get(key);
      return data ? JSON.parse(data) : null;
    } catch (fallbackError) {
      logger.error('Fallback Get OTP Error:', fallbackError.message);
      return null;
    }
  }
};

export const verifyOTP = async (userId, inputOTP) => {
  try {
    const key = `otp:${userId}`;
    
    let data = null;
    if (await useRedis()) {
      data = await redisClient.get(key);
    } else {
      const expiry = expiryTimes.get(key);
      if (expiry && Date.now() > expiry) {
        memoryStore.delete(key);
        expiryTimes.delete(key);
      } else {
        data = memoryStore.get(key);
      }
    }
    
    if (!data) return { valid: false, message: 'OTP expired or not found' };

    const otpData = JSON.parse(data);
    
    // Check attempts
    const maxAttempts = 3;
    if (otpData.attempts >= maxAttempts) {
      if (await useRedis()) {
        await redisClient.del(key);
      } else {
        memoryStore.delete(key);
        expiryTimes.delete(key);
      }
      return { valid: false, message: 'Maximum attempts exceeded' };
    }

    // Update attempts
    otpData.attempts += 1;
    const value = JSON.stringify(otpData);
    
    if (await useRedis()) {
      await redisClient.setEx(key, 300, value);
    } else {
      memoryStore.set(key, value);
      expiryTimes.set(key, Date.now() + (300 * 1000));
    }

    // Verify OTP
    if (otpData.code !== inputOTP) {
      return { 
        valid: false, 
        message: 'Invalid OTP',
        remainingAttempts: maxAttempts - otpData.attempts 
      };
    }

    // OTP verified, clean up
    if (await useRedis()) {
      await redisClient.del(key);
    } else {
      memoryStore.delete(key);
      expiryTimes.delete(key);
    }
    
    return { valid: true, message: 'OTP verified successfully' };
  } catch (error) {
    logger.error('Redis Verify OTP Error:', error.message);
    return { valid: false, message: 'Error verifying OTP' };
  }
};

// Rate Limiting
export const checkRateLimit = async (key, limit, windowInSeconds) => {
  try {
    let current = 1;
    
    if (await useRedis()) {
      current = await redisClient.incr(key);
      if (current === 1) {
        await redisClient.expire(key, windowInSeconds);
      }
    } else {
      const currentValue = parseInt(memoryStore.get(key) || '0', 10);
      current = currentValue + 1;
      memoryStore.set(key, current.toString());
      if (current === 1) {
        expiryTimes.set(key, Date.now() + (windowInSeconds * 1000));
      }
    }

    return {
      current,
      isAllowed: current <= limit,
      remainingAttempts: Math.max(0, limit - current)
    };
  } catch (error) {
    logger.error('Redis Rate Limit Error:', error.message);
    return { 
      current: 1, 
      isAllowed: true, 
      remainingAttempts: limit - 1 
    }; // Fail open for rate limiting
  }
};

// Cache Management
export const setCache = async (key, data, expiryInSeconds = 3600) => {
  try {
    if (!key) {
      // Add stack trace to identify the caller
      const stack = new Error().stack;
      logger.error(`Redis Set Cache Error: Key cannot be null or undefined. Stack trace: ${stack}`);
      return false;
    }
    
    // Add debug logging to see what key is being set
    logger.debug(`Setting cache with key: ${key}`);
    
    // Make sure data is not undefined
    const safeData = data === undefined ? null : data;
    const value = JSON.stringify(safeData);
    
    if (await useRedis()) {
      await redisClient.setEx(key, expiryInSeconds, value);
    } else {
      memoryStore.set(key, value);
      expiryTimes.set(key, Date.now() + (expiryInSeconds * 1000));
    }
    
    return true;
  } catch (error) {
    logger.error('Redis Set Cache Error:', error.message);
    // Fallback
    try {
      const safeData = data === undefined ? null : data;
      const value = JSON.stringify(safeData);
      memoryStore.set(key, value);
      expiryTimes.set(key, Date.now() + (expiryInSeconds * 1000));
      return true;
    } catch (fallbackError) {
      logger.error('Fallback Set Cache Error:', fallbackError.message);
      return false;
    }
  }
};

export const getCache = async (key) => {
  try {
    if (!key) {
      // Add stack trace to identify the caller
      const stack = new Error().stack;
      logger.error(`Redis Get Cache Error: Key cannot be null or undefined. Stack trace: ${stack}`);
      return null;
    }
    
    // Add debug logging to see what key is being requested
    logger.debug(`Getting cache with key: ${key}`);
    
    let data = null;
    if (await useRedis()) {
      data = await redisClient.get(key);
    } else {
      const expiry = expiryTimes.get(key);
      if (expiry && Date.now() > expiry) {
        memoryStore.delete(key);
        expiryTimes.delete(key);
      } else {
        data = memoryStore.get(key);
      }
    }
    
    if (!data) return null;
    
    try {
      return JSON.parse(data);
    } catch (parseError) {
      logger.error(`Redis Parse Error for key ${key}:`, parseError.message);
      return null;
    }
  } catch (error) {
    logger.error(`Redis Get Cache Error for key ${key}:`, error.message);
    // Fallback
    try {
      if (!key) return null;
      
      const expiry = expiryTimes.get(key);
      if (expiry && Date.now() > expiry) {
        memoryStore.delete(key);
        expiryTimes.delete(key);
        return null;
      }
      const data = memoryStore.get(key);
      if (!data) return null;
      
      try {
        return JSON.parse(data);
      } catch (parseError) {
        logger.error(`Fallback Parse Error for key ${key}:`, parseError.message);
        return null;
      }
    } catch (fallbackError) {
      logger.error(`Fallback Get Cache Error for key ${key}:`, fallbackError.message);
      return null;
    }
  }
};

export const deleteCache = async (key) => {
  try {
    if (!key) {
      logger.error('Redis Delete Cache Error: Key cannot be null or undefined');
      return false;
    }
    
    if (await useRedis()) {
      await redisClient.del(key);
    } else {
      memoryStore.delete(key);
      expiryTimes.delete(key);
    }
    
    return true;
  } catch (error) {
    logger.error(`Redis Delete Cache Error for key ${key}:`, error.message);
    // Fallback
    try {
      if (!key) return false;
      
      memoryStore.delete(key);
      expiryTimes.delete(key);
      return true;
    } catch (fallbackError) {
      logger.error(`Fallback Delete Cache Error for key ${key}:`, fallbackError.message);
      return false;
    }
  }
};

export const getAllSessions = async () => {
  try {
    let keys = [];
    if (await useRedis()) {
      keys = await redisClient.keys('session:*');
    } else {
      for (const key of memoryStore.keys()) {
        if (key.startsWith('session:')) {
          const expiry = expiryTimes.get(key);
          if (!expiry || Date.now() <= expiry) {
            keys.push(key);
          }
        }
      }
    }
    
    if (!keys || keys.length === 0) return [];
    
    const sessions = [];
    for (const key of keys) {
      let data = null;
      if (await useRedis()) {
        data = await redisClient.get(key);
      } else {
        const expiry = expiryTimes.get(key);
        if (expiry && Date.now() > expiry) {
          memoryStore.delete(key);
          expiryTimes.delete(key);
        } else {
          data = memoryStore.get(key);
        }
      }
      
      if (data) {
        const userId = key.split(':')[1];
        sessions.push({
          userId,
          data: JSON.parse(data)
        });
      }
    }
    
    return sessions;
  } catch (error) {
    logger.error('Redis Get All Sessions Error:', error.message);
    // Fallback
    try {
      const sessions = [];
      for (const key of memoryStore.keys()) {
        if (key.startsWith('session:')) {
          const expiry = expiryTimes.get(key);
          if (!expiry || Date.now() <= expiry) {
            const data = memoryStore.get(key);
            const userId = key.split(':')[1];
            sessions.push({
              userId,
              data: JSON.parse(data)
            });
          }
        }
      }
      return sessions;
    } catch (fallbackError) {
      logger.error('Fallback Get All Sessions Error:', fallbackError.message);
      return [];
    }
  }
};

export const storeOTP = async (phone, otp, expiryInSeconds = 300) => {
  try {
    const key = `phone_otp:${phone}`;
    const data = {
      code: otp,
      attempts: 0,
      createdAt: Date.now()
    };
    const value = JSON.stringify(data);
    
    if (await useRedis()) {
      await redisClient.setEx(key, expiryInSeconds, value);
    } else {
      memoryStore.set(key, value);
      expiryTimes.set(key, Date.now() + (expiryInSeconds * 1000));
    }
    
    return true;
  } catch (error) {
    logger.error('Redis Store Phone OTP Error:', error.message);
    // Fallback
    try {
      const key = `phone_otp:${phone}`;
      const data = {
        code: otp,
        attempts: 0,
        createdAt: Date.now()
      };
      memoryStore.set(key, JSON.stringify(data));
      expiryTimes.set(key, Date.now() + (expiryInSeconds * 1000));
      return true;
    } catch (fallbackError) {
      logger.error('Fallback Store Phone OTP Error:', fallbackError.message);
      return false;
    }
  }
};

// For compatibility with code that expects the redis client directly
export default redisClient; 