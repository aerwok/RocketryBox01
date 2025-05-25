import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Admin from '../modules/admin/models/admin.model.js';
import { generateEmployeeId } from '../utils/employeeId.js';

// Load environment variables
dotenv.config();

const createSuperAdmin = async () => {
  try {
    // Connect to MongoDB
    const MONGODB_URI = process.env.MONGODB_ATLAS_URI || 'mongodb://localhost:27017/rocketrybox';
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Delete existing super admin if exists
    await Admin.deleteOne({ email: 'superadmin01@rocketrybox.com' });
    console.log('Deleted existing super admin if any');

    // Super admin details
    const superAdminData = {
      fullName: 'Super Admin',
      email: 'superadmin01@rocketrybox.com',
      password: 'Admin@123', // plain text, will be hashed by pre-save
      role: 'Admin',
      designation: 'Super Administrator',
      department: 'Administration',
      phoneNumber: '+919876543210',
      isSuperAdmin: true,
      status: 'Active',
      employeeId: await generateEmployeeId('Admin'),
      permissions: {
        dashboardAccess: true,
        userManagement: true,
        teamManagement: true,
        ordersShipping: true,
        financialOperations: true,
        systemConfig: true,
        sellerManagement: true,
        supportTickets: true,
        reportsAnalytics: true,
        marketingPromotions: true
      }
    };

    // Create super admin
    const superAdmin = await Admin.create(superAdminData);
    console.log('Super admin created successfully:', {
      id: superAdmin._id,
      email: superAdmin.email,
      role: superAdmin.role,
      designation: superAdmin.designation,
      isSuperAdmin: superAdmin.isSuperAdmin
    });

    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('Error creating super admin:', error);
    process.exit(1);
  }
};

// Run the script
createSuperAdmin(); 