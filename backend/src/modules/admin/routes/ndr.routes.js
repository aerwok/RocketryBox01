import express from 'express';
import {
  getNDRs,
  getNDRById,
  syncNDRs,
  updateNDRStatus,
  assignNDR,
  initiateRTO,
  getNDRStats
} from '../controllers/ndr.controller.js';
import {
  validateListNDRs,
  validateSyncNDRs,
  validateUpdateStatus,
  validateAssignNDR,
  validateInitiateRTO
} from '../validators/ndr.validator.js';
import { authenticate } from '../../../middleware/auth.js';
import { checkPermission } from '../../../middleware/permission.js';

const router = express.Router();

// Get all NDRs with filtering and pagination
router.get(
  '/',
  authenticate,
  checkPermission('ordersShipping'),
  validateListNDRs,
  getNDRs
);

// Get NDR statistics for dashboard
router.get(
  '/stats',
  authenticate,
  checkPermission('ordersShipping', 'reportsAnalytics'),
  getNDRStats
);

// Get single NDR by ID
router.get(
  '/:id',
  authenticate,
  checkPermission('ordersShipping'),
  getNDRById
);

// Sync NDRs from seller NDRs
router.post(
  '/sync',
  authenticate,
  checkPermission('ordersShipping'),
  validateSyncNDRs,
  syncNDRs
);

// Update NDR status
router.patch(
  '/:id/status',
  authenticate,
  checkPermission('ordersShipping'),
  validateUpdateStatus,
  updateNDRStatus
);

// Assign NDR to admin
router.patch(
  '/:id/assign',
  authenticate,
  checkPermission('ordersShipping', 'teamManagement'),
  validateAssignNDR,
  assignNDR
);

// Initiate RTO
router.post(
  '/:id/rto',
  authenticate,
  checkPermission('ordersShipping'),
  validateInitiateRTO,
  initiateRTO
);

export default router; 