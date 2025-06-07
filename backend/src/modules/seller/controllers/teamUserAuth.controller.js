import jwt from 'jsonwebtoken';
import { AppError } from '../../../middleware/errorHandler.js';
import { logger } from '../../../utils/logger.js';
import TeamUser from '../models/teamUser.model.js';

/**
 * Team User Login
 * @route POST /seller/team-users/auth/login
 * @access Public
 */
export const loginTeamUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Input validation
    if (!email || !password) {
      return next(new AppError('Email and password are required', 400));
    }

    // Validate email format
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      return next(new AppError('Please provide a valid email address', 400));
    }

    // Find team user by email and include password
    const teamUser = await TeamUser.findOne({
      email: email.toLowerCase(),
      status: { $ne: 'Suspended' }
    }).select('+password').populate('seller', 'name businessName email');

    if (!teamUser) {
      return next(new AppError('Invalid credentials', 401));
    }

    // Check if team user is active
    if (teamUser.status !== 'Active') {
      return next(new AppError('Your account is not active. Please contact your administrator.', 403));
    }

    // Verify password
    const isPasswordValid = await teamUser.comparePassword(password);
    if (!isPasswordValid) {
      return next(new AppError('Invalid credentials', 401));
    }

    // Check if parent seller exists and is active
    if (!teamUser.seller) {
      return next(new AppError('Parent seller account not found. Please contact support.', 404));
    }

    if (teamUser.seller.status === 'suspended') {
      return next(new AppError('Parent seller account is suspended. Please contact support.', 403));
    }

    // Update last login and last active
    teamUser.lastLogin = new Date();
    teamUser.lastActive = new Date();

    // Generate tokens
    const accessToken = teamUser.generateAuthToken();
    const refreshToken = teamUser.generateRefreshToken();

    // Save refresh token
    teamUser.refreshToken = refreshToken;
    await teamUser.save();

    // Prepare response data
    const responseData = {
      user: {
        id: teamUser._id,
        name: teamUser.name,
        email: teamUser.email,
        phone: teamUser.phone,
        jobRole: teamUser.role,
        status: teamUser.status,
        permissions: teamUser.permissions || [],
        lastLogin: teamUser.lastLogin,
        createdAt: teamUser.createdAt
      },
      seller: {
        id: teamUser.seller._id,
        name: teamUser.seller.name,
        businessName: teamUser.seller.businessName,
        email: teamUser.seller.email
      },
      token: accessToken,
      refreshToken: refreshToken,
      expiresIn: 86400 // 24 hours
    };

    // Log successful login
    logger.info(`Team user login successful: ${teamUser.email} (ID: ${teamUser._id})`);

    res.status(200).json({
      success: true,
      data: responseData,
      message: 'Login successful'
    });

  } catch (error) {
    logger.error('Team user login error:', {
      error: error.message,
      stack: error.stack,
      email: req.body?.email
    });

    if (error.name === 'ValidationError') {
      return next(new AppError('Invalid input data', 400));
    }

    if (error.name === 'CastError') {
      return next(new AppError('Invalid data format', 400));
    }

    next(new AppError('Login failed. Please try again.', 500));
  }
};

/**
 * Refresh Team User Token
 * @route POST /seller/team-users/auth/refresh
 * @access Private
 */
export const refreshTeamUserToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return next(new AppError('Refresh token is required', 400));
    }

    // Verify refresh token
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return next(new AppError('Refresh token has expired. Please log in again.', 401));
      }
      return next(new AppError('Invalid refresh token', 401));
    }

    // Find team user with the refresh token
    const teamUser = await TeamUser.findOne({
      _id: decoded.id,
      refreshToken: refreshToken,
      status: { $ne: 'Suspended' }
    }).populate('seller', 'name businessName status');

    if (!teamUser) {
      return next(new AppError('Invalid refresh token or user not found', 401));
    }

    // Check if team user is still active
    if (teamUser.status !== 'Active') {
      return next(new AppError('Account is not active', 403));
    }

    // Check if parent seller is still active
    if (teamUser.seller.status === 'suspended') {
      return next(new AppError('Parent seller account is suspended', 403));
    }

    // Generate new tokens
    const newAccessToken = teamUser.generateAuthToken();
    const newRefreshToken = teamUser.generateRefreshToken();

    // Update refresh token
    teamUser.refreshToken = newRefreshToken;
    teamUser.lastActive = new Date();
    await teamUser.save();

    res.status(200).json({
      success: true,
      data: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        expiresIn: 86400
      },
      message: 'Token refreshed successfully'
    });

  } catch (error) {
    logger.error('Team user token refresh error:', {
      error: error.message,
      stack: error.stack
    });

    next(new AppError('Token refresh failed. Please log in again.', 500));
  }
};

/**
 * Team User Logout
 * @route POST /seller/team-users/auth/logout
 * @access Private
 */
export const logoutTeamUser = async (req, res, next) => {
  try {
    const teamUserId = req.user?.id;

    if (!teamUserId) {
      return res.status(200).json({
        success: true,
        message: 'Logged out successfully'
      });
    }

    // Find team user and clear refresh token
    const teamUser = await TeamUser.findById(teamUserId);

    if (teamUser) {
      teamUser.refreshToken = undefined;
      await teamUser.save();

      logger.info(`Team user logged out: ${teamUser.email} (ID: ${teamUser._id})`);
    }

    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error) {
    logger.error('Team user logout error:', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id
    });

    // Don't fail logout even if there's an error
    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  }
};

/**
 * Get Team User Profile
 * @route GET /seller/team-users/auth/profile
 * @access Private
 */
export const getTeamUserProfile = async (req, res, next) => {
  try {
    const teamUserId = req.user?.id;

    if (!teamUserId) {
      return next(new AppError('User not found', 404));
    }

    const teamUser = await TeamUser.findById(teamUserId)
      .populate('seller', 'name businessName email')
      .populate('invitedBy', 'name email');

    if (!teamUser) {
      return next(new AppError('Team user not found', 404));
    }

    res.status(200).json({
      success: true,
      data: {
        user: teamUser.toJSON(),
        seller: teamUser.seller
      }
    });

  } catch (error) {
    logger.error('Get team user profile error:', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id
    });

    next(new AppError('Failed to get profile', 500));
  }
};
