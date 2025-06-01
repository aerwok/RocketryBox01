import mongoose from 'mongoose';
import dotenv from 'dotenv';
import CustomerOrder from './src/modules/customer/models/customerOrder.model.js';
import Customer from './src/modules/customer/models/customer.model.js';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from the correct path
const envPath = path.resolve(__dirname, '.env');
dotenv.config({ path: envPath });

async function debugCustomerOrders() {
  console.log('🔍 Debugging Customer Orders...\n');

  try {
    // Use the same connection logic as the backend app
    const MONGODB_URI = process.env.MONGODB_ATLAS_URI || process.env.MONGODB_URI;
    
    if (!MONGODB_URI) {
      console.log('❌ No MongoDB URI found in environment variables');
      console.log('Available env vars:', {
        MONGODB_ATLAS_URI: process.env.MONGODB_ATLAS_URI ? 'Set' : 'Not set',
        MONGODB_URI: process.env.MONGODB_URI ? 'Set' : 'Not set'
      });
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
    
    // Check total orders in database
    const totalOrders = await CustomerOrder.countDocuments();
    console.log(`📊 Total orders in database: ${totalOrders}`);
    
    if (totalOrders === 0) {
      console.log('❌ No orders found in database');
      return;
    }
    
    // Get all customers
    const customers = await Customer.find({}, { _id: 1, email: 1, name: 1 });
    console.log(`👥 Total customers: ${customers.length}`);
    
    // Check orders for each customer
    for (const customer of customers) {
      console.log(`\n🔍 Checking orders for customer: ${customer.email || customer.name}`);
      console.log(`   Customer ID: ${customer._id} (type: ${typeof customer._id})`);
      
      // Check orders with different query approaches
      const ordersWithObjectId = await CustomerOrder.find({ customerId: customer._id });
      const ordersWithStringId = await CustomerOrder.find({ customerId: customer._id.toString() });
      
      console.log(`   Orders with ObjectId: ${ordersWithObjectId.length}`);
      console.log(`   Orders with String ID: ${ordersWithStringId.length}`);
      
      if (ordersWithObjectId.length > 0) {
        console.log('   📋 Recent orders:');
        ordersWithObjectId.slice(0, 3).forEach((order, index) => {
          console.log(`     ${index + 1}. ${order.orderNumber} - ${order.status} - ${order.paymentStatus}`);
          console.log(`        Customer ID in order: ${order.customerId} (type: ${typeof order.customerId})`);
        });
      }
    }
    
    // Check what happens with raw aggregation
    console.log('\n📊 Status aggregation:');
    const allOrders = await CustomerOrder.find({}).limit(5);
    allOrders.forEach(order => {
      console.log(`Order ${order.orderNumber}: customerId = ${order.customerId} (${typeof order.customerId})`);
    });
    
    // Test the actual query that the API uses
    if (customers.length > 0) {
      const testCustomerId = customers[0]._id;
      console.log(`\n🧪 Testing API query with customer ID: ${testCustomerId}`);
      
      const apiResult = await CustomerOrder.find({ customerId: testCustomerId })
        .sort({ createdAt: -1 });
      
      console.log(`   API query result: ${apiResult.length} orders found`);
      
      // Test with string conversion
      const stringResult = await CustomerOrder.find({ customerId: testCustomerId.toString() });
      console.log(`   String ID query result: ${stringResult.length} orders found`);
      
      // Test with ObjectId conversion
      const objectIdResult = await CustomerOrder.find({ customerId: new mongoose.Types.ObjectId(testCustomerId) });
      console.log(`   ObjectId query result: ${objectIdResult.length} orders found`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

debugCustomerOrders(); 