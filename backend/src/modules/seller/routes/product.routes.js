import express from 'express';
import { protect } from '../../../middleware/auth.js';
import { validate } from '../../../middleware/validate.js';
import { addProductSchema, updateProductSchema } from '../validators/product.validator.js';
import { listProducts, addProduct, getProduct, updateProduct, deleteProduct } from '../controllers/product.controller.js';

const router = express.Router();

router.use(protect);

// List products
router.get('/products', listProducts);
// Add product
router.post('/products', validate(addProductSchema), addProduct);
// Get product details
router.get('/products/:id', getProduct);
// Update product
router.put('/products/:id', validate(updateProductSchema), updateProduct);
// Delete product
router.delete('/products/:id', deleteProduct);

export default router; 