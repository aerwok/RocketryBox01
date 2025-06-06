import Seller from './src/modules/seller/models/seller.model.js';
import { connectDB } from './src/utils/database.js';

const testKYCStatus = async () => {
  try {
    console.log('🔍 Testing KYC Status Logic...');
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
    console.log('📄 Current documents structure:', JSON.stringify(seller.documents, null, 2));

    // Test KYC status logic
    let kycStatus = 'pending';
    if (seller.documents) {
      const gstStatus = seller.documents.gstin?.status || 'pending';
      const panStatus = seller.documents.pan?.status || 'pending';
      const aadhaarStatus = seller.documents.aadhaar?.status || 'pending';

      console.log('📋 Document statuses:');
      console.log(`  GST: ${gstStatus}`);
      console.log(`  PAN: ${panStatus}`);
      console.log(`  Aadhaar: ${aadhaarStatus}`);

      if (gstStatus === 'verified' && panStatus === 'verified' && aadhaarStatus === 'verified') {
        kycStatus = 'verified';
      } else if (gstStatus === 'rejected' || panStatus === 'rejected' || aadhaarStatus === 'rejected') {
        kycStatus = 'rejected';
      } else {
        kycStatus = 'pending';
      }
    }

    console.log('🎯 Final KYC Status:', kycStatus);
    console.log('✅ Test completed successfully');

    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
};

testKYCStatus();
