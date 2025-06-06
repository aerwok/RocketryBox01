import Seller from './src/modules/seller/models/seller.model.js';
import { connectDB } from './src/utils/database.js';

const testRateBandSystem = async () => {
  try {
    console.log('🔍 Testing Rate Band System...');
    console.log('=====================================');

    // Connect to database
    await connectDB();
    console.log('✅ Connected to MongoDB');

    // Find a seller to test with
    const seller = await Seller.findOne({ email: 'iamarno936@gmail.com' });

    if (!seller) {
      console.log('❌ No seller found with email iamarno936@gmail.com');
      process.exit(1);
    }

    console.log('📊 Found seller:', seller.name);
    console.log('📄 Current seller data:');
    console.log('  - Rate Band:', seller.rateBand || 'null (default RBX1)');
    console.log('  - Payment Type:', seller.paymentType || 'wallet (default)');
    console.log('  - Credit Limit:', seller.creditLimit || 0);
    console.log('  - Credit Period:', seller.creditPeriod || 0);

    // Test the rate band logic from profile controller
    let rateBand = 'RBX1'; // Default base rate card
    let rateBandDescription = 'Base rate card for all sellers';
    let isCustomAssigned = false;

    // Check if seller has a custom rate band assigned by admin
    if (seller.rateBand && seller.rateBand.trim() !== '') {
      rateBand = seller.rateBand;
      rateBandDescription = 'Custom rate band assigned by admin';
      isCustomAssigned = true;
    }

    console.log('🎯 Computed Rate Band Logic:');
    console.log('  - Final Rate Band:', rateBand);
    console.log('  - Description:', rateBandDescription);
    console.log('  - Is Custom:', isCustomAssigned);
    console.log('  - Is Default RBX1:', rateBand === 'RBX1' && !isCustomAssigned);

    console.log('✅ Rate band system test completed successfully');

    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
};

testRateBandSystem();
