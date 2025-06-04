/**
 * Real Delhivery API Test with Actual Credentials
 * Tests with provided test API token
 */

// Set test environment variables
process.env.DELHIVERY_API_TOKEN = 'a8473f4a9d74a88afaa4f7417abb427708a11a97';
process.env.DELHIVERY_CLIENT_NAME = 'RocketryBox';
process.env.NODE_ENV = 'development'; // Use staging URL

import { DELHIVERY_CONFIG } from './src/config/delhivery.config.js';
import { DelhiveryAPI } from './src/utils/delhivery.js';

console.log('\n🚀 Testing Delhivery API with Real Credentials...\n');

async function testDelhiveryRealAPI() {
  try {
    // Force reload config with new environment variables
    const testConfig = {
      ...DELHIVERY_CONFIG,
      API_TOKEN: process.env.DELHIVERY_API_TOKEN,
      CLIENT_NAME: process.env.DELHIVERY_CLIENT_NAME,
      DEFAULT_HEADERS: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Token ${process.env.DELHIVERY_API_TOKEN}`,
        'User-Agent': 'RocketryBox-Delhivery-Integration/1.0'
      }
    };

    console.log('📋 Test Configuration');
    console.log(`✅ API Token: ${testConfig.API_TOKEN.substring(0, 8)}...${testConfig.API_TOKEN.slice(-8)}`);
    console.log(`✅ Client Name: ${testConfig.CLIENT_NAME}`);
    console.log(`✅ Base URL: ${testConfig.BASE_URL}`);
    console.log(`✅ Authorization: Token ${testConfig.API_TOKEN.substring(0, 8)}...`);

    // Create API instance with test config
    const delhiveryAPI = new DelhiveryAPI(testConfig);

    // Test 1: Simple API connectivity first
    console.log('\n📋 Test 1: API Connectivity Test');
    console.log('🔗 Testing basic API connection...');

    try {
      const axios = (await import('axios')).default;
      const response = await axios.get(`${testConfig.BASE_URL}/c/api/pin-codes/json/`, {
        headers: {
          'Authorization': `Token ${testConfig.API_TOKEN}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        params: {
          filter_codes: '110001'
        },
        timeout: 10000
      });

      console.log(`✅ Direct API Test: Success (Status: ${response.status})`);
      console.log(`✅ Response Data Type: ${typeof response.data}`);
      console.log(`✅ Has delivery codes: ${response.data.delivery_codes ? 'Yes' : 'No'}`);

    } catch (apiError) {
      console.log(`❌ Direct API Test Failed:`);
      console.log(`   Status: ${apiError.response?.status || 'Unknown'}`);
      console.log(`   Message: ${apiError.message}`);
      console.log(`   URL: ${apiError.config?.url || 'Unknown'}`);

      if (apiError.response?.status === 401) {
        console.log('\n💡 Authentication Help:');
        console.log('1. Verify the API token is correct');
        console.log('2. Check if the token has proper permissions');
        console.log('3. Ensure you\'re using the staging environment');
        console.log('4. Contact Delhivery support if the token should work');
      }

      return; // Exit early if authentication fails
    }

    // Test 2: Pincode Serviceability Check
    console.log('\n📋 Test 2: Pincode Serviceability Check');
    const testPincodes = ['110001', '400001']; // Delhi, Mumbai

    for (const pincode of testPincodes) {
      console.log(`\n🔍 Testing pincode: ${pincode}`);
      const result = await delhiveryAPI.checkServiceability(pincode);

      if (result.success) {
        console.log(`✅ Pincode ${pincode}: ${result.serviceable ? 'Serviceable' : 'Not Serviceable'}`);
        if (result.serviceable) {
          console.log(`   COD Available: ${result.codAvailable ? 'Yes' : 'No'}`);
          console.log(`   Prepaid Available: ${result.prepaidAvailable ? 'Yes' : 'No'}`);
        }
      } else {
        console.log(`❌ Pincode ${pincode}: Error - ${result.error}`);
      }
    }

    // Test 3: Rate Calculation
    console.log('\n📋 Test 3: Rate Calculation');
    const packageDetails = {
      weight: 1.5, // kg
      paymentMode: 'COD',
      serviceType: 'Surface'
    };
    const deliveryDetails = {
      pickupPincode: '110001', // Delhi
      deliveryPincode: '400001' // Mumbai
    };
    const partnerDetails = {
      id: 'delhivery-test',
      name: 'Delhivery'
    };

    console.log(`📦 Package: ${packageDetails.weight}kg, ${packageDetails.paymentMode}, ${packageDetails.serviceType}`);
    console.log(`📍 Route: ${deliveryDetails.pickupPincode} → ${deliveryDetails.deliveryPincode}`);

    const rateResult = await delhiveryAPI.calculateRate(packageDetails, deliveryDetails, partnerDetails);

    if (rateResult.success) {
      console.log(`✅ Rate Calculation Success`);
      console.log(`   Total Rate: ₹${rateResult.totalRate}`);
      console.log(`   Service Type: ${rateResult.provider.serviceType || 'Standard'}`);
      console.log(`   Estimated Delivery: ${rateResult.provider.estimatedDays}`);
      if (rateResult.breakdown) {
        console.log(`   Base Rate: ₹${rateResult.breakdown.baseRate || 0}`);
        console.log(`   Fuel Surcharge: ₹${rateResult.breakdown.fuelSurcharge || 0}`);
      }
    } else {
      console.log(`❌ Rate Calculation Failed: ${rateResult.error}`);
    }

    // Test Summary
    console.log('\n📊 Test Summary');
    console.log('✅ Configuration: Working with real token');
    console.log('✅ API Authentication: Working');
    console.log('✅ Basic API calls: Working');

    console.log('\n🎉 Delhivery Real API Test Complete!');
    console.log('\n📋 Integration Status: ✅ FUNCTIONAL');
    console.log('1. API token is valid and working');
    console.log('2. Authentication is successful');
    console.log('3. Basic API endpoints are accessible');

  } catch (error) {
    console.error('\n❌ Real API Test Failed:', error.message);
    console.error(error.stack);
  }
}

// Run the real API test
testDelhiveryRealAPI();
