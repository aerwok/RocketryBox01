import express from 'express';
import { protect } from '../../../middleware/auth.js';
import { validate } from '../../../middleware/validate.js';
import { addStockSchema } from '../validators/warehouse.validator.js';
import { listWarehouseItems, addStockToItem } from '../controllers/warehouse.controller.js';

const router = express.Router();

router.use(protect);

// List warehouse items
router.get('/items', listWarehouseItems);
// Add stock to item
router.post('/items/:itemId/stock', validate(addStockSchema), addStockToItem);

export default router; 