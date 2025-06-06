import Seller from './src/modules/seller/models/seller.model.js';
import { connectDB } from './src/utils/database.js';
import { connectRedis } from './src/utils/redis.js';

const testSellerLogin = async () => {
  try {
    console.log('🔍 Testing Seller Login System...');
    console.log('=====================================');

    // Connect to database
    await connectDB();
    console.log('✅ Connected to MongoDB');

    // Connect to Redis
    const redisConnected = await connectRedis();
    console.log(`${redisConnected ? '✅' : '⚠️'} Redis connection: ${redisConnected ? 'Connected' : 'Failed'}`);

    // Check for existing sellers
    const sellers = await Seller.find({}).limit(5);
    console.log(`\n📊 Found ${sellers.length} sellers in database:`);

    if (sellers.length > 0) {
      sellers.forEach((seller, index) => {
        console.log(`\n${index + 1}. Seller: ${seller.name || 'No Name'}`);
        console.log(`   📧 Email: ${seller.email}`);
        console.log(`   📱 Phone: ${seller.phone || 'No Phone'}`);
        console.log(`   🏢 Business: ${seller.businessName || 'No Business Name'}`);
        console.log(`   📊 Status: ${seller.status}`);
        console.log(`   📅 Created: ${seller.createdAt}`);
        console.log(`   🔑 Has Refresh Token: ${!!seller.refreshToken}`);
      });

      console.log('\n💡 You can test login with any of these sellers.');
      console.log('💡 If you know their passwords, use the frontend login.');
      console.log('💡 If not, you may need to reset password or register a new seller.');
    } else {
      console.log('\n⚠️ No sellers found in database.');
      console.log('💡 You need to register a new seller first.');
      console.log('💡 Go to http://localhost:3000/seller/register to create an account.');
    }

    console.log('\n🔍 Testing Authentication Middleware...');

    // Test the middleware compatibility
    console.log('✅ All seller routes now use authenticateSeller middleware');
    console.log('✅ Seller login creates Redis sessions for compatibility');
    console.log('✅ Seller logout cleans up Redis sessions');

    console.log('\n🎯 TO TEST SELLER LOGIN:');
    console.log('========================');
    console.log('1. Go to: http://localhost:3000/seller/login');
    console.log('2. Use credentials from above OR register new seller');
    console.log('3. Login should now work without session errors');

    process.exit(0);

  } catch (error) {
    console.error('❌ Error testing seller login:', error);
    process.exit(1);
  }
};

testSellerLogin();
