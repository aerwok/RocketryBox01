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
  handleReturn
} from '../controllers/shipment.controller.js';
import { authenticateSeller } from '../../../middleware/auth.js';
import {
  validateCreateShipment,
  validateCreateBulkShipments,
  validateUpdateShipmentStatus,
  validateAddTrackingEvent,
  validateHandleReturn
} from '../validators/shipment.validator.js';

const router = express.Router();

// All routes are protected with seller authentication
router.use(authenticateSeller);

// Create a shipment
router.post('/', validateCreateShipment, createShipment);

// Bulk create shipments
router.post('/bulk', validateCreateBulkShipments, createBulkShipments);

// List/filter/search shipments
router.get('/', getShipments);

// Export manifest
router.get('/manifest', getManifest);

// Get shipment details
router.get('/:id', getShipment);

// Update shipment status
router.patch('/:id/status', validateUpdateShipmentStatus, updateShipmentStatus);

// Add tracking event
router.post('/:id/tracking', validateAddTrackingEvent, addTrackingEvent);

// Get tracking history
router.get('/:id/tracking', getTrackingHistory);

// Handle return/NDR
router.post('/:id/return', validateHandleReturn, handleReturn);

export default router; 