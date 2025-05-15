import express from 'express';
import {
  getShippingCharges,
  getShippingChargeById,
  createShippingCharge,
  updateShippingChargeStatus,
  exportShippingCharges
} from '../controllers/shippingCharge.controller.js';
import { protect } from '../../../middleware/auth.js';
import { checkPermission } from '../../../middleware/permission.js';
import { 
  validateGetShippingCharges,
  validateCreateShippingCharge,
  validateUpdateShippingChargeStatus
} from '../validators/shipping.validator.js';

const router = express.Router();

// Get all shipping charges with pagination and filtering
router.get(
  '/charges',
  protect,
  checkPermission('billing'),
  validateGetShippingCharges,
  getShippingCharges
);

// Export shipping charges
router.get(
  '/charges/export',
  protect,
  checkPermission('billing'),
  validateGetShippingCharges,
  exportShippingCharges
);

// Get shipping charge by ID
router.get(
  '/charges/:id',
  protect,
  checkPermission('billing'),
  getShippingChargeById
);

// Create a new shipping charge
router.post(
  '/charges',
  protect,
  checkPermission('billing'),
  validateCreateShippingCharge,
  createShippingCharge
);

// Update shipping charge status
router.patch(
  '/charges/:id/status',
  protect,
  checkPermission('billing'),
  validateUpdateShippingChargeStatus,
  updateShippingChargeStatus
);

export default router; 