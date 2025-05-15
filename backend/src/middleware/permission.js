import { AppError } from './errorHandler.js';

/**
 * Middleware to check if user has required permissions
 * @param {string} permission - The permission to check for
 * @returns {function} - Express middleware function
 */
export const checkPermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('You must be logged in to access this resource', 401));
    }

    // If user is superAdmin, they have all permissions
    if (req.user.role === 'superAdmin') {
      return next();
    }

    // For admin users, check if they have the specific permission
    if (req.user.role === 'admin' && req.user.permissions) {
      if (req.user.permissions.includes(permission) || req.user.permissions.includes('all')) {
        return next();
      }
    }

    // For other roles (like managers), check their specific permissions
    if (req.user.permissions && (req.user.permissions.includes(permission) || req.user.permissions.includes('all'))) {
      return next();
    }

    return next(new AppError('You do not have permission to access this resource', 403));
  };
}; 