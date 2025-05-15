import express from 'express';
import { listWalletTransactions, getWalletTransaction, exportWalletTransactions, initiateRecharge, verifyRecharge, creditCODToWallet, creditToWallet } from '../controllers/wallet.controller.js';
import { protect } from '../../../middleware/auth.js';

const router = express.Router();

router.use(protect);

// List wallet transactions
router.get('/', listWalletTransactions);

// Get wallet transaction details
router.get('/:id', getWalletTransaction);

// Export wallet transactions
router.get('/export', exportWalletTransactions);

// Initiate wallet recharge (Razorpay)
router.post('/recharge/initiate', initiateRecharge);

// Verify wallet recharge (Razorpay)
router.post('/recharge/verify', verifyRecharge);

// Credit COD remittance to wallet (admin/system)
router.post('/cod-credit', creditCODToWallet);

// Generic admin credit to wallet
router.post('/credit', creditToWallet);

export default router; 
