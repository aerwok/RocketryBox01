import express from 'express';
import {
  getEscalationStats,
  searchEscalations,
  getEscalationById,
  createEscalation,
  updateEscalation,
  addComment,
  assignEscalation,
  bulkUpdateStatus
} from '../controllers/escalation.controller.js';
import {
  validateSearchEscalations,
  validateEscalationType,
  validateEscalationId,
  validateCreateEscalation,
  validateUpdateEscalation,
  validateAddComment,
  validateAssignEscalation,
  validateBulkUpdate
} from '../validators/escalation.validator.js';
import { authenticate } from '../../../middleware/auth.js';
import { checkPermission } from '../../../middleware/permission.js';

const router = express.Router();

// Get escalation statistics for dashboard
router.get(
  '/stats',
  authenticate,
  checkPermission('escalationManagement'),
  getEscalationStats
);

// Search escalations with filters
router.get(
  '/search',
  authenticate,
  checkPermission('escalationManagement'),
  validateSearchEscalations,
  searchEscalations
);

// Get a specific escalation by ID
router.get(
  '/:id',
  authenticate,
  checkPermission('escalationManagement'),
  validateEscalationId,
  validateEscalationType,
  getEscalationById
);

// Create a new escalation
router.post(
  '/',
  authenticate,
  checkPermission('escalationManagement'),
  validateEscalationType,
  validateCreateEscalation,
  createEscalation
);

// Update an escalation
router.patch(
  '/:id',
  authenticate,
  checkPermission('escalationManagement'),
  validateEscalationId,
  validateEscalationType,
  validateUpdateEscalation,
  updateEscalation
);

// Add a comment to an escalation
router.post(
  '/:id/comments',
  authenticate,
  checkPermission('escalationManagement'),
  validateAddComment,
  addComment
);

// Assign an escalation to an admin
router.post(
  '/:id/assign',
  authenticate,
  checkPermission('escalationManagement'),
  validateAssignEscalation,
  assignEscalation
);

// Bulk update escalation status
router.post(
  '/bulk-update',
  authenticate,
  checkPermission('escalationManagement'),
  validateBulkUpdate,
  bulkUpdateStatus
);

export default router; 