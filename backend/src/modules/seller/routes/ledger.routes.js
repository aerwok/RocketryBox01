import express from 'express';
import { protect } from '../../../middleware/auth.js';
import {
  listLedgerEntries,
  getLedgerEntry,
  exportLedgerEntries
} from '../controllers/ledger.controller.js';

const router = express.Router();

// All routes are protected
router.use(protect);

// List ledger entries with filters and pagination
router.get('/', listLedgerEntries);

// Get ledger entry details
router.get('/:id', getLedgerEntry);

// Export ledger entries
router.get('/export', exportLedgerEntries);

export default router; 