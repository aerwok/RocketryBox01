import express from 'express';
import {
  getWalletTransactions,
  getWalletTransactionById,
  addWalletTransaction,
  exportWalletTransactions
} from '../controllers/wallet.controller.js';
import {
  getInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoiceStatus,
  exportInvoices
} from '../controllers/invoice.controller.js';
import {
  getShippingCharges,
  getShippingChargeById,
  createShippingCharge,
  updateShippingChargeStatus,
  exportShippingCharges
} from '../controllers/shippingCharge.controller.js';
import {
  validateGetWalletTransactions,
  validateAddWalletTransaction,
  validateGetInvoices,
  validateCreateInvoice,
  validateUpdateInvoiceStatus
} from '../validators/billing.validator.js';
import {
  validateGetShippingCharges,
  validateCreateShippingCharge,
  validateUpdateShippingChargeStatus
} from '../validators/shipping.validator.js';
import { authenticate } from '../../../middleware/auth.js';
import { checkPermission } from '../../../middleware/permission.js';

const router = express.Router();

// Wallet History Routes
router.get(
  '/wallet-history',
  authenticate,
  checkPermission('billing'),
  validateGetWalletTransactions,
  getWalletTransactions
);

router.get(
  '/wallet-history/export',
  authenticate,
  checkPermission('billing'),
  validateGetWalletTransactions,
  exportWalletTransactions
);

router.get(
  '/wallet-history/:transactionId',
  authenticate,
  checkPermission('billing'),
  getWalletTransactionById
);

router.post(
  '/wallet-history',
  authenticate,
  checkPermission('billing'),
  validateAddWalletTransaction,
  addWalletTransaction
);

// Invoice Routes
router.get(
  '/invoices',
  authenticate,
  checkPermission('billing'),
  validateGetInvoices,
  getInvoices
);

router.get(
  '/invoices/export',
  authenticate,
  checkPermission('billing'),
  validateGetInvoices,
  exportInvoices
);

router.get(
  '/invoices/:invoiceId',
  authenticate,
  checkPermission('billing'),
  getInvoiceById
);

router.post(
  '/invoices',
  authenticate,
  checkPermission('billing'),
  validateCreateInvoice,
  createInvoice
);

router.patch(
  '/invoices/:invoiceId/status',
  authenticate,
  checkPermission('billing'),
  validateUpdateInvoiceStatus,
  updateInvoiceStatus
);

// Shipping Charges Routes
router.get(
  '/shipping-charges',
  authenticate,
  checkPermission('billing'),
  validateGetShippingCharges,
  getShippingCharges
);

router.get(
  '/shipping-charges/export',
  authenticate,
  checkPermission('billing'),
  validateGetShippingCharges,
  exportShippingCharges
);

router.get(
  '/shipping-charges/:id',
  authenticate,
  checkPermission('billing'),
  getShippingChargeById
);

router.post(
  '/shipping-charges',
  authenticate,
  checkPermission('billing'),
  validateCreateShippingCharge,
  createShippingCharge
);

router.patch(
  '/shipping-charges/:id/status',
  authenticate,
  checkPermission('billing'),
  validateUpdateShippingChargeStatus,
  updateShippingChargeStatus
);

export default router; 