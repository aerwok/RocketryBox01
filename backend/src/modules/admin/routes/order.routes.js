import express from 'express';
import { protect, restrictTo } from '../../../middleware/auth.js';
import { advancedLimiter } from '../../../middleware/rateLimiter.js';
import * as orderController from '../controllers/order.controller.js';

const router = express.Router();

// Protect all routes
router.use(protect);
router.use(restrictTo('Admin', 'Manager'));

// Order management routes
router.get('/', orderController.getOrders);
router.get('/stats', orderController.getOrderStats);
router.get('/export', orderController.exportOrders);
router.get('/:id', orderController.getOrderDetails);
router.patch('/:id/status', orderController.updateOrderStatus);
router.patch('/bulk-status', orderController.bulkUpdateOrderStatus);

export default router; 