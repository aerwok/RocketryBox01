import express from 'express';
import customerRoutes from './routes/customer.routes.js';

const router = express.Router();

router.use('/', customerRoutes);

export default router; 