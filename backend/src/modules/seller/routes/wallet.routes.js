import express from 'express';
import { authenticateSeller } from '../../../middleware/auth.js';
import { requireBasicProfile, requireDocumentUpload } from '../../../middleware/documentVerification.js';
import { creditCODToWallet, creditToWallet, exportWalletTransactions, getWalletBalance, getWalletSummary, getWalletTransaction, initiateRecharge, listWalletTransactions, verifyRecharge } from '../controllers/wallet.controller.js';

const router = express.Router();

// Apply seller authentication to all routes
router.use(authenticateSeller);

// Wallet viewing operations - require basic profile only
router.get('/balance', requireBasicProfile, getWalletBalance);
router.get('/summary', requireBasicProfile, getWalletSummary);
router.get('/history', requireBasicProfile, listWalletTransactions);
router.get('/transactions', requireBasicProfile, listWalletTransactions);
router.get('/:id', requireBasicProfile, getWalletTransaction);
router.get('/export', requireBasicProfile, exportWalletTransactions);

// Financial operations - require complete document upload for security
router.post('/recharge/initiate', requireDocumentUpload, initiateRecharge);
router.post('/recharge/verify', requireDocumentUpload, verifyRecharge);

// Admin/system operations - require complete documents
router.post('/cod-credit', requireDocumentUpload, creditCODToWallet);
router.post('/credit', requireDocumentUpload, creditToWallet);

export default router;
