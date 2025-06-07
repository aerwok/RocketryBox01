import mongoose from 'mongoose';
import SellerOrder from './src/modules/seller/models/order.model.js';

// Connect to MongoDB
async function connectDB() {
  try {
    await mongoose.connect('mongodb://localhost:27017/rocketrybox');
    console.log('📡 Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  }
}

// Create test order
async function createTestOrder() {
  try {
    await connectDB();

    // Use a generic seller ID (you can replace with actual seller ID)
    const sellerId = new mongoose.Types.ObjectId('507f1f77bcf86cd799439011');

    // Sample test order
    const testOrder = {
      seller: sellerId,
      orderId: 'TEST-001',
      orderDate: new Date(),
      customer: {
        name: 'John Doe',
        phone: '9876543210',
        email: 'john@example.com',
        address: {
          street: '123 Test Street, Apartment 4B',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400001',
          country: 'India'
        }
      },
      product: {
        name: 'Test Product',
        sku: 'TEST-SKU-001',
        quantity: 1,
        price: 1000,
        weight: '0.5',
        dimensions: {
          length: 10,
          width: 10,
          height: 5
        }
      },
      payment: {
        method: 'COD',
        amount: '1000',
        codCharge: '50',
        shippingCharge: '0',
        gst: '180',
        total: '1230'
      },
      status: 'Created',
      channel: 'MANUAL',
      orderTimeline: [{
        status: 'Created',
        timestamp: new Date(),
        comment: 'Test order created for shipping demo'
      }]
    };

    // Check if order already exists
    const existingOrder = await SellerOrder.findOne({ orderId: 'TEST-001' });
    if (existingOrder) {
      console.log('⚠️ Test order already exists:', existingOrder.orderId);
      return;
    }

    // Create the order
    const createdOrder = await SellerOrder.create(testOrder);
    console.log('✅ Test order created:', {
      orderId: createdOrder.orderId,
      status: createdOrder.status,
      customerName: createdOrder.customer.name,
      sellerId: createdOrder.seller.toString()
    });

    // List all orders
    const allOrders = await SellerOrder.find({}).select('orderId status customer.name seller');
    console.log('📋 All orders in database:', allOrders.map(o => ({
      orderId: o.orderId,
      status: o.status,
      customerName: o.customer?.name,
      sellerId: o.seller.toString()
    })));

    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating test order:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

createTestOrder();
