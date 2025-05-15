import express from 'express';
import { getWhatsAppSettings, updateWhatsAppSettings, setWhatsAppEnabled } from '../controllers/whatsappSettings.controller.js';
import { validationHandler } from '../../../middleware/validator.js';
import { updateWhatsAppSettingsSchema, enableWhatsAppSettingsSchema } from '../validators/whatsappSettings.validator.js';
import { protect } from '../../../middleware/auth.js';

const router = express.Router();

// Get WhatsApp settings
router.get('/', protect, getWhatsAppSettings);

// Update WhatsApp settings
router.put('/', protect, validationHandler(updateWhatsAppSettingsSchema), updateWhatsAppSettings);

// Enable/disable WhatsApp notifications
router.patch('/enable', protect, validationHandler(enableWhatsAppSettingsSchema), setWhatsAppEnabled);

export default router; 
