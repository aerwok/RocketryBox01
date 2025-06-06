import express from 'express';
import { authenticateSeller } from '../../../middleware/auth.js';
import { adminOnly } from '../../../middleware/admin.js';
import { validationHandler } from '../../../middleware/validator.js';
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
router.use('/seller/cod-remittances', authenticateSeller);
router.get('/seller/cod-remittances', listCODRemittances);
router.get('/seller/cod-remittances/:id', getCODRemittanceDetails);

// Admin routes
router.use('/admin/cod-remittances', authenticateSeller, adminOnly);
router.post('/admin/cod-remittances', validationHandler(createCODRemittanceSchema), createCODRemittance);
router.patch('/admin/cod-remittances/:id', validationHandler(updateCODRemittanceSchema), updateCODRemittance);

export default router; 
