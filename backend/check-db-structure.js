import mongoose from 'mongoose';
import Seller from './src/modules/seller/models/seller.model.js';

async function checkDatabaseStructure() {
  try {
    console.log('🔍 Checking MongoDB Database Structure...\n');

    // Connect to MongoDB
    const mongoURI = process.env.MONGODB_ATLAS_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/rocketrybox';
    console.log(`📡 Connecting to: ${mongoURI.replace(/\/\/.*@/, '//***:***@')}`);

    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB\n');

    // Get database name
    const dbName = mongoose.connection.db.databaseName;
    console.log(`🗄️  Current Database: ${dbName}`);

    // Check if we're in the RocketryBox database
    if (dbName.toLowerCase() !== 'rocketrybox') {
      console.log(`⚠️  Warning: Expected 'RocketryBox' database, but connected to '${dbName}'`);
    } else {
      console.log('✅ Connected to correct RocketryBox database');
    }
    console.log('');

    // List all collections in the database
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`📚 Collections in ${dbName} database:`);

    if (collections.length === 0) {
      console.log('   ❌ No collections found - database is empty');
    } else {
      collections.forEach((collection, index) => {
        console.log(`   ${index + 1}. ${collection.name}`);
      });
    }
    console.log('');

    // Check specifically for sellers collection
    const sellersCollection = collections.find(col => col.name === 'sellers');
    if (sellersCollection) {
      console.log('✅ Found "sellers" collection');

      // Get sellers collection stats
      const sellersStats = await mongoose.connection.db.collection('sellers').stats();
      console.log(`   📊 Documents count: ${sellersStats.count}`);
      console.log(`   💾 Storage size: ${sellersStats.storageSize} bytes`);
      console.log(`   📑 Average document size: ${sellersStats.avgObjSize} bytes`);

      // Get sample documents if any exist
      if (sellersStats.count > 0) {
        const sampleSellers = await mongoose.connection.db.collection('sellers').find({}).limit(3).toArray();
        console.log('\n👥 Sample seller documents:');
        sampleSellers.forEach((seller, index) => {
          console.log(`   ${index + 1}. ID: ${seller._id}`);
          console.log(`      Name: ${seller.name || 'No name'}`);
          console.log(`      Email: ${seller.email || 'No email'}`);
          console.log(`      Status: ${seller.status || 'No status'}`);
          console.log(`      Created: ${seller.createdAt || 'No date'}`);
        });
      }
    } else {
      console.log('❌ No "sellers" collection found');
      console.log('💡 This means no sellers have been registered yet');
    }
    console.log('');

    // Check Seller model configuration
    console.log('🏗️  Seller Model Configuration:');
    console.log(`   Collection name: ${Seller.collection.name}`);
    console.log(`   Database: ${Seller.db.name}`);
    console.log(`   Model name: ${Seller.modelName}`);
    console.log('');

    // Test if Seller model can query the database
    console.log('🧪 Testing Seller model queries:');
    try {
      const sellerCount = await Seller.countDocuments();
      console.log(`   ✅ Seller.countDocuments(): ${sellerCount}`);

      if (sellerCount > 0) {
        const firstSeller = await Seller.findOne().select('name email status');
        console.log(`   ✅ Seller.findOne(): Found seller "${firstSeller.name}"`);
      } else {
        console.log('   ℹ️  No sellers found via Seller model');
      }
    } catch (modelError) {
      console.log(`   ❌ Seller model error: ${modelError.message}`);
    }
    console.log('');

    // Check other related collections
    const teamUsersCollection = collections.find(col => col.name === 'teamusers');
    if (teamUsersCollection) {
      const teamUserCount = await mongoose.connection.db.collection('teamusers').countDocuments();
      console.log(`👥 Team Users collection: ${teamUserCount} documents`);
    } else {
      console.log('👥 No team users collection found');
    }

    // Summary
    console.log('\n📋 Summary:');
    console.log(`   Database: ${dbName}`);
    console.log(`   Collections: ${collections.length}`);
    console.log(`   Sellers: ${sellersCollection ? 'Found' : 'Not found'}`);
    console.log(`   Model working: ${await Seller.countDocuments() >= 0 ? 'Yes' : 'No'}`);

    mongoose.disconnect();

  } catch (error) {
    console.error('❌ Error checking database structure:', error.message);
    console.log('\n🔍 Debugging info:');
    console.log(`   Error type: ${error.constructor.name}`);
    console.log(`   Stack: ${error.stack}`);
    process.exit(1);
  }
}

checkDatabaseStructure();
