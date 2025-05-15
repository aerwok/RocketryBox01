import { AppError } from '../../../middleware/errorHandler.js';
import { logger } from '../../../utils/logger.js';
import Admin from '../models/admin.model.js';
import { uploadToS3 } from '../../../utils/fileUpload.js';
import { generateOTP, verifyOTP, storeOTP } from '../../../utils/otp.js';
import { sendEmail } from '../../../utils/email.js';
import { sendSMS } from '../../../utils/sms.js';
import Session from '../models/session.model.js';

/**
 * Get all team members with pagination and filters
 * @route GET /api/v2/admin/team
 * @access Private (Admin only)
 */
export const getAllTeamMembers = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      role,
      status,
      department,
      sortField = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build query
    const query = {};

    // Add filters if provided
    if (role) query.role = role;
    if (status) query.status = status;
    if (department) query.department = department;

    // Add search filter if provided
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phoneNumber: { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } }
      ];
    }

    // Sorting
    const sortDirection = sortOrder === 'desc' ? -1 : 1;
    const sortOptions = { [sortField]: sortDirection };

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const countPromise = Admin.countDocuments(query);
    const teamsPromise = Admin.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit))
      .select('-password');

    // Execute both promises simultaneously
    const [total, teamMembers] = await Promise.all([countPromise, teamsPromise]);

    // Create pagination metadata
    const pagination = {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / parseInt(limit))
    };

    res.status(200).json({
      success: true,
      data: teamMembers,
      pagination
    });
  } catch (error) {
    logger.error(`Error in getAllTeamMembers: ${error.message}`);
    next(new AppError('Failed to fetch team members', 500));
  }
};

/**
 * Get team member details by ID
 * @route GET /api/v2/admin/team/:userId
 * @access Private (Admin only)
 */
export const getTeamMemberDetails = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const teamMember = await Admin.findById(userId).select('-password');

    if (!teamMember) {
      return next(new AppError('Team member not found', 404));
    }

    res.status(200).json({
      success: true,
      data: teamMember
    });
  } catch (error) {
    logger.error(`Error in getTeamMemberDetails: ${error.message}`);
    next(new AppError('Failed to fetch team member details', 500));
  }
};

/**
 * Get detailed admin profile with activity history
 * @route GET /api/v2/admin/team/:userId/profile
 * @access Private (Admin only)
 */
