import express from 'express';
import {
  listPolicies,
  getPolicyBySlug,
  createPolicy,
  updatePolicy,
  deletePolicy,
  getPolicyByType,
  getDefaultPolicies
} from '../controllers/policy.controller.js';
import {
  validateCreatePolicy,
  validateUpdatePolicy,
  validateGetPolicy,
  validateGetPolicyByType,
  validateListPolicies
} from '../validators/policy.validator.js';
import { authenticate } from '../../../middleware/auth.js';
import { checkPermission } from '../../../middleware/permission.js';

const router = express.Router();

// Get all policies with pagination
router.get(
  '/',
  authenticate,
  checkPermission('settings'),
  validateListPolicies,
  listPolicies
);

// Get all default policies
router.get(
  '/defaults',
  authenticate,
  checkPermission('settings'),
  getDefaultPolicies
);

// Get policy by type
router.get(
  '/type/:type',
  authenticate,
  checkPermission('settings'),
  validateGetPolicyByType,
  getPolicyByType
);

// Get policy by slug
router.get(
  '/:slug',
  authenticate,
  checkPermission('settings'),
  validateGetPolicy,
  getPolicyBySlug
);

// Create new policy
router.post(
  '/',
  authenticate,
  checkPermission('settings'),
  validateCreatePolicy,
  createPolicy
);

// Update policy
router.put(
  '/:slug',
  authenticate,
  checkPermission('settings'),
  validateUpdatePolicy,
  updatePolicy
);

// Delete policy
router.delete(
  '/:slug',
  authenticate,
  checkPermission('settings'),
  validateGetPolicy,
  deletePolicy
);

export default router; 