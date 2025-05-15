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
router.get('/', validate(teamValidator.teamQueryValidator), teamController.getAllTeamMembers);

// Get team member details
router.get('/:userId', validate(teamValidator.teamIdValidator), teamController.getTeamMemberDetails);

// Get detailed team member profile with history
router.get(
  '/:userId/profile',
  validate(teamValidator.teamIdValidator),
  restrictTo('Admin'), // Only full admins can see detailed profiles
  teamController.getTeamMemberProfile
);

// Update team member
router.patch(
  '/:userId',
  validate(teamValidator.updateTeamMemberValidator),
  teamController.updateTeamMember
);

// Update team member status
router.patch(
  '/:userId/status',
  validate(teamValidator.updateStatusValidator),
  teamController.updateTeamMemberStatus
);

// Update team member permissions
router.patch(
  '/:userId/permissions',
  validate(teamValidator.updatePermissionsValidator),
  teamController.updateTeamMemberPermissions
);

// Upload team member documents
router.post(
  '/:userId/documents',
  validate(teamValidator.uploadDocumentValidator),
  upload.single('document'),
  teamController.uploadTeamMemberDocuments
);

export default router; 