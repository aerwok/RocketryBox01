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
  getOrderNotes
} from '../controllers/order.controller.js';
import { validateOrderStatus, validateBulkOrderStatus } from '../validators/order.validator.js';
import { authenticateSeller } from '../../../middleware/auth.js';
import multer from 'multer';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// All routes are protected with seller authentication
router.use(authenticateSeller);

// Create new order
router.post('/', createOrder);

// Get all orders with filters and pagination
router.get('/', getOrders);

// Get order statistics
router.get('/stats', getOrderStats);

// Get single order
router.get('/:id', getOrder);

// Update order status
router.patch('/:id/status', validateOrderStatus, updateOrderStatus);

// Cancel order
router.post('/:id/cancel', cancelOrder);

// Export orders to Excel
router.get('/export', exportOrders);

// Get import template
router.get('/import/template', generateImportTemplate);

// Import orders from Excel
router.post('/import', upload.single('file'), importOrders);

// Bulk update order status
router.post('/bulk/status', validateBulkOrderStatus, bulkUpdateStatus);

// Order timeline and notes
router.post('/:id/notes', addOrderNote);
router.get('/:id/timeline', getOrderTimeline);
router.get('/:id/notes', getOrderNotes);

export default router; 