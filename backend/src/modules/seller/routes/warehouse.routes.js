import express from 'express';
import { authenticateSeller } from '../../../middleware/auth.js';
import { validationHandler } from '../../../middleware/validator.js';
import {
  addStockToItem,
  addWarehouse,
  listWarehouseItems,
  listWarehouses
} from '../controllers/warehouse.controller.js';
import { addStockSchema, addWarehouseSchema } from '../validators/warehouse.validator.js';

const router = express.Router();

router.use(authenticateSeller);

// Warehouse management routes
router.get('/', listWarehouses);
router.post('/', validationHandler(addWarehouseSchema), addWarehouse);

// Warehouse items management routes
router.get('/items', listWarehouseItems);
router.post('/items/:itemId/stock', validationHandler(addStockSchema), addStockToItem);

export default router;
