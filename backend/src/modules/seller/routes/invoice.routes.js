import express from 'express';
import { auth } from '../../../middleware/auth.js';
import { validate } from '../../../middleware/validate.js';
import {
  createInvoice,
  updateInvoice,
  deleteInvoice,
  getInvoice,
  listInvoices,
  exportInvoices,
  generatePDF,
  initiateInvoicePayment,
  verifyInvoicePayment
} from '../controllers/invoice.controller.js';
import {
  createInvoiceSchema,
  updateInvoiceSchema,
  paymentVerificationSchema
} from '../validators/invoice.validator.js';

const router = express.Router();

// Apply auth middleware to all routes
router.use(auth);

// Invoice CRUD routes
router.post('/', validate(createInvoiceSchema), createInvoice);
router.put('/:id', validate(updateInvoiceSchema), updateInvoice);
router.delete('/:id', deleteInvoice);
router.get('/:id', getInvoice);
router.get('/', listInvoices);
router.get('/export', exportInvoices);

// PDF generation
router.get('/:id/pdf', generatePDF);

// Payment routes
router.post('/:id/payment/initiate', initiateInvoicePayment);
router.post('/:id/payment/verify', validate(paymentVerificationSchema), verifyInvoicePayment);

export default router; 