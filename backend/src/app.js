import cookieParser from 'cookie-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { createServer } from 'http';
import mongoose from 'mongoose';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import { errorHandler } from './middleware/errorHandler.js';
import { checkMaintenanceMode } from './middleware/maintenanceMode.js';
import { shippingErrorMiddleware } from './middleware/shippingErrorHandler.js';
import { broadcastDashboardUpdates } from './modules/admin/services/realtime.service.js';
import { setupEventListeners } from './utils/eventEmitter.js';
import { logger } from './utils/logger.js';
import { getCache, isRedisHealthy } from './utils/redis.js';
import { initSocketIO } from './utils/socketio.js';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from the correct path
const envPath = path.resolve(__dirname, '../.env');
logger.info('Loading environment variables from:', { envPath });
dotenv.config({ path: envPath });

// Debug environment variables
logger.info('Environment variables loaded:', {
  MONGODB_ATLAS_URI: process.env.MONGODB_ATLAS_URI ? 'Set' : 'Not set',
  MONGODB_URI: process.env.MONGODB_URI ? 'Set' : 'Not set',
  PORT: process.env.PORT,
  NODE_ENV: process.env.NODE_ENV,
  CORS_ORIGIN: process.env.CORS_ORIGIN,
  AWS_REGION: process.env.AWS_REGION ? 'Set' : 'Not set',
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID ? 'Set' : 'Not set',
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY ? 'Set' : 'Not set',
  SES_FROM_EMAIL: process.env.SES_FROM_EMAIL ? 'Set' : 'Not set'
});

// Set development environment if not set
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'development';
  console.log('Setting NODE_ENV to development');
}

// Import routes
import adminRoutes from './modules/admin/index.js';
import pincodeRoutes from './modules/common/routes/pincode.routes.js';
import customerRoutes from './modules/customer/index.js';
import webhookRoutes from './modules/customer/routes/webhook.routes.js';
import marketingRoutes from './modules/marketing/index.js';
import sellerRoutes from './modules/seller/index.js';
import shippingRoutes from './modules/shipping/index.js';

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
  logger.error('MongoDB URI not found in environment variables. Please check your .env file.');
  logger.info('Required environment variables:', {
    MONGODB_ATLAS_URI: process.env.MONGODB_ATLAS_URI ? 'Set' : 'Not set',
    MONGODB_URI: process.env.MONGODB_URI ? 'Set' : 'Not set'
  });
  process.exit(1);
}

logger.info('Connecting to MongoDB...');

mongoose.connect(MONGODB_URI, {
  serverSelectionTimeoutMS: 30000, // Increased from 5000ms to 30000ms (30s)
  socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
})
  .then(async () => {
    logger.info('Connected to MongoDB successfully');
    // Sync mobile and phone fields on startup
    if (process.env.NODE_ENV === 'development') {
      try {
        // logger.info('Syncing mobile and phone fields...');
        const db = mongoose.connection;
        const customersCollection = db.collection('customers');

        // Find customers with mobile but no phone
        const results = await customersCollection.updateMany(
          { mobile: { $exists: true }, phone: { $exists: false } },
          [{ $set: { phone: "$mobile" } }]
        );

        // Find customers with phone but no mobile
        const results2 = await customersCollection.updateMany(
          { phone: { $exists: true }, mobile: { $exists: false } },
          [{ $set: { mobile: "$phone" } }]
        );

        // logger.info(`Sync complete: ${results.modifiedCount + results2.modifiedCount} customers updated`);
      } catch (error) {
        logger.error('Error syncing mobile and phone fields:', error);
      }
    }
  })
  .catch((error) => {
    logger.error('MongoDB connection error:', {
      error: error.message,
      stack: error.stack
    });
    process.exit(1);
  });

// Security middleware
app.use(helmet());

// CORS configuration - allow multiple frontend origins
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  process.env.CORS_ORIGIN,
  process.env.FRONTEND_URL
].filter(Boolean); // Remove undefined values

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      // In development, allow any localhost origin
      if (process.env.NODE_ENV === 'development' && origin.includes('localhost')) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    }
  },
  credentials: true
}));

// Cookie parser middleware
app.use(cookieParser());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? Infinity : 100, // Unlimited in development
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false // Disable the `X-RateLimit-*` headers
});
app.use('/api/', limiter);

// Specialized rate limit for dashboard endpoints
const dashboardLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: process.env.NODE_ENV === 'development' ? 300 : 60, // Higher limit in development
  message: 'Too many dashboard requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api/admin/dashboard', dashboardLimiter);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Logging middleware
app.use(morgan('combined', {
  stream: {
    write: (message) => logger.info(message.trim())
  }
}));

// Maintenance mode middleware
app.use(checkMaintenanceMode);

// API routes
app.use('/api/v2/customer', customerRoutes);
app.use('/api/v2/marketing', marketingRoutes);
app.use('/api/v2/seller', sellerRoutes);
app.use('/api/v2/admin', adminRoutes);
app.use('/api/v2/shipping', shippingRoutes);
app.use('/api/v2/pincodes', pincodeRoutes);

// Mount webhook routes at root level (no version prefix)
app.use('/api/webhooks', webhookRoutes);

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

// Admin debug endpoint (secure)
app.get('/api/admin/debug', (req, res) => {
  const adminToken = req.headers['x-admin-token'];
  if (adminToken !== process.env.ADMIN_DEBUG_TOKEN) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  res.json({
    env: {
      NODE_ENV: process.env.NODE_ENV,
      PORT: process.env.PORT,
      // Add other non-sensitive env vars as needed
    },
    timestamp: new Date().toISOString(),
    message: 'Admin debug endpoint is working!'
  });
});

// Error handling middleware (should be last)
app.use(shippingErrorMiddleware);
app.use(errorHandler);

const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
});
