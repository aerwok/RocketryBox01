import 'dotenv/config';
import mongoose from 'mongoose';

// Check for force flag
const isForced = process.argv.includes('--force');

// MongoDB connection
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_ATLAS_URI, {
      dbName: process.env.DB_NAME || 'RocketryBox'
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Clear customer and customer order collections
const clearCustomerData = async () => {
  try {
    console.log('🧹 Starting customer data cleanup...\n');

    // Connect to database
    await connectDB();

    // Get database instance
    const db = mongoose.connection.db;

    // Collections to clear
    const collectionsToCheck = [
      'customers',
      'customerorders',
      'orders',
      'customer_orders',
      'customer_payments',
      'customer_addresses'
    ];

    // Get all collection names in the database
    const collections = await db.listCollections().toArray();
    const existingCollections = collections.map(col => col.name);

    console.log('📋 Available collections in database:');
    existingCollections.forEach(name => console.log(`   - ${name}`));
    console.log('');

    // Clear each collection that exists
    let clearedCount = 0;

    for (const collectionName of collectionsToCheck) {
      if (existingCollections.includes(collectionName)) {
        const collection = db.collection(collectionName);
        const countBefore = await collection.countDocuments();

        if (countBefore > 0) {
          await collection.deleteMany({});
          console.log(`🗑️  Cleared '${collectionName}' collection (${countBefore} documents removed)`);
          clearedCount++;
        } else {
          console.log(`✨ '${collectionName}' collection was already empty`);
        }
      } else {
        console.log(`ℹ️  Collection '${collectionName}' does not exist`);
      }
    }

    console.log(`\n✅ Customer data cleanup completed!`);
    console.log(`📊 Summary: ${clearedCount} collections were cleared`);

    // Close connection
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');

  } catch (error) {
    console.error('❌ Error clearing customer data:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

// Confirmation prompt
const confirmClear = () => {
  return new Promise((resolve) => {
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    console.log('⚠️  WARNING: This will permanently delete ALL customer data!');
    console.log('   - Customer accounts');
    console.log('   - Customer orders');
    console.log('   - Customer payments');
    console.log('   - Customer addresses');
    console.log('');

    rl.question('Are you sure you want to continue? (type "yes" to confirm): ', (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'yes');
    });
  });
};

// Main execution
const main = async () => {
  console.log('🚀 RocketryBox - Customer Data Cleanup Tool\n');

  // Check if we're in development
  if (process.env.NODE_ENV === 'production') {
    console.error('❌ This script cannot be run in production environment!');
    process.exit(1);
  }

  // Skip confirmation if forced
  if (isForced) {
    console.log('⚡ Force flag detected - skipping confirmation\n');
    console.log('⚠️  WARNING: This will permanently delete ALL customer data!');
    console.log('🏃 Proceeding with data cleanup...\n');
    await clearCustomerData();
    return;
  }

  // Confirm before proceeding
  const confirmed = await confirmClear();

  if (!confirmed) {
    console.log('❌ Operation cancelled by user');
    process.exit(0);
  }

  console.log('\n🏃 Proceeding with data cleanup...\n');
  await clearCustomerData();
};

// Handle script execution
main().catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});
