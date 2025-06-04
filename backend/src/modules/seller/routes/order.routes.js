import express from 'express';
import {
  createOrder,
  getOrders,
  getOrder,
  updateOrderStatus,
  cancelOrder,
  getOrderStats,
  exportOrders,
  importOrders,
  bulkUpdateStatus,
  generateImportTemplate,
  addOrderNote,
  getOrderTimeline,
  getOrderNotes,
  updateTracking
} from '../controllers/order.controller.js';
import { validateOrderStatus, validateBulkOrderStatus } from '../validators/order.validator.js';
import { protect } from '../../../middleware/auth.js';
import { defaultLimiter } from '../../../middleware/rateLimiter.js';
import multer from 'multer';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// All routes are protected and rate limited
router.use(protect);
router.use(defaultLimiter);

// Order management routes
router.post('/', createOrder);
router.get('/', getOrders);
router.get('/stats', getOrderStats);
router.get('/import/template', generateImportTemplate);
router.post('/import', upload.single('file'), importOrders);
router.post('/export', exportOrders);
router.post('/bulk-status', validateBulkOrderStatus, bulkUpdateStatus);

// Individual order routes
router.get('/:id', getOrder);
router.patch('/:id/status', validateOrderStatus, updateOrderStatus);
router.patch('/:id/tracking', updateTracking);
router.post('/:id/cancel', cancelOrder);

// Order notes and timeline
router.get('/:id/timeline', getOrderTimeline);
router.get('/:id/notes', getOrderNotes);
router.post('/:id/notes', addOrderNote);

export default router; 
