import express from 'express';
import {
  createShipment,
  createBulkShipments,
  getShipments,
  getShipment,
  updateShipmentStatus,
  addTrackingEvent,
  getTrackingHistory,
  getManifest,
  handleReturn,
  getShippingRates,
  bookCourierShipment,
  trackShipmentStatus
} from '../controllers/shipment.controller.js';
import { authenticateSeller } from '../../../middleware/auth.js';
import {
  validateCreateShipment,
  validateCreateBulkShipments,
  validateUpdateShipmentStatus,
  validateAddTrackingEvent,
  validateHandleReturn,
  validateShippingRates,
  validateCourierBooking
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

export default router; 
