import express from 'express';
import {
  getEmailConfig,
  updateEmailConfig,
  getSMSConfig,
  updateSMSConfig,
  getNotificationSystemConfig,
  updateNotificationSystemConfig,
  sendTestEmail,
  sendTestSMS,
  listEmailTemplates,
  getEmailTemplateById,
  createEmailTemplate,
  updateEmailTemplate,
  deleteEmailTemplate,
  listSMSTemplates,
  getSMSTemplateById,
  createSMSTemplate,
  updateSMSTemplate,
  deleteSMSTemplate
} from '../controllers/notification.controller.js';
import {
  validateEmailConfig,
  validateSMSConfig,
  validateNotificationSystemConfig,
  validateSendTestEmail,
  validateSendTestSMS,
  validateEmailTemplate,
  validateSMSTemplate,
  validateTemplateId
} from '../validators/notification.validator.js';
import { authenticate } from '../../../middleware/auth.js';
import { checkPermission } from '../../../middleware/permission.js';

const router = express.Router();

// Email configuration routes
router.get(
  '/email',
  authenticate,
  checkPermission('settings'),
  getEmailConfig
);

router.put(
  '/email',
  authenticate,
  checkPermission('settings'),
  validateEmailConfig,
  updateEmailConfig
);

router.post(
  '/email/test',
  authenticate,
  checkPermission('settings'),
  validateSendTestEmail,
  sendTestEmail
);

// SMS configuration routes
router.get(
  '/sms',
  authenticate,
  checkPermission('settings'),
  getSMSConfig
);

router.put(
  '/sms',
  authenticate,
  checkPermission('settings'),
  validateSMSConfig,
  updateSMSConfig
);

router.post(
  '/sms/test',
  authenticate,
  checkPermission('settings'),
  validateSendTestSMS,
  sendTestSMS
);

// System notification configuration routes
router.get(
  '/system',
  authenticate,
  checkPermission('settings'),
  getNotificationSystemConfig
);

router.put(
  '/system',
  authenticate,
  checkPermission('settings'),
  validateNotificationSystemConfig,
  updateNotificationSystemConfig
);

// Email template routes
router.get(
  '/email-templates',
  authenticate,
  checkPermission('settings'),
  listEmailTemplates
);

router.get(
  '/email-templates/:id',
  authenticate,
  checkPermission('settings'),
  validateTemplateId,
  getEmailTemplateById
);

router.post(
  '/email-templates',
  authenticate,
  checkPermission('settings'),
  validateEmailTemplate,
  createEmailTemplate
);

router.put(
  '/email-templates/:id',
  authenticate,
  checkPermission('settings'),
  validateTemplateId,
  validateEmailTemplate,
  updateEmailTemplate
);

router.delete(
  '/email-templates/:id',
  authenticate,
  checkPermission('settings'),
  validateTemplateId,
  deleteEmailTemplate
);

// SMS template routes
router.get(
  '/sms-templates',
  authenticate,
  checkPermission('settings'),
  listSMSTemplates
);

router.get(
  '/sms-templates/:id',
  authenticate,
  checkPermission('settings'),
  validateTemplateId,
  getSMSTemplateById
);

router.post(
  '/sms-templates',
  authenticate,
  checkPermission('settings'),
  validateSMSTemplate,
  createSMSTemplate
);

router.put(
  '/sms-templates/:id',
  authenticate,
  checkPermission('settings'),
  validateTemplateId,
  validateSMSTemplate,
  updateSMSTemplate
);

router.delete(
  '/sms-templates/:id',
  authenticate,
  checkPermission('settings'),
  validateTemplateId,
  deleteSMSTemplate
);

export default router; 