import express from 'express';
import { authenticateSeller } from '../../../middleware/auth.js';
import { validationHandler } from '../../../middleware/validator.js';
import {
  addTeamUser,
  deleteTeamUser,
  getTeamUser,
  listTeamUsers,
  updateTeamUser,
  updateTeamUserPermissions
} from '../controllers/teamUser.controller.js';
import {
  addTeamUserSchema,
  updatePermissionsSchema,
  updateTeamUserSchema
} from '../validators/teamUser.validator.js';

// Import auth routes
import teamUserAuthRoutes from './teamUserAuth.routes.js';

const router = express.Router();

// Auth routes (public and protected)
router.use('/auth', teamUserAuthRoutes);

// All other routes require seller authentication
router.use(authenticateSeller);

// List team users with filters and pagination
router.get('/', listTeamUsers);

// Add new team user
router.post('/', validationHandler(addTeamUserSchema), addTeamUser);

// Get team user details
router.get('/:id', getTeamUser);

// Update team user
router.put('/:id', validationHandler(updateTeamUserSchema), updateTeamUser);

// Delete team user
router.delete('/:id', deleteTeamUser);

// Update team user permissions
router.patch('/:id/permissions', validationHandler(updatePermissionsSchema), updateTeamUserPermissions);

export default router;
