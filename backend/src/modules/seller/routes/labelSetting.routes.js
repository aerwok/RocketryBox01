import express from 'express';
import { protect } from '../../../middleware/auth.js';
import { validate } from '../../../middleware/validate.js';
import { updateLabelSettingSchema } from '../validators/labelSetting.validator.js';
import { getLabelSetting, updateLabelSetting } from '../controllers/labelSetting.controller.js';

const router = express.Router();

router.use(protect);

// Get label settings
router.get('/label-settings', getLabelSetting);
// Update label settings
router.put('/label-settings', validate(updateLabelSettingSchema), updateLabelSetting);

export default router; 