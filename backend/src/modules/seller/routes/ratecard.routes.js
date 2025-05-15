import express from 'express';
import { protect } from '../../../middleware/auth.js';
import { validationHandler } from '../../../middleware/validator.js';
import { calculateRateSchema } from '../validators/ratecard.validator.js';
import {
  getSellerRateCard,
  calculateShippingRate,
  getRateCardHistory,
  getZoneMapping
} from '../controllers/ratecard.controller.js';

const router = express.Router();

// All routes require seller authentication
router.use(protect);

// Get seller's current rate card
router.get('/', getSellerRateCard);

// Calculate shipping rate based on rate card
router.post('/calculate', validationHandler(calculateRateSchema), calculateShippingRate);

// Get rate card change history
router.get('/history', getRateCardHistory);

// Get zone mapping for pincodes
router.get('/zones', getZoneMapping);

export default router; 
