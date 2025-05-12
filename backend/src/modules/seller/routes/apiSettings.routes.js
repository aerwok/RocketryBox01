import express from 'express';
import { getAPISettings, generateNewCredentials, updateAPIStatus } from '../controllers/apiSettings.controller.js';
import { validate } from '../../../middleware/validate.js';
import { updateAPIStatusSchema } from '../validators/apiSettings.validator.js';
import { sellerAuth } from '../../../middleware/auth.js';

const router = express.Router();

// Get current API settings
router.get('/', sellerAuth, getAPISettings);

// Generate new API credentials
router.post('/generate', sellerAuth, generateNewCredentials);

// Enable/disable API access
router.patch('/status', sellerAuth, validate(updateAPIStatusSchema), updateAPIStatus);

export default router; 