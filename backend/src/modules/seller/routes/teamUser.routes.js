import express from 'express';
import { sellerAuth } from '../../../middleware/auth.js';
import { validate } from '../../../middleware/validate.js';
import {
  addTeamUserSchema,
  updateTeamUserSchema,
  updatePermissionsSchema
} from '../validators/teamUser.validator.js';
import {
  listTeamUsers,
  addTeamUser,
  getTeamUser,
  updateTeamUser,
  deleteTeamUser,
  updateTeamUserPermissions
} from '../controllers/teamUser.controller.js';

const router = express.Router();

// All routes require seller authentication
router.use(sellerAuth);

// List team users with filters and pagination
router.get('/', listTeamUsers);

// Add new team user
router.post('/', validate(addTeamUserSchema), addTeamUser);

// Get team user details
router.get('/:id', getTeamUser);

// Update team user
router.put('/:id', validate(updateTeamUserSchema), updateTeamUser);

// Delete team user
router.delete('/:id', deleteTeamUser);

// Update team user permissions
router.patch('/:id/permissions', validate(updatePermissionsSchema), updateTeamUserPermissions);

export default router; 