import mongoose from 'mongoose';
import Seller from './src/modules/seller/models/seller.model.js';
import TeamUser from './src/modules/seller/models/teamUser.model.js';

async function checkDatabase() {
  try {
    // Connect to MongoDB using the same connection string as the backend
    const mongoURI = process.env.MONGODB_ATLAS_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/rocketrybox';
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB');

    // Check sellers
    const sellerCount = await Seller.countDocuments();
    console.log(`📊 Total sellers in database: ${sellerCount}`);

    if (sellerCount > 0) {
      const sellers = await Seller.find().limit(3).select('name email businessName status createdAt');
      console.log('\n👥 Sample sellers:');
      sellers.forEach(seller => {
        console.log(`  - ${seller.name} (${seller.email}) - Status: ${seller.status}`);
      });
    } else {
      console.log('\n❌ No sellers found in database!');
      console.log('\n💡 You need to register a seller account first.');
      console.log('   Go to: http://localhost:5173/seller/auth/register');
    }

    // Check team users
    const teamUserCount = await TeamUser.countDocuments();
    console.log(`\n👥 Total team users in database: ${teamUserCount}`);

    if (teamUserCount > 0) {
      const teamUsers = await TeamUser.find().limit(3).select('name email jobRole status seller').populate('seller', 'name email');
      console.log('\n🤝 Sample team users:');
      teamUsers.forEach(user => {
        console.log(`  - ${user.name} (${user.email}) - Role: ${user.jobRole} - Status: ${user.status}`);
        console.log(`    Parent Seller: ${user.seller?.name || 'Unknown'}`);
      });
    }

    mongoose.disconnect();

  } catch (error) {
    console.error('❌ Database Error:', error.message);
    console.log('\n🔍 Common issues:');
    console.log('   1. MongoDB not running or not accessible');
    console.log('   2. Wrong connection string in .env file');
    console.log('   3. Network connectivity issues');

    process.exit(1);
  }
}

checkDatabase();
