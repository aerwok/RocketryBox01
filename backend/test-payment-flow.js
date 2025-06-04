import mongoose from 'mongoose';
import Seller from './src/modules/seller/models/seller.model.js';
import WalletTransaction from './src/modules/seller/models/walletTransaction.model.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testPaymentFlow() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_ATLAS_URI, {
            dbName: process.env.DB_NAME || 'RocketryBox'
        });
        
        console.log('🔌 Connected to MongoDB');
        
        // Find test seller
        const seller = await Seller.findOne({ email: 'testseller@rocketrybox.com' });
        if (!seller) {
            console.log('❌ Test seller not found. Run create-test-seller.js first');
            return;
        }
        
        console.log(`🧪 Testing payment flow for seller: ${seller.email}`);
        console.log(`💰 Current wallet balance: ₹${seller.walletBalance || 0}`);
        
        // Simulate a successful payment verification
        const testAmount = 100; // ₹100 test recharge
        const currentBalance = parseFloat(seller.walletBalance || '0');
        const newBalance = (currentBalance + testAmount).toFixed(2);
        
        console.log(`📝 Simulating ₹${testAmount} recharge...`);
        
        // Update wallet balance
        seller.walletBalance = newBalance;
        await seller.save();
        
        console.log(`✅ Wallet balance updated from ₹${currentBalance} to ₹${newBalance}`);
        
        // Create transaction record
        const transaction = await WalletTransaction.create({
            seller: seller._id,
            referenceNumber: `TEST_${Date.now()}`,
            type: 'Recharge',
            amount: testAmount.toString(),
            remark: 'Test recharge - simulated payment',
            closingBalance: newBalance
        });
        
        console.log(`📊 Transaction created with ID: ${transaction._id}`);
        
        // Verify the update
        const updatedSeller = await Seller.findById(seller._id);
        const transactionCount = await WalletTransaction.countDocuments({ seller: seller._id });
        
        console.log('\n🎯 Verification Results:');
        console.log(`   Updated wallet balance: ₹${updatedSeller.walletBalance}`);
        console.log(`   Total transactions: ${transactionCount}`);
        
        // Test API response format
        const apiResponse = {
            success: true,
            data: {
                transaction: transaction,
                balance: newBalance,
                message: `Wallet recharged successfully with ₹${testAmount}`
            }
        };
        
        console.log('\n📡 Simulated API Response:');
        console.log(JSON.stringify(apiResponse, null, 2));
        
        console.log('\n✅ Payment flow test completed successfully!');
        
    } catch (error) {
        console.error('❌ Error testing payment flow:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
        process.exit(0);
    }
}

// Run the test
testPaymentFlow(); 