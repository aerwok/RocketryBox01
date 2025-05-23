import express from 'express';
import { getDashboardStats, getChartData, getCourierPerformance, getProductPerformance, getDashboardSummary } from '../controllers/dashboard.controller.js';
import { protect } from '../../../middleware/auth.js';

const router = express.Router();

router.use(protect);

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