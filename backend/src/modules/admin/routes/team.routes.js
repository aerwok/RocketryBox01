import express from 'express';
import { validate } from '../../../middleware/validator.js';
import { protect, restrictTo } from '../../../middleware/auth.js';
import * as teamController from '../controllers/team.controller.js';
import * as teamValidator from '../validators/team.validator.js';
import multer from 'multer';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/admin-documents');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const fileFilter = (req, file, cb) => {
  // Accept common document types
  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, JPEG, JPG, and PNG files are allowed.'), false);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter
});

// All team routes are protected and restricted to Admin/Manager
router.use(protect);
router.use(restrictTo('Admin', 'Manager'));

// Get system sections and their access statistics
router.get('/sections', restrictTo('Admin'), teamController.getSystemSections);

// Get all team members
router.get('/', ...teamValidator.teamQueryValidator, validate, teamController.getAllTeamMembers);

// Register a new team member  
router.post('/register', ...teamValidator.registerTeamMemberValidator, validate, teamController.registerTeamMember);

// Get team member details
router.get('/:userId', ...teamValidator.teamIdValidator, validate, teamController.getTeamMemberDetails);

// Get detailed team member profile with history
router.get(
  '/:userId/profile',
  ...teamValidator.teamIdValidator,
  validate,
  restrictTo('Admin'), // Only full admins can see detailed profiles
  teamController.getTeamMemberProfile
);

// Update team member
router.patch(
  '/:userId',
  ...teamValidator.updateTeamMemberValidator,
  validate,
  teamController.updateTeamMember
);

// Update team member status
router.patch(
  '/:userId/status',
  ...teamValidator.updateStatusValidator,
  validate,
  teamController.updateTeamMemberStatus
);

// Update team member permissions
router.patch(
  '/:userId/permissions',
  ...teamValidator.updatePermissionsValidator,
  validate,
  teamController.updateTeamMemberPermissions
);

// Upload team member documents
router.post(
  '/:userId/documents',
  ...teamValidator.uploadDocumentValidator,
  validate,
  upload.single('document'),
  teamController.uploadTeamMemberDocuments
);

export default router; 