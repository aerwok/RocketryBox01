import jwt from 'jsonwebtoken';
import Seller from '../modules/seller/models/seller.model.js';
import TeamUser from '../modules/seller/models/teamUser.model.js';
import { logger } from '../utils/logger.js';
import { getSession, setSession } from '../utils/redis.js';
import { AppError } from './errorHandler.js';

const isDev = process.env.NODE_ENV === 'development';

export const protect = async (req, res, next) => {
  try {
    // 1) Get token from header or cookie
    let token;
    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.auth_token) {
      // Check for token in cookies
      token = req.cookies.auth_token;
    }

    if (!token) {
      return next(new AppError('You are not logged in! Please log in to get access.', 401));
    }

    // 2) Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3) Check session in Redis (skip in dev mode if Redis fails)
    try {
      const session = await getSession(decoded.id);
      if (!session && !isDev) {
        return next(new AppError('Your session has expired. Please log in again.', 401));
      }

      // 4) Extend session if needed
      if (session) {
        let sessionData;
        try {
          // Handle both string and object session data
          sessionData = typeof session === 'string' ? JSON.parse(session) : session;
        } catch (parseError) {
          // If parsing fails, treat as expired session
          return next(new AppError('Your session has expired. Please log in again.', 401));
        }

        if (sessionData.lastActivity < Date.now() - (30 * 60 * 1000)) { // 30 minutes
          await setSession(decoded.id, JSON.stringify({
            ...sessionData,
            lastActivity: Date.now()
          }));
        }

        // 5) Add user info to request
        req.user = {
          ...decoded,
          ...sessionData.user
        };
      } else if (isDev) {
        // In development, if Redis fails, just use the token data
        logger.warn('Redis session check skipped in development mode');
        req.user = decoded;
      }
    } catch (redisError) {
      if (isDev) {
        // In development, if Redis fails, just use the token data
        logger.warn('Redis error in development mode:', redisError.message);
        req.user = decoded;
      } else {
        throw redisError;
      }
    }

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return next(new AppError('Invalid token. Please log in again!', 401));
    }
    next(error);
  }
};

export const restrictTo = (...roles) => {
  return (req, res, next) => {
    // Convert both the user's role and the allowed roles to lowercase for case-insensitive comparison
    const userRole = req.user.role?.toLowerCase?.()?.trim?.();
    const allowedRoles = roles.map(role => role.toLowerCase());

    // Debug logging for super admin access issues
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 RestrictTo Debug:', {
        userRole,
        allowedRoles,
        isSuperAdmin: req.user.isSuperAdmin,
        originalRole: req.user.role
      });
    }

    // Allow super admin to bypass role checks - check multiple variants
    const isSuperAdmin = req.user.isSuperAdmin === true ||
      userRole === 'super admin' ||
      userRole === 'superadmin' ||
      userRole === 'super_admin' ||
      req.user.role === 'Super Admin';

    if (isSuperAdmin) {
      console.log('✅ Super admin access granted');
      return next();
    }

    if (!userRole || !allowedRoles.includes(userRole)) {
      console.error('❌ Access denied:', {
        userRole,
        allowedRoles,
        user: req.user
      });
      return next(new AppError('You do not have permission to perform this action', 403));
    }
    next();
  };
};

// Middleware to authenticate seller
export const authenticateSeller = async (req, res, next) => {
  try {
    // 1) Get token from header
    let token;
    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new AppError('You are not logged in! Please log in to get access.', 401));
    }

    // 2) Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return next(new AppError('Your token has expired! Please log in again.', 401));
      } else if (jwtError.name === 'JsonWebTokenError') {
        return next(new AppError('Invalid token. Please log in again!', 401));
      } else {
        logger.error('JWT verification error in authenticateSeller:', jwtError);
        return next(new AppError('Authentication failed. Please try again.', 500));
      }
    }

    // 3) Check if user is a seller
    if (decoded.role !== 'seller') {
      return next(new AppError('You do not have permission to access this route', 403));
    }

    // 4) Fetch current seller data from database
    try {
      const seller = await Seller.findById(decoded.id);
      if (!seller) {
        return next(new AppError('Seller not found. Please log in again.', 401));
      }

      // 5) Check if seller is active
      if (seller.status === 'suspended') {
        return next(new AppError('Your account has been suspended. Please contact support.', 403));
      }

      // 6) Update last active time
      seller.lastActive = new Date();
      await seller.save();

      // 7) Add complete seller data to request
      req.user = {
        id: seller._id,
        email: seller.email,
        role: 'seller',
        businessName: seller.businessName,
        companyCategory: seller.companyCategory,
        phone: seller.phone,
        address: seller.address,
        status: seller.status,
        documents: seller.documents,
        bankDetails: seller.bankDetails,
        // Add any other fields needed for middleware checks
        ...seller.toObject()
      };

      next();
    } catch (dbError) {
      logger.error('Database error in authenticateSeller:', dbError);
      return next(new AppError('Authentication failed. Please try again.', 500));
    }

  } catch (error) {
    logger.error('Error in authenticateSeller:', error);
    return next(new AppError('Authentication failed. Please try again.', 500));
  }
};

