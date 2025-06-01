import mongoose from 'mongoose';
import Order from './src/modules/seller/models/order.model.js';

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/test', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

async function clearDuplicateOrders() {
    try {
        console.log('Connecting to database...');
        
        // Delete orders with specific test orderIds
        const testOrderIds = ['NT0075']; // Add more test order IDs if needed
        
        for (const orderId of testOrderIds) {
            const result = await Order.deleteMany({ orderId });
            console.log(`Deleted ${result.deletedCount} orders with orderId: ${orderId}`);
        }
        
        console.log('Cleanup completed!');
        process.exit(0);
    } catch (error) {
        console.error('Error during cleanup:', error);
        process.exit(1);
    }
}

clearDuplicateOrders(); 