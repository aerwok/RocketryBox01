import jwt from 'jsonwebtoken';
import { AppError } from '../../../middleware/errorHandler.js';
import { logger } from '../../../utils/logger.js';
import Admin from '../models/admin.model.js';
import Session from '../models/session.model.js';
import { setSession, deleteSession, getAllSessions } from '../../../utils/redis.js';

/**
 * Generate JWT token for admin
 * @param {object} admin - Admin user object
 */
const generateToken = (admin) => {
  return jwt.sign(
    { 
      id: admin._id,
      role: admin.role,
      isSuperAdmin: admin.isSuperAdmin
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
  );
};

/**
 * Admin login
 * @route POST /api/v2/admin/auth/login
 * @access Public
 */
export const login = async (req, res, next) => {
  try {
    const { email, password, rememberMe = false } = req.body;

    // 1) Check if email and password exist
    if (!email || !password) {
      return next(new AppError('Please provide email and password', 400));
    }

    // 2) Check if admin exists && password is correct
    const admin = await Admin.findOne({ email }).select('+password');
    
    if (!admin || !(await admin.isPasswordCorrect(password))) {
      return next(new AppError('Incorrect email or password', 401));
    }

    // 3) Check if admin is active
    if (admin.status !== 'Active') {
      return next(new AppError('Your account is not active. Please contact a super admin.', 403));
    }

    // 4) Update last login info
    admin.lastLoginAt = new Date();
    admin.lastLoginIP = req.ip;
    await admin.save({ validateBeforeSave: false });

    // 5) Generate JWT token
    const token = generateToken(admin);
    
    // 6) Get device info from user agent
    const userAgent = req.headers['user-agent'];
    const deviceInfo = {
      deviceType: 'Unknown',
      os: 'Unknown',
      browser: userAgent || 'Unknown',
    };

    // 7) Create session expiry time (default: 1 hour, remember me: 7 days)
    const expiresIn = rememberMe ? 7 * 24 * 60 * 60 * 1000 : 60 * 60 * 1000; // 7 days or 1 hour
    const expiresAt = new Date(Date.now() + expiresIn);

    // 8) Create session in database
    const session = await Session.create({
      adminId: admin._id,
      token,
      deviceInfo,
      ipAddress: req.ip,
      isActive: true,
      expiresAt
    });

    // 9) Store session in Redis for fast access
    await setSession(admin._id.toString(), {
      sessionId: session._id.toString(),
      user: {
        id: admin._id,
        name: admin.fullName,
        email: admin.email,
        role: admin.role,
        isSuperAdmin: admin.isSuperAdmin,
        permissions: admin.permissions
      },
      lastActivity: Date.now()
    }, expiresIn / 1000); // Redis expiry in seconds

    // 10) Remove password from output
    admin.password = undefined;

    logger.info(`Admin ${admin._id} logged in successfully`);

    // 11) Send response
    res.status(200).json({
      success: true,
      data: {
        token,
        user: {
          id: admin._id,
          name: admin.fullName,
          email: admin.email,
          role: admin.role,
          department: admin.department,
          isSuperAdmin: admin.isSuperAdmin,
          permissions: admin.permissions
        }
      }
    });
  } catch (error) {
    logger.error(`Login error: ${error.message}`);
    next(new AppError('Failed to login', 500));
  }
};

/**
 * Register a new admin
 * @route POST /api/v2/admin/auth/register
 * @access Private (Super Admin only)
 */
export const register = async (req, res, next) => {
  try {
    const {
      fullName,
      email,
      role,
      department,
      phoneNumber,
      address,
      dateOfJoining,
      employeeId,
      isSuperAdmin,
      remarks,
      password,
      confirmPassword,
      // Profile image will be handled separately with file upload
    } = req.body;

    // 1) Check if passwords match
    if (password !== confirmPassword) {
      return next(new AppError('Passwords do not match', 400));
    }

    // 2) Check if email already exists
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return next(new AppError('Email already in use', 400));
    }

    // 3) Check if employee ID already exists
    if (employeeId) {
      const existingEmployeeId = await Admin.findOne({ employeeId });
      if (existingEmployeeId) {
        return next(new AppError('Employee ID already in use', 400));
      }
    }

    // 4) Create new admin
    const newAdmin = await Admin.create({
      fullName,
      email,
      role,
      department,
      phoneNumber,
      address,
      dateOfJoining: dateOfJoining || Date.now(),
      employeeId,
      isSuperAdmin: isSuperAdmin || false,
      status: 'Active',
      remarks,
      password,
      // If profile image was uploaded, it would be added here
      profileImage: req.file?.path || null,
    });

    // 5) Remove password from response
    newAdmin.password = undefined;

    logger.info(`New admin ${newAdmin._id} created by admin ${req.user?.id}`);

    // 6) Send response
    res.status(201).json({
      success: true,
      data: {
        id: newAdmin._id,
        name: newAdmin.fullName,
        email: newAdmin.email,
        role: newAdmin.role,
        department: newAdmin.department,
        isSuperAdmin: newAdmin.isSuperAdmin,
        createdAt: newAdmin.createdAt
      }
    });
  } catch (error) {
    logger.error(`Register error: ${error.message}`);
    next(new AppError('Failed to register admin', 500));
  }
};