export const getTeamMemberProfile = async (req, res, next) => {
  try {
    const { userId } = req.params;

    // Find team member with populated references
    const teamMember = await Admin.findById(userId)
      .select('-password')
      .populate({
        path: 'statusHistory.updatedBy',
        select: 'fullName email role'
      })
      .populate({
        path: 'permissionHistory.updatedBy',
        select: 'fullName email role'
      });

    if (!teamMember) {
      return next(new AppError('Team member not found', 404));
    }

    // Get recent login sessions
    const sessions = await Session.find({ 
      adminId: userId,
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('deviceInfo ipAddress createdAt lastActive isActive');

    // Get recent actions from logs (would need a proper audit log system)
    // This is a placeholder - in a real system, you would query your audit logs
    // const recentActions = await AuditLog.find({ adminId: userId })
    //   .sort({ timestamp: -1 })
    //   .limit(20);

    const profile = {
      basicInfo: {
        id: teamMember._id,
        fullName: teamMember.fullName,
        email: teamMember.email,
        phoneNumber: teamMember.phoneNumber,
        role: teamMember.role,
        department: teamMember.department,
        designation: teamMember.designation,
        status: teamMember.status,
        isSuperAdmin: teamMember.isSuperAdmin,
        employeeId: teamMember.employeeId,
        dateOfJoining: teamMember.dateOfJoining,
        createdAt: teamMember.createdAt
      },
      permissions: teamMember.permissions,
      history: {
        status: teamMember.statusHistory || [],
        permissions: teamMember.permissionHistory || []
      },
      sessions: sessions,
      // recentActions: recentActions || []
    };

    res.status(200).json({
      success: true,
      data: profile
    });
  } catch (error) {
    logger.error(`Error in getTeamMemberProfile: ${error.message}`);
    next(new AppError('Failed to fetch team member profile', 500));
  }
};

/**
 * Update team member
 * @route PATCH /api/v2/admin/team/:userId
 * @access Private (Admin only)
 */
export const updateTeamMember = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const {
      fullName,
      employeeId,
      email,
      phoneNumber,
      address,
      role,
      status,
      remarks,
      department,
      designation
    } = req.body;

    // Find team member
    const teamMember = await Admin.findById(userId);

    if (!teamMember) {
      return next(new AppError('Team member not found', 404));
    }

    // Check if email is being changed and already exists
    if (email && email !== teamMember.email) {
      const existingEmail = await Admin.findOne({ email });
      if (existingEmail) {
        return next(new AppError('Email already in use', 400));
      }
    }

    // Check if employeeId is being changed and already exists
    if (employeeId && employeeId !== teamMember.employeeId) {
      const existingEmployeeId = await Admin.findOne({ employeeId });
      if (existingEmployeeId) {
        return next(new AppError('Employee ID already in use', 400));
      }
    }

    // Update fields
    if (fullName) teamMember.fullName = fullName;
    if (employeeId) teamMember.employeeId = employeeId;
    if (email) teamMember.email = email;
    if (phoneNumber) teamMember.phoneNumber = phoneNumber;
    if (address) teamMember.address = address;
    if (role) teamMember.role = role;
    if (status) teamMember.status = status;
    if (remarks) teamMember.remarks = remarks;
    if (department) teamMember.department = department;
    if (designation) teamMember.designation = designation;

    // Save updated team member
    await teamMember.save();

    // Log the update
    logger.info(`Admin ${req.user.id} updated team member ${userId}`);

    res.status(200).json({
      success: true,
      data: teamMember,
      message: 'Team member updated successfully'
    });
  } catch (error) {
    logger.error(`Error in updateTeamMember: ${error.message}`);
    next(new AppError('Failed to update team member', 500));
  }
};

/**
 * Update team member status
 * @route PATCH /api/v2/admin/team/:userId/status
 * @access Private (Admin only)
 */
export const updateTeamMemberStatus = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { status, reason } = req.body;

    if (!['Active', 'Inactive', 'On Leave'].includes(status)) {
      return next(new AppError('Invalid status', 400));
    }

    const teamMember = await Admin.findById(userId);

    if (!teamMember) {
      return next(new AppError('Team member not found', 404));
    }

    // Update status
    teamMember.status = status;

    // Add status change to history (if model has this field)
    if (teamMember.statusHistory) {
      teamMember.statusHistory.push({
        status,
        reason,
        updatedBy: req.user.id,
        timestamp: new Date()
      });
    }

    await teamMember.save();

    // Log the status update
    logger.info(`Admin ${req.user.id} updated team member ${userId} status to ${status}`);

    res.status(200).json({
      success: true,
      data: {
        userId,
        status,
        message: 'Team member status updated successfully'
      }
    });
  } catch (error) {
    logger.error(`Error in updateTeamMemberStatus: ${error.message}`);
    next(new AppError('Failed to update team member status', 500));
  }
};

/**
 * Update team member permissions
 * @route PATCH /api/v2/admin/team/:userId/permissions
 * @access Private (Admin only)
 */
