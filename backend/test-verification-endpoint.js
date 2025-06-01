import mongoose from 'mongoose';
import Seller from './src/modules/seller/models/seller.model.js';
import WalletTransaction from './src/modules/seller/models/walletTransaction.model.js';
import { verifyRecharge } from './src/modules/seller/controllers/wallet.controller.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testVerificationEndpoint() {
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
        
        console.log(`🧪 Testing verification endpoint for seller: ${seller.email}`);
        console.log(`💰 Current wallet balance: ₹${seller.walletBalance || 0}`);
        
        // Test 1: Missing verification data
        console.log('\n🧪 Test 1: Missing verification data');
        const mockReqMissingData = {
            user: { id: seller._id.toString() },
            body: {}
        };
        
        let testRes1 = await simulateEndpoint(mockReqMissingData, verifyRecharge);
        console.log('Result:', testRes1);
        
        // Test 2: Invalid signature (mock test)
        console.log('\n🧪 Test 2: Invalid verification data');
        const mockReqInvalidData = {
            user: { id: seller._id.toString() },
            body: {
                razorpay_payment_id: 'pay_test123',
                razorpay_order_id: 'order_test123',
                razorpay_signature: 'invalid_signature',
                amount: 100
            }
        };
        
        let testRes2 = await simulateEndpoint(mockReqInvalidData, verifyRecharge);
        console.log('Result:', testRes2);
        
        // Test 3: Check if Razorpay service is properly configured
        console.log('\n🧪 Test 3: Razorpay service configuration');
        try {
            const razorpayService = await import('./src/services/razorpay.service.js');
            console.log('✅ Razorpay service loaded successfully');
            
            // Test signature verification with dummy data
            const testSignature = razorpayService.default.verifyPaymentSignature({
                razorpay_order_id: 'order_test123',
                razorpay_payment_id: 'pay_test123',
                razorpay_signature: 'test_signature'
            });
            
            console.log('Signature verification test:', testSignature);
        } catch (razorpayError) {
            console.error('❌ Razorpay service error:', razorpayError);
        }
        
        // Test 4: Environment variables
        console.log('\n🧪 Test 4: Environment variables');
        console.log('RAZORPAY_KEY_ID:', process.env.RAZORPAY_KEY_ID ? '✅ Set' : '❌ Missing');
        console.log('RAZORPAY_KEY_SECRET:', process.env.RAZORPAY_KEY_SECRET ? '✅ Set' : '❌ Missing');
        
    } catch (error) {
        console.error('❌ Error testing verification endpoint:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n🔌 Disconnected from MongoDB');
        process.exit(0);
    }
}

// Helper function to simulate endpoint call
async function simulateEndpoint(mockReq, controllerFunction) {
    return new Promise((resolve) => {
        const mockRes = {
            status: (code) => ({
                json: (data) => {
                    resolve({
                        status: code,
                        data: data
                    });
                }
            })
        };
        
        const mockNext = (error) => {
            resolve({
                status: 500,
                error: error?.message || 'Unknown error',
                errorCode: error?.status || 500
            });
        };
        
        controllerFunction(mockReq, mockRes, mockNext);
    });
}

// Run the test
testVerificationEndpoint(); 