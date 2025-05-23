import express from 'express';
import customerRoutes from './routes/customer.routes.js';
import otpRoutes from './routes/otp.routes.js';
import { logger } from '../../utils/logger.js';

const router = express.Router();

// Debug middleware to log all requests
router.use((req, res, next) => {
    logger.info('Customer module request:', {
        method: req.method,
        path: req.path,
        originalUrl: req.originalUrl,
        baseUrl: req.baseUrl,
        body: req.body,
        query: req.query,
        headers: req.headers
    });
    next();
});

// Test route
router.get('/test', (req, res) => {
    res.json({ message: 'Customer routes are working!' });
});

// Mount OTP routes first (before any auth middleware)
router.use('/auth/otp', otpRoutes);

// Mount other customer routes
router.use('/', customerRoutes);

export default router; 