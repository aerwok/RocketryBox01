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
    if (req.user.isSuperAdmin === true) {
      return next();
    }

    // Ensure permissions is an array
    const userPermissions = Array.isArray(req.user.permissions) ? req.user.permissions : [];

    // For admin users, check if they have the specific permission
    if ((req.user.role === 'Admin' || req.user.role === 'Manager') && userPermissions.length > 0) {
      if (userPermissions.includes(permission) || userPermissions.includes('all')) {
        return next();
      }
    }

    // For other roles, check their specific permissions
    if (userPermissions.length > 0 && (userPermissions.includes(permission) || userPermissions.includes('all'))) {
      return next();
    }

    return next(new AppError('You do not have permission to access this resource', 403));
  };
}; 