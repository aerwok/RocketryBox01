import express from 'express';
import { authenticateTeamUser } from '../../../middleware/auth.js';
import { validationHandler } from '../../../middleware/validator.js';
import {
  getTeamUserProfile,
  loginTeamUser,
  logoutTeamUser,
  refreshTeamUserToken
} from '../controllers/teamUserAuth.controller.js';
import { loginTeamUserSchema } from '../validators/teamUser.validator.js';

const router = express.Router();

// Public routes
router.post('/login', validationHandler(loginTeamUserSchema), loginTeamUser);
router.post('/refresh', refreshTeamUserToken);

// Protected routes (require team user authentication)
router.use(authenticateTeamUser);
router.post('/logout', logoutTeamUser);
router.get('/profile', getTeamUserProfile);

export default router;
