import express from 'express';
import { validationHandler } from '../../../middleware/validator.js';
import { protect, restrictTo } from '../../../middleware/auth.js';
import * as authController from '../controllers/auth.controller.js';
import * as authValidator from '../validators/auth.validator.js';
import multer from 'multer';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/admin-profiles');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const fileFilter = (req, file, cb) => {
  // Accept only image files
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new Error('Not an image! Please upload only images.'), false);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter
});

// Login route - public
router.post('/login', validationHandler(authValidator.loginValidator), authController.login);

// Register route - private (super admin only)
router.post(
  '/register',
  protect,
  restrictTo('Admin'),
  upload.single('profileImage'),
  validationHandler(authValidator.registerValidator),
  authController.register
);

// Protected routes
router.use(protect);

// Get current user profile
router.get('/profile', authController.getProfile);

// Logout
router.post('/logout', authController.logout);

// Session management
router.get('/sessions', authController.getSessions);
router.delete('/sessions/:sessionId', authController.revokeSession);
router.delete('/sessions', authController.revokeAllSessions);

export default router; 