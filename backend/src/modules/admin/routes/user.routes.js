import express from 'express';
import { validationHandler as validate } from '../../../middleware/validator.js';
import { protect, restrictTo } from '../../../middleware/auth.js';
import * as userController from '../controllers/user.controller.js';
import multer from 'multer';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/seller-documents');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// All user routes are protected for admins
router.use(protect);
router.use(restrictTo('Admin', 'Manager', 'Support'));

// Real-time user data
router.post('/realtime', userController.getRealtimeUserData);

// Seller routes
router.get('/sellers', userController.getAllSellers);
router.get('/sellers/:id', userController.getSellerDetails);
router.patch('/sellers/:id/status', userController.updateSellerStatus);
router.patch('/sellers/:id/kyc', userController.updateSellerKYC);
router.post('/sellers/:id/agreement', upload.single('document'), userController.createSellerAgreement);
router.post('/sellers/:id/ratecard', userController.manageSellerRateCard);

// Customer routes
router.get('/customers', userController.getAllCustomers);
router.get('/customers/:id', userController.getCustomerDetails);
router.patch('/customers/:id/status', userController.updateCustomerStatus);

export default router; 