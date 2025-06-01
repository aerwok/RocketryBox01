import mongoose from 'mongoose';
import WalletTransaction from './src/modules/seller/models/walletTransaction.model.js';
import Seller from './src/modules/seller/models/seller.model.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testWalletHistory() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_ATLAS_URI, {
            dbName: process.env.DB_NAME || 'RocketryBox'
        });
        
        console.log('🔌 Connected to MongoDB');
        
        // Get a seller to test with
        const seller = await Seller.findOne({});
        if (!seller) {
            console.log('❌ No sellers found in database');
            return;
        }
        
        console.log(`🧪 Testing with seller: ${seller._id} (${seller.email})`);
        
        // Check wallet transactions for this seller
        const transactions = await WalletTransaction.find({ seller: seller._id })
            .sort({ date: -1 })
            .limit(10);
            
        console.log(`📊 Found ${transactions.length} wallet transactions`);
        
        if (transactions.length > 0) {
            console.log('📝 Sample transaction:', {
                id: transactions[0]._id,
                type: transactions[0].type,
                amount: transactions[0].amount,
                date: transactions[0].date,
                closingBalance: transactions[0].closingBalance
            });
        }
        
        // Test pagination
        const total = await WalletTransaction.countDocuments({ seller: seller._id });
        const page = 1;
        const limit = 10;
        const pages = Math.ceil(total / limit);
        
        console.log('🔢 Pagination test:', {
            total,
            page,
            limit,
            pages
        });
        
        // Simulate API response
        const apiResponse = {
            success: true,
            data: transactions,
            pagination: {
                total,
                page: parseInt(page),
                pages
            }
        };
        
        console.log('✅ Simulated API response structure:', {
            success: apiResponse.success,
            dataCount: apiResponse.data.length,
            pagination: apiResponse.pagination
        });
        
    } catch (error) {
        console.error('❌ Error testing wallet history:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
        process.exit(0);
    }
}

// Run the test
testWalletHistory(); 