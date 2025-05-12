import express from 'express';
import { protect } from '../../../middleware/auth.js';
import { validate } from '../../../middleware/validate.js';
import { courierSettingSchema } from '../validators/courierSetting.validator.js';
import { listCourierSettings, addOrUpdateCourierSetting, getCourierSetting, deleteCourierSetting } from '../controllers/courierSetting.controller.js';

const router = express.Router();

router.use(protect);

// List courier settings
router.get('/courier-settings', listCourierSettings);
// Add or update courier setting
router.post('/courier-settings', validate(courierSettingSchema), addOrUpdateCourierSetting);
// Get courier setting details
router.get('/courier-settings/:id', getCourierSetting);
// Delete courier setting
router.delete('/courier-settings/:id', deleteCourierSetting);

export default router; 