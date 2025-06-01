import mongoose from 'mongoose';
import Seller from './src/modules/seller/models/seller.model.js';
import WalletTransaction from './src/modules/seller/models/walletTransaction.model.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function clearWalletDemoData() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_ATLAS_URI, {
            dbName: process.env.DB_NAME || 'RocketryBox'
        });
        
        console.log('🔌 Connected to MongoDB');
        
        // Clear all wallet transactions
        const deletedTransactions = await WalletTransaction.deleteMany({});
        console.log(`🗑️  Deleted ${deletedTransactions.deletedCount} wallet transactions`);
        
        // Reset all seller wallet balances to 0
        const updatedSellers = await Seller.updateMany(
            {}, 
            { 
                $set: { 
                    walletBalance: '0.00' 
                } 
            }
        );
        console.log(`💰 Reset wallet balance for ${updatedSellers.modifiedCount} sellers`);
        
        console.log('✅ Demo wallet data cleared successfully!');
        console.log('📊 Summary:');
        console.log(`   - Wallet transactions deleted: ${deletedTransactions.deletedCount}`);
        console.log(`   - Seller balances reset: ${updatedSellers.modifiedCount}`);
        
    } catch (error) {
        console.error('❌ Error clearing wallet demo data:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
        process.exit(0);
    }
}

// Run the script
clearWalletDemoData(); 