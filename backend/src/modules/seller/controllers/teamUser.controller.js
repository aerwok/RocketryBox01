import { AppError } from '../../../middleware/errorHandler.js';
import { logger } from '../../../utils/logger.js';
import TeamUser from '../models/teamUser.model.js';

// List team users
export const listTeamUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, status, role } = req.query;

    // Validate pagination parameters
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    if (pageNum < 1 || limitNum < 1 || limitNum > 100) {
      return next(new AppError('Invalid pagination parameters', 400));
    }

    const query = { seller: req.user.id };

    // Add filters
    if (status && ['Active', 'Inactive', 'Suspended', 'Pending'].includes(status)) {
      query.status = status;
    }

    if (role && ['Owner', 'Manager', 'Staff'].includes(role)) {
      query.role = role;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (pageNum - 1) * limitNum;

    const [users, total] = await Promise.all([
      TeamUser.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate('invitedBy', 'name email'),
      TeamUser.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      data: {
        users,
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    logger.error('Error in listTeamUsers:', {
      error: error.message,
      stack: error.stack,
      sellerId: req.user?.id
    });
    next(new AppError('Failed to fetch team users', 500));
  }
};

// Add/invite team user
export const addTeamUser = async (req, res, next) => {
  try {
    const { name, email, phone, role, permissions, password } = req.body;

    // Input validation
    if (!name || !email || !password) {
      return next(new AppError('Name, email, and password are required', 400));
    }

    // Check if user with this email already exists for this seller
    const existingUser = await TeamUser.findOne({
      seller: req.user.id,
      email: email.toLowerCase()
    });

    if (existingUser) {
      return next(new AppError('User with this email already exists', 409));
    }

    // Check if email is globally unique
    const globalEmailCheck = await TeamUser.findOne({
      email: email.toLowerCase()
    });

    if (globalEmailCheck) {
      return next(new AppError('This email is already registered with another account', 409));
    }

    // Create team user
    const user = await TeamUser.create({
      seller: req.user.id,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone?.trim(),
      password,
      role: role || 'Staff',
      status: 'Active', // Set to Active by default, can be changed later
      permissions: permissions || {},
      invitedBy: req.user.id
    });

    // Log the creation
    logger.info(`Team user created: ${user.email} by seller ${req.user.id}`);

    res.status(201).json({
      success: true,
      data: user,
      message: 'Team user created successfully'
    });
  } catch (error) {
    logger.error('Error in addTeamUser:', {
      error: error.message,
      stack: error.stack,
      sellerId: req.user?.id,
      email: req.body?.email
    });

    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return next(new AppError(`Validation error: ${validationErrors.join(', ')}`, 400));
    }

    if (error.code === 11000) {
      return next(new AppError('Email already exists', 409));
    }

    next(new AppError('Failed to create team user', 500));
  }
};

// Get team user details
export const getTeamUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return next(new AppError('Invalid team user ID', 400));
    }

    const user = await TeamUser.findOne({
      _id: id,
      seller: req.user.id
    }).populate('invitedBy', 'name email');

    if (!user) {
      return next(new AppError('Team user not found', 404));
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    logger.error('Error in getTeamUser:', {
      error: error.message,
      stack: error.stack,
      sellerId: req.user?.id,
      teamUserId: req.params?.id
    });

    if (error.name === 'CastError') {
      return next(new AppError('Invalid team user ID format', 400));
    }

    next(new AppError('Failed to fetch team user', 500));
  }
};

// Update team user
export const updateTeamUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, phone, role, status, permissions } = req.body;

    // Validate ObjectId
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return next(new AppError('Invalid team user ID', 400));
    }

    const user = await TeamUser.findOne({
      _id: id,
      seller: req.user.id
    });

    if (!user) {
      return next(new AppError('Team user not found', 404));
    }

    // Update fields if provided
    if (name) user.name = name.trim();
    if (phone) user.phone = phone.trim();
    if (role && ['Owner', 'Manager', 'Staff'].includes(role)) {
      user.role = role;
    }
    if (status && ['Active', 'Inactive', 'Suspended', 'Pending'].includes(status)) {
      user.status = status;
    }
    if (permissions) user.permissions = permissions;

    await user.save();

    // Log the update
    logger.info(`Team user updated: ${user.email} by seller ${req.user.id}`);

    res.status(200).json({
      success: true,
      data: user,
      message: 'Team user updated successfully'
    });
  } catch (error) {
    logger.error('Error in updateTeamUser:', {
      error: error.message,
      stack: error.stack,
      sellerId: req.user?.id,
      teamUserId: req.params?.id
    });

    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return next(new AppError(`Validation error: ${validationErrors.join(', ')}`, 400));
    }

    if (error.name === 'CastError') {
      return next(new AppError('Invalid team user ID format', 400));
    }

    next(new AppError('Failed to update team user', 500));
  }
};

// Delete team user
export const deleteTeamUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return next(new AppError('Invalid team user ID', 400));
    }

    const user = await TeamUser.findOneAndDelete({
      _id: id,
      seller: req.user.id
    });

    if (!user) {
      return next(new AppError('Team user not found', 404));
    }

    // Log the deletion
    logger.info(`Team user deleted: ${user.email} by seller ${req.user.id}`);

    res.status(200).json({
      success: true,
      data: { message: 'Team user deleted successfully' }
    });
  } catch (error) {
    logger.error('Error in deleteTeamUser:', {
      error: error.message,
      stack: error.stack,
      sellerId: req.user?.id,
      teamUserId: req.params?.id
    });

    if (error.name === 'CastError') {
      return next(new AppError('Invalid team user ID format', 400));
    }

    next(new AppError('Failed to delete team user', 500));
  }
};

// Update team user permissions
export const updateTeamUserPermissions = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { permissions } = req.body;

    // Validate ObjectId
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return next(new AppError('Invalid team user ID', 400));
    }

    if (!permissions || typeof permissions !== 'object') {
      return next(new AppError('Valid permissions object is required', 400));
    }

    const user = await TeamUser.findOne({
      _id: id,
      seller: req.user.id
    });

    if (!user) {
      return next(new AppError('Team user not found', 404));
    }

    user.permissions = permissions;
    await user.save();

    // Log the permission update
    logger.info(`Team user permissions updated: ${user.email} by seller ${req.user.id}`);

    res.status(200).json({
      success: true,
      data: user,
      message: 'Permissions updated successfully'
    });
  } catch (error) {
    logger.error('Error in updateTeamUserPermissions:', {
      error: error.message,
      stack: error.stack,
      sellerId: req.user?.id,
      teamUserId: req.params?.id
    });

    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return next(new AppError(`Validation error: ${validationErrors.join(', ')}`, 400));
    }

    if (error.name === 'CastError') {
      return next(new AppError('Invalid team user ID format', 400));
    }

    next(new AppError('Failed to update permissions', 500));
  }
};