/**
 * Get current admin's profile
 * @route GET /api/v2/admin/auth/profile
 * @access Private
 */
export const getProfile = async (req, res, next) => {
  try {
    const admin = await Admin.findById(req.user.id);
    
    if (!admin) {
      return next(new AppError('Admin not found', 404));
    }

    res.status(200).json({
      success: true,
      data: admin
    });
  } catch (error) {
    logger.error(`Get profile error: ${error.message}`);
    next(new AppError('Failed to get profile', 500));
  }
};

/**
 * Logout admin
 * @route POST /api/v2/admin/auth/logout
 * @access Private
 */
export const logout = async (req, res, next) => {
  try {
    // 1) Get token from header
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return next(new AppError('Not logged in', 401));
    }

    // 2) Find and update session in database
    const session = await Session.findOne({ token, isActive: true });
    
    if (session) {
      session.isActive = false;
      await session.save();
    }

    // 3) Remove session from Redis
    await deleteSession(req.user.id);

    logger.info(`Admin ${req.user.id} logged out successfully`);

    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    logger.error(`Logout error: ${error.message}`);
    next(new AppError('Failed to logout', 500));
  }
};

/**
 * Get all active sessions for current admin
 * @route GET /api/v2/admin/auth/sessions
 * @access Private
 */
export const getSessions = async (req, res, next) => {
  try {
    const sessions = await Session.find({ 
      adminId: req.user.id,
      isActive: true,
      expiresAt: { $gt: new Date() }
    });

    res.status(200).json({
      success: true,
      data: sessions.map(session => ({
        id: session._id,
        deviceInfo: session.deviceInfo,
        lastActive: session.lastActive,
        ipAddress: session.ipAddress,
        createdAt: session.createdAt
      }))
    });
  } catch (error) {
    logger.error(`Get sessions error: ${error.message}`);
    next(new AppError('Failed to get sessions', 500));
  }
};

/**
 * Revoke a specific session
 * @route DELETE /api/v2/admin/auth/sessions/:sessionId
 * @access Private
 */
export const revokeSession = async (req, res, next) => {
  try {
    const { sessionId } = req.params;

    const session = await Session.findOne({ 
      _id: sessionId,
      adminId: req.user.id
    });
    
    if (!session) {
      return next(new AppError('Session not found', 404));
    }

    // Update session in database
    session.isActive = false;
    await session.save();

    // If the revoked session is the current one, also remove from Redis
    const token = req.headers.authorization?.split(' ')[1];
    if (session.token === token) {
      await deleteSession(req.user.id);
    }

    logger.info(`Admin ${req.user.id} revoked session ${sessionId}`);

    res.status(200).json({
      success: true,
      message: 'Session revoked successfully'
    });
  } catch (error) {
    logger.error(`Revoke session error: ${error.message}`);
    next(new AppError('Failed to revoke session', 500));
  }
};

/**
 * Revoke all sessions for current admin except the current one
 * @route DELETE /api/v2/admin/auth/sessions
 * @access Private
 */
export const revokeAllSessions = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    // Update all sessions except current one in database
    await Session.updateMany(
      { 
        adminId: req.user.id,
        isActive: true,
        token: { $ne: token }
      },
      { isActive: false }
    );

    logger.info(`Admin ${req.user.id} revoked all other sessions`);

    res.status(200).json({
      success: true,
      message: 'All other sessions revoked successfully'
    });
  } catch (error) {
    logger.error(`Revoke all sessions error: ${error.message}`);
    next(new AppError('Failed to revoke sessions', 500));
  }
}; 