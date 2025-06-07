import express from 'express';
import multer from 'multer';
import { authenticateSeller } from '../../../middleware/auth.js';
import { defaultLimiter } from '../../../middleware/rateLimiter.js';
import {
  addOrderNote,
  bulkUpdateStatus,
  cancelOrder,
  createOrder,
  exportOrders,
  generateImportTemplate,
  getOrder,
  getOrderNotes,
  getOrders,
  getOrderStats,
  getOrderTimeline,
  importOrders,
  updateOrderStatus,
  updateTracking
} from '../controllers/order.controller.js';
import { validateBulkOrderStatus, validateOrderStatus } from '../validators/order.validator.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// All routes are authenticateSellered and rate limited
router.use(authenticateSeller);
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