export const updateTeamMemberPermissions = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { permissions } = req.body;

    // Validate permissions object
    if (!permissions || typeof permissions !== 'object') {
      return next(new AppError('Invalid permissions format', 400));
    }

    // Find team member
    const teamMember = await Admin.findById(userId);

    if (!teamMember) {
      return next(new AppError('Team member not found', 404));
    }

    // Only super admins can modify other super admin permissions
    if (teamMember.isSuperAdmin && !req.user.isSuperAdmin) {
      return next(new AppError('You do not have permission to modify a super admin\'s permissions', 403));
    }

    // Check if the user is trying to modify their own permissions
    if (userId === req.user.id && !req.user.isSuperAdmin) {
      return next(new AppError('You cannot modify your own permissions', 403));
    }

    // Get previous permissions for audit log
    const previousPermissions = { ...teamMember.permissions };
    
    // Track which permissions were changed
    const changedPermissions = {};
    
    // Define valid sections
    const validSections = [
      'dashboardAccess',
      'userManagement',
      'teamManagement',
      'ordersShipping',
      'financialOperations',
      'systemConfig',
      'sellerManagement',
      'supportTickets',
      'reportsAnalytics',
      'marketingPromotions'
    ];
    
    // Update permissions with validation
    validSections.forEach(section => {
      if (permissions.hasOwnProperty(section) && typeof permissions[section] === 'boolean') {
        // If the permission has changed, record it
        if (teamMember.permissions[section] !== permissions[section]) {
          changedPermissions[section] = {
            from: teamMember.permissions[section],
            to: permissions[section]
          };
        }
        teamMember.permissions[section] = permissions[section];
      }
    });
    
    // Create permission change history entry
    if (!teamMember.permissionHistory) {
      teamMember.permissionHistory = [];
    }
    
    // Only add history entry if permissions were actually changed
    if (Object.keys(changedPermissions).length > 0) {
      teamMember.permissionHistory.push({
        updatedBy: req.user.id,
        timestamp: new Date(),
        changes: changedPermissions,
        reason: req.body.reason || 'Permission update'
      });
    }

    // Save updated team member
    await teamMember.save();

    // Log the permissions update
    logger.info(`Admin ${req.user.id} updated permissions for team member ${userId}`, {
      changes: changedPermissions,
      reason: req.body.reason || 'Permission update'
    });

    res.status(200).json({
      success: true,
      data: teamMember.permissions,
      message: 'Team member permissions updated successfully'
    });
  } catch (error) {
    logger.error(`Error in updateTeamMemberPermissions: ${error.message}`);
    next(new AppError('Failed to update team member permissions', 500));
  }
};

/**
 * Upload team member documents
 * @route POST /api/v2/admin/team/:userId/documents
 * @access Private (Admin only)
 */
export const uploadTeamMemberDocuments = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { documentType } = req.body;

    if (!req.file) {
      return next(new AppError('No file uploaded', 400));
    }

    if (!['idProof', 'employmentContract'].includes(documentType)) {
      return next(new AppError('Invalid document type', 400));
    }

    const teamMember = await Admin.findById(userId);

    if (!teamMember) {
      return next(new AppError('Team member not found', 404));
    }

    // Upload file to S3 or store locally
    const fileUrl = await uploadToS3(req.file, `admin-documents/${userId}/${documentType}`);

    // Update team member document
    teamMember.documents = teamMember.documents || {};
    teamMember.documents[documentType] = {
      name: req.file.originalname,
      url: fileUrl
    };

    await teamMember.save();

    // Log the document upload
    logger.info(`Admin ${req.user.id} uploaded ${documentType} for team member ${userId}`);

    res.status(200).json({
      success: true,
      data: {
        documentType,
        name: req.file.originalname,
        url: fileUrl,
        message: 'Document uploaded successfully'
      }
    });
  } catch (error) {
    logger.error(`Error in uploadTeamMemberDocuments: ${error.message}`);
    next(new AppError('Failed to upload document', 500));
  }
};

/**
 * Register a new team member
 * @route POST /api/v2/admin/team/register
 * @access Private (Admin only)
 */
