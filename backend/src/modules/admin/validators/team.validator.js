import { body, param, query } from 'express-validator';

export const teamQueryValidator = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('role').optional().isIn(['Admin', 'Manager', 'Support', 'Agent']).withMessage('Invalid role'),
  query('status').optional().isIn(['Active', 'Inactive', 'On Leave']).withMessage('Invalid status')
];

export const teamIdValidator = [
  param('userId').isMongoId().withMessage('Invalid team member ID')
];

export const updateTeamMemberValidator = [
  ...teamIdValidator,
  body('fullName')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('Full name must be between 2 and 50 characters'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Please provide a valid email address'),
  body('phoneNumber')
    .optional()
    .isLength({ min: 10, max: 15 })
    .withMessage('Phone number must be between 10 and 15 characters'),
  body('role')
    .optional()
    .isIn(['Admin', 'Manager', 'Support', 'Agent'])
    .withMessage('Invalid role'),
  body('status')
    .optional()
    .isIn(['Active', 'Inactive', 'On Leave'])
    .withMessage('Invalid status'),
  body('department')
    .optional()
    .notEmpty()
    .withMessage('Department cannot be empty'),
  body('designation')
    .optional()
    .notEmpty()
    .withMessage('Designation cannot be empty')
];

export const updateStatusValidator = [
  ...teamIdValidator,
  body('status')
    .isIn(['Active', 'Inactive', 'On Leave'])
    .withMessage('Invalid status'),
  body('reason')
    .optional()
    .isString()
    .withMessage('Reason must be a string')
];

export const updatePermissionsValidator = [
  ...teamIdValidator,
  body('permissions')
    .isObject()
    .withMessage('Permissions must be an object'),
  body('permissions.dashboardAccess').optional().isBoolean().withMessage('Value must be boolean'),
  body('permissions.userManagement').optional().isBoolean().withMessage('Value must be boolean'),
  body('permissions.teamManagement').optional().isBoolean().withMessage('Value must be boolean'),
  body('permissions.ordersShipping').optional().isBoolean().withMessage('Value must be boolean'),
  body('permissions.financialOperations').optional().isBoolean().withMessage('Value must be boolean'),
  body('permissions.systemConfig').optional().isBoolean().withMessage('Value must be boolean'),
  body('permissions.sellerManagement').optional().isBoolean().withMessage('Value must be boolean'),
  body('permissions.supportTickets').optional().isBoolean().withMessage('Value must be boolean'),
  body('permissions.reportsAnalytics').optional().isBoolean().withMessage('Value must be boolean'),
  body('permissions.marketingPromotions').optional().isBoolean().withMessage('Value must be boolean')
];

export const uploadDocumentValidator = [
  ...teamIdValidator,
  body('documentType')
    .isIn(['idProof', 'employmentContract'])
    .withMessage('Invalid document type')
]; 