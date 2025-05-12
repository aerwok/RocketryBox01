import express from 'express';
import { protect } from '../../../middleware/auth.js';
import { validate } from '../../../middleware/validate.js';
import { addStoreSchema, updateStoreSchema } from '../validators/store.validator.js';
import { listStores, addStore, getStore, updateStore, deleteStore } from '../controllers/store.controller.js';

const router = express.Router();

router.use(protect);

// List stores
router.get('/stores', listStores);
// Add store
router.post('/stores', validate(addStoreSchema), addStore);
// Get store details
router.get('/stores/:id', getStore);
// Update store
router.put('/stores/:id', validate(updateStoreSchema), updateStore);
// Delete store
router.delete('/stores/:id', deleteStore);

export default router; 