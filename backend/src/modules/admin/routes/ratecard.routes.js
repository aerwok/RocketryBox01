import express from 'express';
import { protect, restrictTo } from '../../../middleware/auth.js';
import * as rateCardController from '../controllers/ratecard.controller.js';
import { validateCreateRateCards, validateUpdateRateCards } from '../validators/billing.validator.js';

const router = express.Router();

// All rate card routes are protected for admins
router.use(protect);
router.use(restrictTo('Admin', 'Manager'));

// Statistics and utility routes (must come before parameterized routes)
router.get('/statistics', rateCardController.getRateCardStatistics);
router.get('/couriers', rateCardController.getActiveCouriers);

// Import route (SuperAdmin only)
router.post('/import', restrictTo('Admin'), rateCardController.importRateCards);

// CRUD routes
router.route('/')
    .get(rateCardController.getAllRateCards)
    .post(validateCreateRateCards, rateCardController.createRateCards);

router.route('/:id')
    .get(rateCardController.getRateCardById)
    .patch(rateCardController.updateRateCard)
    .delete(restrictTo('Admin'), rateCardController.deleteRateCard);

// Deactivate route
router.patch('/:id/deactivate', rateCardController.deactivateRateCard);

export default router; 