// Middleware to authenticate team user
export const authenticateTeamUser = async (req, res, next) => {
  try {
    // 1) Get token from header
    let token;
    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new AppError('You are not logged in! Please log in to get access.', 401));
    }

    // 2) Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return next(new AppError('Your token has expired! Please log in again.', 401));
      } else if (jwtError.name === 'JsonWebTokenError') {
        return next(new AppError('Invalid token. Please log in again!', 401));
      } else {
        logger.error('JWT verification error in authenticateTeamUser:', jwtError);
        return next(new AppError('Authentication failed. Please try again.', 500));
      }
    }

    // 3) Check if user is a team member
    if (decoded.role !== 'team_member') {
      return next(new AppError('You do not have permission to access this route', 403));
    }

    // 4) Fetch current team user data from database
    try {
      const teamUser = await TeamUser.findById(decoded.id).populate('seller', 'name businessName status');
      if (!teamUser) {
        return next(new AppError('Team user not found. Please log in again.', 401));
      }

      // 5) Check if team user is active
      if (teamUser.status === 'Suspended') {
        return next(new AppError('Your account has been suspended. Please contact your administrator.', 403));
      }

      if (teamUser.status !== 'Active') {
        return next(new AppError('Your account is not active. Please contact your administrator.', 403));
      }

      // 6) Check if parent seller is active
      if (!teamUser.seller) {
        return next(new AppError('Parent seller account not found. Please contact support.', 404));
      }

      if (teamUser.seller.status === 'suspended') {
        return next(new AppError('Parent seller account is suspended. Please contact support.', 403));
      }

      // 7) Update last active time
      teamUser.lastActive = new Date();
      await teamUser.save();

      // 8) Add complete team user data to request
      req.user = {
        id: teamUser._id,
        email: teamUser.email,
        role: 'team_member',
        name: teamUser.name,
        phone: teamUser.phone,
        status: teamUser.status,
        permissions: teamUser.permissions,
        sellerId: teamUser.seller._id,
        sellerName: teamUser.seller.name,
        businessName: teamUser.seller.businessName,
        // Add any other fields needed for middleware checks
        ...teamUser.toObject()
      };

      next();
    } catch (dbError) {
      logger.error('Database error in authenticateTeamUser:', dbError);
      return next(new AppError('Authentication failed. Please try again.', 500));
    }

  } catch (error) {
    logger.error('Error in authenticateTeamUser:', error);
    return next(new AppError('Authentication failed. Please try again.', 500));
  }
};

// Middleware to authenticate admin
export const authenticateAdmin = async (req, res, next) => {
  try {
    // 1) Get token from header
    let token;
    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new AppError('You are not logged in! Please log in to get access.', 401));
    }

    // 2) Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return next(new AppError('Your token has expired! Please log in again.', 401));
      } else if (jwtError.name === 'JsonWebTokenError') {
        return next(new AppError('Invalid token. Please log in again!', 401));
      } else {
        logger.error('JWT verification error in authenticateAdmin:', jwtError);
        return next(new AppError('Authentication failed. Please try again.', 500));
      }
    }

    // 3) Check if user is an admin
    if (decoded.role !== 'Admin' && decoded.role !== 'Manager') {
      return next(new AppError('You do not have permission to access this route', 403));
    }

    // 4) Check session in Redis (skip in dev mode if Redis fails)
    try {
      const session = await getSession(decoded.id);
      if (!session && !isDev) {
        return next(new AppError('Your session has expired. Please log in again.', 401));
      }

      // 5) Extend session if needed
      if (session) {
        let sessionData;
        try {
          // Handle both string and object session data
          sessionData = typeof session === 'string' ? JSON.parse(session) : session;
        } catch (parseError) {
          // If parsing fails, treat as expired session
          return next(new AppError('Your session has expired. Please log in again.', 401));
        }

        if (sessionData.lastActivity < Date.now() - (30 * 60 * 1000)) { // 30 minutes
          await setSession(decoded.id, JSON.stringify({
            ...sessionData,
            lastActivity: Date.now()
          }));
        }

        // 6) Add user info to request
        req.user = {
          ...decoded,
          ...sessionData.user
        };
      } else if (isDev) {
        // In development, if Redis fails, just use the token data
        logger.warn('Redis session check skipped in development mode');
        req.user = decoded;
      }
    } catch (redisError) {
      if (isDev) {
        // In development, if Redis fails, just use the token data
        logger.warn('Redis error in development mode:', redisError.message);
        req.user = decoded;
      } else {
        throw redisError;
      }
    }

    next();
  } catch (error) {
    logger.error('Error in authenticateAdmin:', error);
    return next(new AppError('Authentication failed. Please try again.', 500));
  }
};

// Middleware to authenticate either seller or team user
export const authenticateUser = async (req, res, next) => {
  try {
    // 1) Get token from header
    let token;
    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new AppError('You are not logged in! Please log in to get access.', 401));
    }

    // 2) Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return next(new AppError('Your token has expired! Please log in again.', 401));
      } else if (jwtError.name === 'JsonWebTokenError') {
        return next(new AppError('Invalid token. Please log in again!', 401));
      } else {
        logger.error('JWT verification error in authenticateUser:', jwtError);
        return next(new AppError('Authentication failed. Please try again.', 500));
      }
    }

    // 3) Route to appropriate authentication based on role
    if (decoded.role === 'seller') {
      return authenticateSeller(req, res, next);
    } else if (decoded.role === 'team_member') {
      return authenticateTeamUser(req, res, next);
    } else {
      return next(new AppError('Invalid user role', 403));
    }

  } catch (error) {
    logger.error('Error in authenticateUser:', error);
    return next(new AppError('Authentication failed. Please try again.', 500));
  }
};

// Alias for protect function to match expected import
export const authenticateToken = protect;
