import express from 'express';
import multer from 'multer';
import { protect } from '../../../middleware/auth.js';
import { validate } from '../../../middleware/validate.js';
import {
  updateWeightDisputeSchema,
  uploadWeightDisputeFileSchema
} from '../validators/weightDispute.validator.js';
import {
  listWeightDisputes,
  getWeightDisputeDetails,
  updateWeightDispute,
  uploadWeightDisputeFile
} from '../controllers/weightDispute.controller.js';

const router = express.Router();
const upload = multer();

router.use(protect);

// List disputes
router.get('/', listWeightDisputes);
// Get dispute details
router.get('/:awbNumber', getWeightDisputeDetails);
// Update dispute
router.put('/:awbNumber', validate(updateWeightDisputeSchema), updateWeightDispute);
// Upload disputes (Excel)
router.post('/upload', upload.single('file'), validate(uploadWeightDisputeFileSchema), uploadWeightDisputeFile);

export default router; 