import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { getSession } from './src/utils/redis.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from the correct path
const envPath = path.resolve(__dirname, '.env');
dotenv.config({ path: envPath });

// Import models using correct paths
import CustomerOrder from './src/modules/customer/models/customerOrder.model.js';
import Customer from './src/modules/customer/models/customer.model.js';

async function debugAuthSession() {
  try {
    // Use the same connection logic as the backend app
    const MONGODB_URI = process.env.MONGODB_ATLAS_URI || process.env.MONGODB_URI;
    
    if (!MONGODB_URI) {
      console.log('❌ No MongoDB URI found in environment variables');
      return;
    }
    
    console.log('📡 Connecting to MongoDB Atlas...');
    
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ Connected to MongoDB');
    
    const targetCustomerId = '68301dfa6304a17cf71e16e2';
    console.log('\n=== AUTHENTICATION DEBUG ===');
    console.log('Target customer ID:', targetCustomerId);
    
    // Check customer in database
    const customer = await Customer.findById(targetCustomerId);
    if (customer) {
      console.log('✅ Customer found in database:');
      console.log('  Name:', customer.name);
      console.log('  Email:', customer.email);
      console.log('  Status:', customer.status);
      console.log('  Last Login:', customer.lastLogin);
      
      // Check if there's a session for this customer
      try {
        const session = await getSession(targetCustomerId);
        console.log('  Redis Session:', session ? 'EXISTS' : 'NOT FOUND');
        if (session) {
          const sessionData = typeof session === 'string' ? JSON.parse(session) : session;
          console.log('  Session Data:', {
            lastActivity: new Date(sessionData.lastActivity),
            user: sessionData.user ? {
              id: sessionData.user.id,
              email: sessionData.user.email,
              role: sessionData.user.role
            } : 'No user data'
          });
        }
      } catch (redisError) {
        console.log('  Redis Error:', redisError.message);
      }
      
      // Create a test JWT token to see what would be in req.user
      try {
        const testToken = jwt.sign(
          { 
            id: customer._id.toString(),
            email: customer.email,
            role: 'customer'
          },
          process.env.JWT_SECRET,
          { expiresIn: '7d' }
        );
        
        const decoded = jwt.verify(testToken, process.env.JWT_SECRET);
        console.log('  Test JWT Decoded:', {
          id: decoded.id,
          email: decoded.email,
          role: decoded.role,
          idType: typeof decoded.id
        });
      } catch (jwtError) {
        console.log('  JWT Error:', jwtError.message);
      }
    } else {
      console.log('❌ Customer not found in database');
    }
    
    // Check orders for this customer
    console.log('\n=== ORDER QUERY DEBUG ===');
    
    // Test different query formats
    const queries = [
      { customerId: targetCustomerId },
      { customerId: targetCustomerId.toString() },
      { customerId: new mongoose.Types.ObjectId(targetCustomerId) }
    ];
    
    for (let i = 0; i < queries.length; i++) {
      const query = queries[i];
      const orders = await CustomerOrder.find(query);
      console.log(`Query ${i + 1} (${Object.keys(query)[0]}: ${typeof query.customerId}):`, orders.length, 'orders');
    }
    
    // Check what the actual customer IDs look like in orders
    const allOrders = await CustomerOrder.find({}).limit(5);
    console.log('\n=== SAMPLE ORDER CUSTOMER IDS ===');
    allOrders.forEach((order, index) => {
      console.log(`Order ${index + 1}:`, {
        orderId: order._id,
        customerId: order.customerId,
        customerIdType: typeof order.customerId,
        isObjectId: mongoose.Types.ObjectId.isValid(order.customerId),
        matches: order.customerId?.toString() === targetCustomerId
      });
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

debugAuthSession(); 