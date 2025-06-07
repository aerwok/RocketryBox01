import mongoose from 'mongoose';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import models
import RateCard from './src/models/ratecard.model.js';
import SellerRateCard from './src/models/sellerRateCard.model.js';
import ShippingPartner from './src/modules/admin/models/shippingPartner.model.js';

console.log('🧹 Starting DTDC Data Cleanup...');

// MongoDB connection
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/rocketrybox';

async function cleanupDTDCData() {
  try {
    console.log('📊 Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Remove DTDC rate cards
    console.log('🗑️  Removing DTDC rate cards...');
    const rateCardResult = await RateCard.deleteMany({
      courier: { $regex: /DTDC/i }
    });
    console.log(`   Deleted ${rateCardResult.deletedCount} rate cards`);

    // Remove DTDC shipping partners
    console.log('🗑️  Removing DTDC shipping partners...');
    const partnerResult = await ShippingPartner.deleteMany({
      name: { $regex: /DTDC/i }
    });
    console.log(`   Deleted ${partnerResult.deletedCount} shipping partners`);

    // Remove DTDC seller rate cards
    console.log('🗑️  Removing DTDC seller rate cards...');
    const sellerCardResult = await SellerRateCard.deleteMany({
      courier: { $regex: /DTDC/i }
    });
    console.log(`   Deleted ${sellerCardResult.deletedCount} seller rate cards`);

    // Check for remaining DTDC data
    console.log('🔍 Checking for remaining DTDC references...');

    const remainingRateCards = await RateCard.countDocuments({
      courier: { $regex: /DTDC/i }
    });
    const remainingPartners = await ShippingPartner.countDocuments({
      name: { $regex: /DTDC/i }
    });
    const remainingSellerCards = await SellerRateCard.countDocuments({
      courier: { $regex: /DTDC/i }
    });

    console.log('📈 Cleanup Results:');
    console.log(`   • Rate Cards: ${remainingRateCards} remaining`);
    console.log(`   • Shipping Partners: ${remainingPartners} remaining`);
    console.log(`   • Seller Rate Cards: ${remainingSellerCards} remaining`);

    if (remainingRateCards === 0 && remainingPartners === 0 && remainingSellerCards === 0) {
      console.log('✅ DTDC cleanup completed successfully! All DTDC data removed.');
    } else {
      console.log('⚠️  Some DTDC data may still remain. Please check manually.');
    }

  } catch (error) {
    console.error('❌ Error during cleanup:', error.message);
    console.log('Please ensure MongoDB is running and accessible.');
  } finally {
    await mongoose.disconnect();
    console.log('📋 Disconnected from MongoDB');
    console.log('🏁 Cleanup script finished.');
  }
}

cleanupDTDCData();
