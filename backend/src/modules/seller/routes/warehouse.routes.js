import express from 'express';
import { authenticateSeller } from '../../../middleware/auth.js';
import { validationHandler } from '../../../middleware/validator.js';
import { addStockSchema } from '../validators/warehouse.validator.js';
import { listWarehouseItems, addStockToItem } from '../controllers/warehouse.controller.js';

const router = express.Router();

router.use(authenticateSeller);

// List warehouse items
router.get('/items', listWarehouseItems);
// Add stock to item
router.post('/items/:itemId/stock', validationHandler(addStockSchema), addStockToItem);

export default router; 
