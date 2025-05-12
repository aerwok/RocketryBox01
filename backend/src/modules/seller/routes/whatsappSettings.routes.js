import express from 'express';
import { getWhatsAppSettings, updateWhatsAppSettings, setWhatsAppEnabled } from '../controllers/whatsappSettings.controller.js';
import { validate } from '../../../middleware/validate.js';
import { updateWhatsAppSettingsSchema, enableWhatsAppSettingsSchema } from '../validators/whatsappSettings.validator.js';
import { sellerAuth } from '../../../middleware/auth.js';

const router = express.Router();

// Get WhatsApp settings
router.get('/', sellerAuth, getWhatsAppSettings);

// Update WhatsApp settings
router.put('/', sellerAuth, validate(updateWhatsAppSettingsSchema), updateWhatsAppSettings);

// Enable/disable WhatsApp notifications
router.patch('/enable', sellerAuth, validate(enableWhatsAppSettingsSchema), setWhatsAppEnabled);

export default router; 