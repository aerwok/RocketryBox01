import mongoose from 'mongoose';
import dotenv from 'dotenv';
import CustomerOrder from './src/modules/customer/models/customerOrder.model.js';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from the correct path
const envPath = path.resolve(__dirname, '.env');
dotenv.config({ path: envPath });

// Create readline interface for user confirmation
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function clearCustomerOrders() {
  console.log('🗑️  Customer Orders Cleanup Script\n');
  console.log('⚠️  WARNING: This will permanently delete ALL customer orders from your database!');
  
  try {
    // Use the same connection logic as the backend app
    const MONGODB_URI = process.env.MONGODB_ATLAS_URI || process.env.MONGODB_URI;
    
    if (!MONGODB_URI) {
      console.log('❌ No MongoDB URI found in environment variables');
      console.log('Available env vars:', {
        MONGODB_ATLAS_URI: process.env.MONGODB_ATLAS_URI ? 'Set' : 'Not set',
        MONGODB_URI: process.env.MONGODB_URI ? 'Set' : 'Not set'
      });
      rl.close();
      return;
    }
    
    console.log('📡 Connecting to MongoDB...');
    console.log('Using URI:', MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, '//****:****@')); // Hide credentials
    
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ Connected to MongoDB');
    
    // Check current number of orders
    const totalOrders = await CustomerOrder.countDocuments();
    console.log(`📊 Current orders in database: ${totalOrders}`);
    
    if (totalOrders === 0) {
      console.log('✅ No orders found in database. Nothing to clear.');
      rl.close();
      return;
    }
    
    // Ask for confirmation
    const confirmation = await askQuestion(`\n🔍 Are you sure you want to delete all ${totalOrders} customer orders? This action cannot be undone! (yes/no): `);
    
    if (confirmation.toLowerCase() !== 'yes') {
      console.log('❌ Operation cancelled by user.');
      rl.close();
      return;
    }
    
    // Final confirmation
    const finalConfirmation = await askQuestion('\n🚨 FINAL CONFIRMATION: Type "DELETE ALL ORDERS" to proceed: ');
    
    if (finalConfirmation !== 'DELETE ALL ORDERS') {
      console.log('❌ Operation cancelled. Exact phrase not entered.');
      rl.close();
      return;
    }
    
    console.log('\n🗑️  Deleting all customer orders...');
    
    // Delete all customer orders
    const deleteResult = await CustomerOrder.deleteMany({});
    
    console.log(`✅ Successfully deleted ${deleteResult.deletedCount} customer orders`);
    
    // Verify deletion
    const remainingOrders = await CustomerOrder.countDocuments();
    console.log(`📊 Remaining orders in database: ${remainingOrders}`);
    
    if (remainingOrders === 0) {
      console.log('🎉 All customer orders have been successfully cleared from the database!');
    } else {
      console.log('⚠️  Warning: Some orders may still remain in the database.');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
    rl.close();
  }
}

// Handle Ctrl+C gracefully
process.on('SIGINT', async () => {
  console.log('\n\n⚠️  Process interrupted. Cleaning up...');
  await mongoose.disconnect();
  rl.close();
  process.exit(0);
});

clearCustomerOrders(); 