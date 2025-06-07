import express from 'express';
import { authenticateSeller } from '../../../middleware/auth.js';
import { getChartData, getCourierPerformance, getDashboardStats, getDashboardSummary, getProductPerformance } from '../controllers/dashboard.controller.js';

const router = express.Router();

router.use(authenticateSeller);

// Get dashboard summary (main endpoint with all data)
router.get('/', getDashboardSummary);

// Get dashboard stats
router.get('/stats', getDashboardStats);

// Get chart data
router.get('/charts', getChartData);

// Get courier performance
router.get('/couriers', getCourierPerformance);

// Get product performance
router.get('/products', getProductPerformance);

// Note: downloadReport function was removed as it doesn't exist in the controller

export default router;
