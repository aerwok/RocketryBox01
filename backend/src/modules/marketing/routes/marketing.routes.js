import express from 'express';
import { body, query } from 'express-validator';
import { validate } from '../../../middleware/validator.js';
import { protect, restrictTo } from '../../../middleware/auth.js';
import { submitContact, getAllContacts, getContactById } from '../controllers/contact.controller.js';
import { registerPartner, getAllPartners, updatePartnerStatus } from '../controllers/partner.controller.js';
import { getTrackingInfo, updateTrackingStatus, getAllTracking } from '../controllers/tracking.controller.js';

const router = express.Router();

// Public routes
router.post(
  '/contact',
  [
    body('email').isEmail().withMessage('Please enter a valid email'),
    body('message').notEmpty().withMessage('Message is required')
  ],
  validate,
  submitContact
);

router.post(
  '/partner',
  [
    body('fullName').notEmpty().withMessage('Full name is required'),
    body('companyName').notEmpty().withMessage('Company name is required'),
    body('email').isEmail().withMessage('Please enter a valid email'),
    body('contact').notEmpty().withMessage('Contact number is required'),
    body('address').notEmpty().withMessage('Address is required'),
    body('service').notEmpty().withMessage('Service type is required'),
    body('business').notEmpty().withMessage('Business type is required'),
    body('timeframe').notEmpty().withMessage('Timeframe is required')
  ],
  validate,
  registerPartner
);

router.get(
  '/track',
  [
    query('trackingId').notEmpty().withMessage('Tracking ID is required')
  ],
  validate,
  getTrackingInfo
);

// Admin routes
router.use(protect); // Protect all routes below this middleware
router.use(restrictTo('admin')); // Restrict to admin role

// Contact admin routes
router.get('/admin/contacts', getAllContacts);
router.get('/admin/contacts/:id', getContactById);

// Partner admin routes
router.get('/admin/partners', getAllPartners);
router.patch(
  '/admin/partners/:id/status',
  [
    body('status').isIn(['pending', 'approved', 'rejected']).withMessage('Invalid status')
  ],
  validate,
  updatePartnerStatus
);

// Tracking admin routes
router.get('/admin/tracking', getAllTracking);
router.patch(
  '/admin/tracking/:trackingId/status',
  [
    body('status').isIn(['pending', 'in_transit', 'delivered', 'exception']).withMessage('Invalid status'),
    body('location').notEmpty().withMessage('Location is required')
  ],
  validate,
  updateTrackingStatus
);

export default router; 