export const registerTeamMember = async (req, res, next) => {
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
      designation,
      remarks,
      sendInvitation = true
    } = req.body;

    // Check if email already exists
    const existingEmail = await Admin.findOne({ email });
    if (existingEmail) {
      return next(new AppError('Email already in use', 400));
    }

    // Check if employee ID already exists if provided
    if (employeeId) {
      const existingEmployeeId = await Admin.findOne({ employeeId });
      if (existingEmployeeId) {
        return next(new AppError('Employee ID already in use', 400));
      }
    }

    // Generate a temporary password
    const tempPassword = Math.random().toString(36).slice(2, 10);

    // Create new team member
    const newTeamMember = await Admin.create({
      fullName,
      email,
      role,
      department,
      phoneNumber,
      address,
      dateOfJoining: dateOfJoining || Date.now(),
      employeeId,
      designation,
      status: 'Active',
      remarks,
      password: tempPassword,
      profileImage: req.file?.path || null
    });

    // Generate OTP for verification
    const otp = generateOTP(6);
    
    // Store OTP in Redis with team member's email as key
    await storeOTP(email, otp, 30 * 60); // 30 minutes expiry
    
    // Send invitation email with OTP and temporary password if requested
    if (sendInvitation) {
      try {
        await sendEmail({
          to: email,
          subject: 'Welcome to Rocketry Box Admin Team',
          template: 'admin-invitation',
          data: {
            name: fullName,
            role,
            department,
            tempPassword,
            otp,
            verificationLink: `${process.env.ADMIN_FRONTEND_URL}/verify?email=${encodeURIComponent(email)}&otp=${otp}`
          }
        });
        
        // Also send OTP via SMS if phone number is provided
        if (phoneNumber) {
          await sendSMS({
            to: phoneNumber,
            message: `Your OTP for Rocketry Box Admin verification is: ${otp}. It is valid for 30 minutes.`
          });
        }
      } catch (emailError) {
        logger.error(`Failed to send invitation email: ${emailError.message}`);
        // Continue with the registration even if email fails
      }
    }

    // Remove password from response
    newTeamMember.password = undefined;

    // Log the creation
    logger.info(`Admin ${req.user.id} registered new team member ${newTeamMember._id}`);

    res.status(201).json({
      success: true,
      data: {
        teamMember: newTeamMember,
        message: sendInvitation 
          ? 'Team member registered successfully. Invitation sent.' 
          : 'Team member registered successfully.'
      }
    });
  } catch (error) {
    logger.error(`Error in registerTeamMember: ${error.message}`);
    next(new AppError('Failed to register team member', 500));
  }
};

/**
 * Verify team member email/phone with OTP
 * @route POST /api/v2/admin/team/verify
 * @access Public
 */
export const verifyTeamMember = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    
    if (!email || !otp) {
      return next(new AppError('Email and OTP are required', 400));
    }
    
    // Verify OTP stored in Redis
    const isValid = await verifyOTP(email, otp);
    
    if (!isValid) {
      return next(new AppError('Invalid or expired OTP', 400));
    }
    
    // Find the team member
    const teamMember = await Admin.findOne({ email });
    
    if (!teamMember) {
      return next(new AppError('Team member not found', 404));
    }
    
    // Update verification status if needed
    // You might want to add a verification field to the model
    
    // Log the verification
    logger.info(`Team member ${teamMember._id} verified email with OTP`);
    
    res.status(200).json({
      success: true,
      message: 'Email verified successfully'
    });
  } catch (error) {
    logger.error(`Error in verifyTeamMember: ${error.message}`);
    next(new AppError('Verification failed', 500));
  }
};

/**
 * Reset team member password
 * @route POST /api/v2/admin/team/reset-password
 * @access Public (with OTP verification)
 */
