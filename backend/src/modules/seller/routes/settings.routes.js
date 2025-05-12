import express from 'express';
import whatsappSettingsRoutes from './whatsappSettings.routes.js';
import apiSettingsRoutes from './apiSettings.routes.js';
import labelSettingRoutes from './labelSetting.routes.js';
import courierSettingRoutes from './courierSetting.routes.js';
import { sellerAuth } from '../../../middleware/auth.js';

const router = express.Router();

// Protect all settings routes
router.use(sellerAuth);

// WhatsApp Settings
router.use('/whatsapp', whatsappSettingsRoutes);

// API Settings
router.use('/api', apiSettingsRoutes);

// Label Settings
router.use('/label', labelSettingRoutes);

// Courier Settings
router.use('/courier', courierSettingRoutes);

export default router; 