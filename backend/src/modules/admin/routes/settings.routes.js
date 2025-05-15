import express from 'express';
import {
  getSystemConfig,
  updateSystemConfig,
  getConfigByCategory,
  updateConfigByKey,
  resetSystemConfig
} from '../controllers/settings.controller.js';
import {
  validateSystemConfig,
  validateConfigByKey
} from '../validators/settings.validator.js';
import { authenticate } from '../../../middleware/auth.js';
import { checkPermission } from '../../../middleware/permission.js';

const router = express.Router();

// System settings routes
router.get(
  '/system',
  authenticate,
  checkPermission('settings'),
  getSystemConfig
);

router.put(
  '/system',
  authenticate,
  checkPermission('settings'),
  validateSystemConfig,
  updateSystemConfig
);

router.post(
  '/system/reset',
  authenticate,
  checkPermission('settings'),
  resetSystemConfig
);

// Category-based settings
router.get(
  '/category/:category',
  authenticate,
  checkPermission('settings'),
  getConfigByCategory
);

// Key-based settings
router.put(
  '/key/:key',
  authenticate,
  checkPermission('settings'),
  validateConfigByKey,
  updateConfigByKey
);

export default router; 