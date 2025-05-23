import express from 'express';
import { protect, restrictTo } from '../../../middleware/auth.js';
import * as dashboardController from '../controllers/dashboard.controller.js';

const router = express.Router();

// All dashboard routes are protected for admin users
router.use(protect);
router.use(restrictTo('Admin', 'Manager'));

// Dashboard overview statistics
router.get('/overview', dashboardController.getDashboardOverview);

// KPI data route
router.get('/kpi', dashboardController.getKPI);

// Shipments data route
router.get('/shipments', dashboardController.getShipments);

// Real-time dashboard data
router.get('/realtime', dashboardController.getRealtimeData);

export default router; 