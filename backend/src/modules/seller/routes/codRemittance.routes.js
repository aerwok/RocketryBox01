import express from 'express';
import { protect } from '../../../middleware/auth.js';
import { adminOnly } from '../../../middleware/admin.js';
import { validate } from '../../../middleware/validate.js';
import {
  createCODRemittanceSchema,
  updateCODRemittanceSchema
} from '../validators/codRemittance.validator.js';
import {
  listCODRemittances,
  getCODRemittanceDetails,
  createCODRemittance,
  updateCODRemittance
} from '../controllers/codRemittance.controller.js';

const router = express.Router();

// Seller routes
router.use('/seller/cod-remittances', protect);
router.get('/seller/cod-remittances', listCODRemittances);
router.get('/seller/cod-remittances/:id', getCODRemittanceDetails);

// Admin routes
router.use('/admin/cod-remittances', protect, adminOnly);
router.post('/admin/cod-remittances', validate(createCODRemittanceSchema), createCODRemittance);
router.patch('/admin/cod-remittances/:id', validate(updateCODRemittanceSchema), updateCODRemittance);

export default router; 