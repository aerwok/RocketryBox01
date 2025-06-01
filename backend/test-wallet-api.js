import express from 'express';
import mongoose from 'mongoose';
import Seller from './src/modules/seller/models/seller.model.js';
import WalletTransaction from './src/modules/seller/models/walletTransaction.model.js';
import { listWalletTransactions } from './src/modules/seller/controllers/wallet.controller.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testWalletAPI() {
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
        
        console.log(`🧪 Testing wallet API for seller: ${seller.email}`);
        console.log(`🆔 Seller ID: ${seller._id}`);
        
        // Test direct database query
        const transactions = await WalletTransaction.find({ seller: seller._id })
            .sort({ date: -1 })
            .limit(10);
            
        console.log(`📊 Direct DB query found ${transactions.length} transactions`);
        
        if (transactions.length > 0) {
            console.log('📝 Sample transaction structure:');
            console.log(JSON.stringify(transactions[0], null, 2));
        }
        
        // Simulate API controller call
        const mockReq = {
            user: { id: seller._id.toString() },
            query: { page: 1, limit: 10 }
        };
        
        const mockRes = {
            status: (code) => ({
                json: (data) => {
                    console.log('\n📡 API Controller Response:');
                    console.log(`Status: ${code}`);
                    console.log('Response Structure:');
                    console.log(JSON.stringify(data, null, 2));
                    
                    // Verify response format
                    if (data.success && data.data && data.pagination) {
                        console.log('\n✅ Response format is correct:');
                        console.log(`- success: ${data.success}`);
                        console.log(`- data: array of ${data.data.length} transactions`);
                        console.log(`- pagination: page ${data.pagination.page} of ${data.pagination.pages}`);
                    } else {
                        console.log('\n❌ Response format is incorrect');
                    }
                }
            })
        };
        
        const mockNext = (error) => {
            if (error) {
                console.error('❌ API Controller Error:', error);
            }
        };
        
        console.log('\n🚀 Testing API controller...');
        await listWalletTransactions(mockReq, mockRes, mockNext);
        
    } catch (error) {
        console.error('❌ Error testing wallet API:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n🔌 Disconnected from MongoDB');
        process.exit(0);
    }
}

// Run the test
testWalletAPI(); 