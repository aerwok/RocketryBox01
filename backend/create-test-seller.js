import mongoose from 'mongoose';
import Seller from './src/modules/seller/models/seller.model.js';
import WalletTransaction from './src/modules/seller/models/walletTransaction.model.js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function createTestSeller() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_ATLAS_URI, {
            dbName: process.env.DB_NAME || 'RocketryBox'
        });
        
        console.log('🔌 Connected to MongoDB');
        
        // Check if test seller already exists
        const existingSeller = await Seller.findOne({ email: 'testseller@rocketrybox.com' });
        
        if (existingSeller) {
            console.log('✅ Test seller already exists');
            console.log(`📧 Email: ${existingSeller.email}`);
            console.log(`💰 Wallet Balance: ₹${existingSeller.walletBalance || 0}`);
            
            // Check transactions
            const transactionCount = await WalletTransaction.countDocuments({ seller: existingSeller._id });
            console.log(`📊 Wallet Transactions: ${transactionCount}`);
            
            return;
        }
        
        // Create test seller
        const hashedPassword = await bcrypt.hash('password123', 12);
        
        const testSeller = await Seller.create({
            name: 'Test Seller',
            email: 'testseller@rocketrybox.com',
            password: hashedPassword,
            phone: '9876543210',
            businessName: 'Test Business',
            gstNumber: '27ABCDE1234F2Z5',
            walletBalance: '0.00',
            status: 'active',
            isEmailVerified: true,
            isPhoneVerified: true
        });
        
        console.log('✅ Test seller created successfully!');
        console.log(`📧 Email: ${testSeller.email}`);
        console.log(`🔐 Password: password123`);
        console.log(`💰 Initial Wallet Balance: ₹${testSeller.walletBalance}`);
        console.log(`🆔 Seller ID: ${testSeller._id}`);
        
        console.log('\n🧪 You can now test the wallet functionality with:');
        console.log('- Email: testseller@rocketrybox.com');
        console.log('- Password: password123');
        
    } catch (error) {
        console.error('❌ Error creating test seller:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
        process.exit(0);
    }
}

// Run the script
createTestSeller(); 