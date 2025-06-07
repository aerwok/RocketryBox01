import express from 'express';
import { authenticateSeller } from '../../../middleware/auth.js';
import {
  addTrackingEvent,
  bookCourierShipment,
  createBulkShipments,
  createShipment,
  getManifest,
  getShipment,
  getShipments,
  getShippingRates,
  getTrackingHistory,
  handleReturn,
  shipOrderWithWalletPayment,
  trackShipmentStatus,
  updateShipmentStatus
} from '../controllers/shipment.controller.js';
import {
  validateAddTrackingEvent,
  validateCourierBooking,
  validateCreateBulkShipments,
  validateCreateShipment,
  validateHandleReturn,
  validateShippingRates,
  validateUpdateShipmentStatus
} from '../validators/shipment.validator.js';

const router = express.Router();

// All routes are authenticateSellered with seller authentication
router.use(authenticateSeller);

// Shipping rates API
router.post('/rates', validateShippingRates, getShippingRates);

// Book shipment with courier API
router.post('/book', validateCourierBooking, bookCourierShipment);

// Create a shipment manually
router.post('/', validateCreateShipment, createShipment);

// Bulk create shipments
router.post('/bulk', validateCreateBulkShipments, createBulkShipments);

// List/filter/search shipments
router.get('/', getShipments);

// Export manifest
router.get('/manifest', getManifest);

// Get shipment details
router.get('/:id', getShipment);

// Track shipment with courier API
router.get('/:id/track', trackShipmentStatus);

// Update shipment status
router.patch('/:id/status', validateUpdateShipmentStatus, updateShipmentStatus);

// Add tracking event
router.post('/:id/tracking', validateAddTrackingEvent, addTrackingEvent);

// Get tracking history
router.get('/:id/tracking', getTrackingHistory);

// Handle return/NDR
router.post('/:id/return', validateHandleReturn, handleReturn);

// Ship order with rate selection and wallet payment (IDEAL WORKFLOW)
router.post('/ship-with-payment', shipOrderWithWalletPayment);

export default router;
