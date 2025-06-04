import mongoose from 'mongoose';
import Order from './src/modules/seller/models/order.model.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Use the MongoDB Atlas connection from environment
const MONGODB_URI = process.env.MONGODB_ATLAS_URI || 'mongodb://localhost:27017/test';

mongoose.connect(MONGODB_URI);

mongoose.connection.once('open', async () => {
  try {
    console.log('Connected to database');
    console.log('Database URI:', MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@')); // Hide credentials
    
    // Get recent orders
    const recentOrders = await Order.find({}).sort({createdAt: -1}).limit(10);
    console.log('\n📋 Recent orders in database:');
    
    if (recentOrders.length === 0) {
      console.log('No orders found in database');
    } else {
      recentOrders.forEach(order => {
        console.log({
          orderId: order.orderId,
          status: order.status,
          channel: order.channel,
          seller: order.seller,
          createdAt: order.createdAt
        });
      });
    }
    
    // Count by status
    const statusCounts = await Order.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    
    console.log('\n📊 Order counts by status:');
    if (statusCounts.length === 0) {
      console.log('No orders found');
    } else {
      statusCounts.forEach(item => {
        console.log(`${item._id}: ${item.count}`);
      });
    }
    
    // Count by channel
    const channelCounts = await Order.aggregate([
      { $group: { _id: '$channel', count: { $sum: 1 } } }
    ]);
    
    console.log('\n📈 Order counts by channel:');
    if (channelCounts.length === 0) {
      console.log('No orders found');
    } else {
      channelCounts.forEach(item => {
        console.log(`${item._id}: ${item.count}`);
      });
    }
    
    process.exit();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}); 