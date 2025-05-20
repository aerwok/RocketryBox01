import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { createServer } from 'http';
import { errorHandler } from './middleware/errorHandler.js';
import { logger } from './utils/logger.js';
import { initSocketIO } from './utils/socketio.js';
import { setupEventListeners } from './utils/eventEmitter.js';
import { broadcastDashboardUpdates, broadcastDashboardSectionUpdate, getRealtimeDashboardData } from './modules/admin/services/realtime.service.js';
import { checkMaintenanceMode } from './middleware/maintenanceMode.js';
import { isRedisHealthy, getCache } from './utils/redis.js';

// Load environment variables
dotenv.config();

// Debug environment variables
logger.info('Environment variables:', {
    MONGODB_ATLAS_URI: process.env.MONGODB_ATLAS_URI ? 'Set' : 'Not set',
    MONGODB_URI: process.env.MONGODB_URI ? 'Set' : 'Not set',
    PORT: process.env.PORT,
    NODE_ENV: process.env.NODE_ENV,
    CORS_ORIGIN: process.env.CORS_ORIGIN
});

// Import routes
import customerRoutes from './modules/customer/index.js';
import marketingRoutes from './modules/marketing/index.js';
import sellerRoutes from './modules/seller/index.js';
import adminRoutes from './modules/admin/index.js';
import pincodeRoutes from './modules/common/routes/pincode.routes.js';

// Dashboard update configuration with dynamic adjustment
const DASHBOARD_UPDATE_CONFIG = {
  initialInterval: parseInt(process.env.DASHBOARD_UPDATE_INTERVAL || 30) * 1000, // Default 30 seconds
  minInterval: 10 * 1000, // 10 seconds minimum
  maxInterval: 120 * 1000, // 120 seconds maximum
  loadFactorThreshold: parseInt(process.env.DASHBOARD_LOAD_THRESHOLD || 20), // Connected admin threshold
  scaleFactor: 1.5, // Increase interval by 1.5x under high load
};

// Create Express app
const app = express();
const server = createServer(app);

// Request logging middleware
app.use((req, res, next) => {
    logger.info('Incoming request:', {
        method: req.method,
        url: req.url,
        path: req.path,
        originalUrl: req.originalUrl,
        headers: req.headers,
        body: req.body
    });
    next();
});

// Initialize Socket.IO
initSocketIO(server);

// Set up event listeners
setupEventListeners();

// Set up scheduled dashboard updates with dynamic interval
let dashboardUpdateInterval = DASHBOARD_UPDATE_CONFIG.initialInterval;
let updateIntervalId = null;

// Function to adjust update interval based on system load
const adjustUpdateInterval = () => {
  // Simplified version without checking connected admin count
  // Reset to initial interval
  dashboardUpdateInterval = DASHBOARD_UPDATE_CONFIG.initialInterval;
  
  // Clear existing interval and set new one
  if (updateIntervalId) {
    clearInterval(updateIntervalId);
  }
  
  updateIntervalId = setInterval(async () => {
    await broadcastDashboardUpdates();
  }, dashboardUpdateInterval);
  
  logger.info(`Dashboard update interval set to ${dashboardUpdateInterval / 1000}s`);
};

// Start with initial interval
updateIntervalId = setInterval(async () => {
  await broadcastDashboardUpdates();
}, dashboardUpdateInterval);

// Re-adjust interval every 5 minutes
setInterval(() => {
  adjustUpdateInterval();
}, 5 * 60 * 1000);

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_ATLAS_URI || process.env.MONGODB_URI;
if (!MONGODB_URI) {
    logger.error('MongoDB URI not found in environment variables');
    process.exit(1);
}

logger.info('Connecting to MongoDB Atlas...');
mongoose.connect(MONGODB_URI)
  .then(() => {
    logger.info('Connected to MongoDB Atlas successfully');
  })
  .catch((error) => {
    logger.error('MongoDB connection error:', error);
    process.exit(1);
  });

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later'
});
app.use('/api/', limiter);

// Specialized rate limit for dashboard endpoints
const dashboardLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 60, // More strict limit for dashboard endpoints
  message: 'Too many dashboard requests from this IP, please try again later'
});
app.use('/api/admin/dashboard', dashboardLimiter);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use(morgan('combined', {
  stream: {
    write: (message) => logger.info(message.trim())
  }
}));

// Maintenance mode middleware
app.use(checkMaintenanceMode);

// API routes
app.use('/api/customer', customerRoutes);
app.use('/api/marketing', marketingRoutes);
app.use('/api/seller', sellerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/pincodes', pincodeRoutes);

// Test route
app.get('/api/test', (req, res) => {
    res.json({ message: 'API is working!' });
});

// Health check endpoint
app.get('/health', (req, res) => {
  // Get Redis status
  const redisStatus = isRedisHealthy();
  
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    dashboardUpdateInterval: `${dashboardUpdateInterval / 1000}s`,
    redis: redisStatus,
    mongo: {
      connected: mongoose.connection.readyState === 1
    }
  });
});

// Admin-only debugging endpoints
if (process.env.NODE_ENV === 'development') {
  // Redis cache inspection endpoint (only for development)
  app.get('/debug/redis/:key', async (req, res) => {
    try {
      const { key } = req.params;
      if (!key) {
        return res.status(400).json({ 
          success: false,
          error: 'No key provided'
        });
      }
      
      logger.debug(`Debug checking Redis key: ${key}`);
      const value = await getCache(key);
      res.status(200).json({
        success: true,
        key: key,
        value: value
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });
}

const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
});