export const resetTeamMemberPassword = async (req, res, next) => {
  try {
    const { email, otp, newPassword } = req.body;
    
    if (!email || !otp || !newPassword) {
      return next(new AppError('Email, OTP and new password are required', 400));
    }
    
    // Verify OTP stored in Redis
    const isValid = await verifyOTP(email, otp);
    
    if (!isValid) {
      return next(new AppError('Invalid or expired OTP', 400));
    }
    
    // Find the team member
    const teamMember = await Admin.findOne({ email });
    
    if (!teamMember) {
      return next(new AppError('Team member not found', 404));
    }
    
    // Update password
    teamMember.password = newPassword;
    await teamMember.save();
    
    // Log the password reset
    logger.info(`Team member ${teamMember._id} reset password`);
    
    res.status(200).json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (error) {
    logger.error(`Error in resetTeamMemberPassword: ${error.message}`);
    next(new AppError('Password reset failed', 500));
  }
};

/**
 * Request password reset OTP
 * @route POST /api/v2/admin/team/forgot-password
 * @access Public
 */
export const forgotTeamMemberPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return next(new AppError('Email is required', 400));
    }
    
    // Find the team member
    const teamMember = await Admin.findOne({ email });
    
    if (!teamMember) {
      return next(new AppError('Team member not found', 404));
    }
    
    // Generate OTP for verification
    const otp = generateOTP(6);
    
    // Store OTP in Redis with team member's email as key
    await storeOTP(email, otp, 15 * 60); // 15 minutes expiry
    
    // Send email with OTP
    try {
      await sendEmail({
        to: email,
        subject: 'Password Reset OTP - Rocketry Box Admin',
        template: 'password-reset',
        data: {
          name: teamMember.fullName,
          otp,
          resetLink: `${process.env.ADMIN_FRONTEND_URL}/reset-password?email=${encodeURIComponent(email)}&otp=${otp}`
        }
      });
      
      // Also send OTP via SMS if phone number is available
      if (teamMember.phoneNumber) {
        await sendSMS({
          to: teamMember.phoneNumber,
          message: `Your OTP for password reset is: ${otp}. It is valid for 15 minutes.`
        });
      }
    } catch (emailError) {
      logger.error(`Failed to send password reset email: ${emailError.message}`);
      return next(new AppError('Failed to send password reset email', 500));
    }
    
    // Log the request
    logger.info(`Password reset requested for team member ${teamMember._id}`);
    
    res.status(200).json({
      success: true,
      message: 'Password reset OTP sent to your email and phone'
    });
  } catch (error) {
    logger.error(`Error in forgotTeamMemberPassword: ${error.message}`);
    next(new AppError('Failed to request password reset', 500));
  }
};

/**
 * Get system sections and access statistics
 * @route GET /api/v2/admin/team/sections
 * @access Private (Admin only)
 */
export const getSystemSections = async (req, res, next) => {
  try {
    // Define system sections with descriptions
    const systemSections = [
      {
        id: 'dashboardAccess',
        name: 'Dashboard Access',
        description: 'Access to view dashboard analytics and statistics',
        category: 'Basic'
      },
      {
        id: 'userManagement',
        name: 'User Management',
        description: 'Manage customer accounts and profiles',
        category: 'Operations'
      },
      {
        id: 'teamManagement',
        name: 'Team Management',
        description: 'Manage admin team members and their permissions',
        category: 'Administration'
      },
      {
        id: 'ordersShipping',
        name: 'Orders & Shipping',
        description: 'Manage orders, shipments, and deliveries',
        category: 'Operations'
      },
      {
        id: 'financialOperations',
        name: 'Financial Operations',
        description: 'Handle billing, invoices, and payment reconciliation',
        category: 'Finance'
      },
      {
        id: 'systemConfig',
        name: 'System Configuration',
        description: 'Configure system settings and preferences',
        category: 'Administration'
      },
      {
        id: 'sellerManagement',
        name: 'Seller Management',
        description: 'Manage seller accounts, onboarding, and support',
        category: 'Operations'
      },
      {
        id: 'supportTickets',
        name: 'Support Tickets',
        description: 'Handle customer and seller support tickets',
        category: 'Support'
      },
      {
        id: 'reportsAnalytics',
        name: 'Reports & Analytics',
        description: 'Generate and view detailed reports and analytics',
        category: 'Analytics'
      },
      {
        id: 'marketingPromotions',
        name: 'Marketing & Promotions',
        description: 'Manage marketing campaigns and promotions',
        category: 'Marketing'
      }
    ];

    // Get access statistics for each section
    const accessStatistics = await getSectionAccessStats();

    // Get number of admins with access to each section
    const adminCounts = await Admin.aggregate([
      { $match: { status: 'Active' } },
      { 
        $group: {
          _id: null,
          dashboardAccess: { 
            $sum: { $cond: [{ $eq: ["$permissions.dashboardAccess", true] }, 1, 0] }
          },
          userManagement: { 
            $sum: { $cond: [{ $eq: ["$permissions.userManagement", true] }, 1, 0] }
          },
          teamManagement: { 
            $sum: { $cond: [{ $eq: ["$permissions.teamManagement", true] }, 1, 0] }
          },
          ordersShipping: { 
            $sum: { $cond: [{ $eq: ["$permissions.ordersShipping", true] }, 1, 0] }
          },
          financialOperations: { 
            $sum: { $cond: [{ $eq: ["$permissions.financialOperations", true] }, 1, 0] }
          },
          systemConfig: { 
            $sum: { $cond: [{ $eq: ["$permissions.systemConfig", true] }, 1, 0] }
          },
          sellerManagement: { 
            $sum: { $cond: [{ $eq: ["$permissions.sellerManagement", true] }, 1, 0] }
          },
          supportTickets: { 
            $sum: { $cond: [{ $eq: ["$permissions.supportTickets", true] }, 1, 0] }
          },
          reportsAnalytics: { 
            $sum: { $cond: [{ $eq: ["$permissions.reportsAnalytics", true] }, 1, 0] }
          },
          marketingPromotions: { 
            $sum: { $cond: [{ $eq: ["$permissions.marketingPromotions", true] }, 1, 0] }
          },
          totalAdmins: { $sum: 1 }
        }
      }
    ]);

    // Get total active admins
    const totalActiveAdmins = adminCounts.length > 0 ? adminCounts[0].totalAdmins : 0;
    
    // Combine data
    const sectionsWithStats = systemSections.map(section => {
      return {
        ...section,
        adminsWithAccess: adminCounts.length > 0 ? adminCounts[0][section.id] || 0 : 0,
        accessPercentage: totalActiveAdmins > 0 
          ? ((adminCounts.length > 0 ? adminCounts[0][section.id] || 0 : 0) / totalActiveAdmins) * 100 
          : 0,
        accessStats: accessStatistics[section.id] || {
          totalAccesses: 0,
          lastAccessed: null
        }
      };
    });

    // Group by category
    const sectionsByCategory = {};
    sectionsWithStats.forEach(section => {
      if (!sectionsByCategory[section.category]) {
        sectionsByCategory[section.category] = [];
      }
      sectionsByCategory[section.category].push(section);
    });

    res.status(200).json({
      success: true,
      data: {
        sections: sectionsWithStats,
        categories: sectionsByCategory,
        totalActiveAdmins
      }
    });
  } catch (error) {
    logger.error(`Error in getSystemSections: ${error.message}`);
    next(new AppError('Failed to fetch system sections', 500));
  }
};

