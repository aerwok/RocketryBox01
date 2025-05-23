import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Admin from '../modules/admin/models/admin.model.js';
import { logger } from '../utils/logger.js';

// Load environment variables
dotenv.config();

const MONGODB_URI = 'mongodb+srv://admin:i34vn2agbfiCsEEc@rocketryboxckuster1.yi5tifv.mongodb.net/rocketrybox?retryWrites=true&w=majority&appName=RocketryBoxCkuster1';

const checkAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    logger.info('Connected to MongoDB');

    // Find the admin
    const admin = await Admin.findOne({ email: 'superadmin@rocketrybox.com' }).select('+password');
    
    if (!admin) {
      logger.error('Admin not found!');
      return;
    }

    logger.info('Admin found:', {
      id: admin._id,
      email: admin.email,
      role: admin.role,
      status: admin.status,
      hasPassword: !!admin.password
    });

    // Test password
    const testPassword = 'SuperAdmin@123';
    const isPasswordCorrect = await admin.isPasswordCorrect(testPassword);
    logger.info('Password test result:', { isPasswordCorrect });

  } catch (error) {
    logger.error('Error checking admin:', error);
  } finally {
    await mongoose.disconnect();
    logger.info('Disconnected from MongoDB');
  }
};

checkAdmin(); 