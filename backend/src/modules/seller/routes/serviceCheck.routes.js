import express from 'express';
import { protect } from '../../../middleware/auth.js';
import { validate } from '../../../middleware/validate.js';
import { bulkServiceCheckSchema, getServiceRestrictionsSchema } from '../validators/serviceCheck.validator.js';
import { bulkServiceCheck, getServiceRestrictions } from '../controllers/serviceCheck.controller.js';

const router = express.Router();

router.use(protect);

// Bulk pincode service check
router.post('/pincode', validate(bulkServiceCheckSchema), bulkServiceCheck);
// Get service restrictions
router.get('/restrictions', validate(getServiceRestrictionsSchema, 'query'), getServiceRestrictions);

export default router; 