/**
 * Helper function to get section access statistics from logs
 * @returns {Object} Access statistics by section
 */
const getSectionAccessStats = async () => {
  // In a production system, this would query your audit logs or analytics
  // This is a placeholder implementation
  
  // Mock data - in a real system, replace with actual database queries
  const mockStats = {
    'dashboardAccess': {
      totalAccesses: 842,
      lastAccessed: new Date(Date.now() - 5 * 60 * 1000) // 5 minutes ago
    },
    'userManagement': {
      totalAccesses: 356,
      lastAccessed: new Date(Date.now() - 15 * 60 * 1000) // 15 minutes ago
    },
    'teamManagement': {
      totalAccesses: 124,
      lastAccessed: new Date(Date.now() - 45 * 60 * 1000) // 45 minutes ago
    },
    'ordersShipping': {
      totalAccesses: 762,
      lastAccessed: new Date(Date.now() - 10 * 60 * 1000) // 10 minutes ago
    },
    'financialOperations': {
      totalAccesses: 315,
      lastAccessed: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
    },
    'systemConfig': {
      totalAccesses: 89,
      lastAccessed: new Date(Date.now() - 12 * 60 * 60 * 1000) // 12 hours ago
    },
    'sellerManagement': {
      totalAccesses: 427,
      lastAccessed: new Date(Date.now() - 30 * 60 * 1000) // 30 minutes ago
    },
    'supportTickets': {
      totalAccesses: 621,
      lastAccessed: new Date(Date.now() - 8 * 60 * 1000) // 8 minutes ago
    },
    'reportsAnalytics': {
      totalAccesses: 278,
      lastAccessed: new Date(Date.now() - 4 * 60 * 60 * 1000) // 4 hours ago
    },
    'marketingPromotions': {
      totalAccesses: 185,
      lastAccessed: new Date(Date.now() - 24 * 60 * 60 * 1000) // 1 day ago
    }
  };
  
  return mockStats;
}; 