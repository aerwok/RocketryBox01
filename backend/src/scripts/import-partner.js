import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs/promises';
import ShippingPartner from '../modules/admin/models/shippingPartner.model.js';
import { logger } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const MONGODB_URI = process.env.MONGODB_ATLAS_URI || 'mongodb://localhost:27017/rocketrybox';

async function importPartner() {
  try {
    // Connect to MongoDB
    logger.info('Attempting to connect to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    logger.info('Connected to MongoDB');

    // Read partner configuration
    const partnerConfig = JSON.parse(
      await fs.readFile(
        join(__dirname, '../data/partners/bluedart.json'),
        'utf8'
      )
    );

    // Check if partner already exists
    const existingPartner = await ShippingPartner.findOne({
      name: { $regex: new RegExp(`^${partnerConfig.name}$`, 'i') }
    });

    if (existingPartner) {
      logger.info(`Partner ${partnerConfig.name} already exists. Updating...`);
      Object.assign(existingPartner, partnerConfig);
      await existingPartner.save();
      logger.info(`Partner ${partnerConfig.name} updated successfully`);
    } else {
      // Create new partner
      const partner = new ShippingPartner(partnerConfig);
      await partner.save();
      logger.info(`Partner ${partnerConfig.name} created successfully`);
    }

    // Disconnect from MongoDB
    await mongoose.disconnect();
    logger.info('Disconnected from MongoDB');
  } catch (error) {
    logger.error('Error importing partner:', error);
    process.exit(1);
  }
}

importPartner(); 