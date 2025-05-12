import TeamUser from '../models/teamUser.model.js';
import { AppError } from '../../../middleware/errorHandler.js';

// List team users
export const listTeamUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, status, role } = req.query;
    const query = { seller: req.user.id };
    if (status) query.status = status;
    if (role) query.role = role;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [users, total] = await Promise.all([
      TeamUser.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      TeamUser.countDocuments(query)
    ]);
    res.status(200).json({
      success: true,
      data: {
        users,
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

// Add/invite team user
export const addTeamUser = async (req, res, next) => {
  try {
    const { name, email, phone, role, permissions } = req.body;
    const exists = await TeamUser.findOne({ seller: req.user.id, email });
    if (exists) throw new AppError('User with this email already exists', 409);
    const user = await TeamUser.create({
      seller: req.user.id,
      name,
      email,
      phone,
      role: role || 'Staff',
      status: 'Pending',
      permissions: permissions || {},
      invitedBy: req.user.id
    });
    // TODO: Send invitation email here
    res.status(201).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

// Get team user details
export const getTeamUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await TeamUser.findOne({ _id: id, seller: req.user.id });
    if (!user) throw new AppError('Team user not found', 404);
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

// Update team user
export const updateTeamUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, phone, role, status, permissions } = req.body;
    const user = await TeamUser.findOne({ _id: id, seller: req.user.id });
    if (!user) throw new AppError('Team user not found', 404);
    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (role) user.role = role;
    if (status) user.status = status;
    if (permissions) user.permissions = permissions;
    await user.save();
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

// Delete team user
export const deleteTeamUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await TeamUser.findOneAndDelete({ _id: id, seller: req.user.id });
    if (!user) throw new AppError('Team user not found', 404);
    res.status(200).json({ success: true, data: { message: 'Team user deleted' } });
  } catch (error) {
    next(error);
  }
};

// Update team user permissions
export const updateTeamUserPermissions = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { permissions } = req.body;
    const user = await TeamUser.findOne({ _id: id, seller: req.user.id });
    if (!user) throw new AppError('Team user not found', 404);
    user.permissions = permissions;
    await user.save();
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
}; 