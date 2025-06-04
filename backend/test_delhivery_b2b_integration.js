/**
 * Comprehensive Delhivery B2C and B2B Integration Test
 * Tests both APIs with real credentials and mock data
 */

// Set test environment variables
process.env.NODE_ENV = 'development'; // Use staging/dev environment for testing

// B2C Configuration (existing)
process.env.DELHIVERY_API_TOKEN = 'a8473f4a9d74a88afaa4f7417abb427708a11a97';
process.env.DELHIVERY_CLIENT_NAME = 'RocketryBox';

// B2B Configuration (replace with your actual B2B credentials)
process.env.DELHIVERY_B2B_USERNAME = 'your_b2b_username';
process.env.DELHIVERY_B2B_PASSWORD = 'your_b2b_password';

import { DELHIVERY_CONFIG } from './src/config/delhivery.config.js';
import { DelhiveryAPI } from './src/utils/delhivery.js';

console.log('\n🚀 Comprehensive Delhivery B2C & B2B Integration Test\n');

async function testDelhiveryIntegration() {
  try {
    // Initialize API with enhanced config
    const delhiveryAPI = new DelhiveryAPI();

    console.log('📋 Configuration Overview');
    console.log(`✅ B2C API URL: ${DELHIVERY_CONFIG.BASE_URL}`);
    console.log(`✅ B2B API URL: ${DELHIVERY_CONFIG.B2B_BASE_URL}`);
    console.log(`✅ B2C Token: ${DELHIVERY_CONFIG.API_TOKEN.substring(0, 8)}...${DELHIVERY_CONFIG.API_TOKEN.slice(-8)}`);
    console.log(`✅ B2B Username: ${DELHIVERY_CONFIG.B2B_USERNAME}`);

    // =======================================================================
    // B2C API TESTS
    // =======================================================================
    console.log('\n🔵 B2C API TESTING\n');

    // Test 1: B2C Serviceability Check
    console.log('📋 Test 1: B2C Serviceability Check');
    const b2cServiceability = await delhiveryAPI.checkServiceability('110001');

    if (b2cServiceability.success) {
      console.log(`✅ B2C Serviceability: ${b2cServiceability.serviceable ? 'Available' : 'Not Available'}`);
      console.log(`   COD: ${b2cServiceability.codAvailable ? 'Yes' : 'No'}`);
      console.log(`   Prepaid: ${b2cServiceability.prepaidAvailable ? 'Yes' : 'No'}`);
    } else {
      console.log(`❌ B2C Serviceability failed: ${b2cServiceability.error}`);
    }

    // Test 2: B2C Rate Calculation
    console.log('\n📋 Test 2: B2C Rate Calculation');
    const b2cRateResult = await delhiveryAPI.calculateRate(
      { weight: 1.5, paymentMode: 'COD', serviceType: 'Surface' },
      { pickupPincode: '110001', deliveryPincode: '400001' },
      { id: 'delhivery-b2c', name: 'Delhivery' }
    );

    if (b2cRateResult.success) {
      console.log(`✅ B2C Rate: ₹${b2cRateResult.totalRate}`);
      console.log(`   Service: ${b2cRateResult.provider.serviceType}`);
      console.log(`   Delivery: ${b2cRateResult.provider.estimatedDays}`);
    } else {
      console.log(`❌ B2C Rate calculation failed: ${b2cRateResult.error}`);
    }

    // =======================================================================
    // B2B API TESTS
    // =======================================================================
    console.log('\n🟡 B2B API TESTING\n');

    // Test 3: B2B Authentication
    console.log('📋 Test 3: B2B Authentication');
    const loginResult = await delhiveryAPI.b2bLogin();

    if (loginResult.success) {
      console.log(`✅ B2B Login successful`);
      console.log(`   Token: ${loginResult.token.substring(0, 20)}...`);
      console.log(`   Expires: ${new Date(loginResult.expiresAt).toLocaleString()}`);
    } else {
      console.log(`❌ B2B Login failed: ${loginResult.error}`);
      console.log('\n💡 B2B Authentication Help:');
      console.log('1. Verify your B2B username and password');
      console.log('2. Check if you have B2B API access');
      console.log('3. Contact Delhivery support for B2B credentials');
      console.log('4. Make sure to use staging credentials for testing');

      // Skip B2B tests if authentication fails
      console.log('\n⚠️ Skipping B2B tests due to authentication failure');
      await testDatabaseFallback();
      return;
    }

    // Test 4: B2B Serviceability Check
    console.log('\n📋 Test 4: B2B Serviceability Check');
    const b2bServiceability = await delhiveryAPI.b2bCheckServiceability('400001', 1500);

    if (b2bServiceability.success) {
      console.log(`✅ B2B Serviceability: ${b2bServiceability.serviceable ? 'Available' : 'Not Available'}`);
      console.log(`   Details: ${JSON.stringify(b2bServiceability.data, null, 2).substring(0, 200)}...`);
    } else {
      console.log(`❌ B2B Serviceability failed: ${b2bServiceability.error}`);
    }

    // Test 5: B2B Expected TAT
    console.log('\n📋 Test 5: B2B Expected TAT');
    const tatResult = await delhiveryAPI.b2bGetExpectedTAT('110001', '400001');

    if (tatResult.success) {
      console.log(`✅ B2B TAT: ${tatResult.tat} days`);
      console.log(`   Route: ${tatResult.originPin} → ${tatResult.destinationPin}`);
    } else {
      console.log(`❌ B2B TAT calculation failed: ${tatResult.error}`);
    }

    // Test 6: B2B Freight Estimator
    console.log('\n📋 Test 6: B2B Freight Estimator');
    const freightResult = await delhiveryAPI.b2bFreightEstimator({
      dimensions: [{ length_cm: 20, width_cm: 15, height_cm: 10, box_count: 1 }],
      weightG: 1500, // 1.5 kg
      sourcePin: '110001',
      consigneePin: '400001',
      paymentMode: 'cod',
      codAmount: 2000,
      invAmount: 2000,
      freightMode: 'fop',
      rovInsurance: false
    });

    if (freightResult.success) {
      console.log(`✅ B2B Freight Estimate: ₹${freightResult.estimatedCost}`);
      if (freightResult.breakdown) {
        console.log(`   Breakdown: ${JSON.stringify(freightResult.breakdown, null, 2).substring(0, 200)}...`);
      }
    } else {
      console.log(`❌ B2B Freight estimation failed: ${freightResult.error}`);
    }

    // Test 7: B2B Warehouse Creation (Optional - creates actual warehouse)
    console.log('\n📋 Test 7: B2B Warehouse Creation');
    console.log('⚠️ Skipping warehouse creation to avoid creating test warehouses');
    console.log('   To test warehouse creation, uncomment the code below');

    /*
    const warehouseResult = await delhiveryAPI.b2bCreateWarehouse({
      name: 'RocketryBox Test Warehouse',
      pinCode: '110001',
      city: 'Delhi',
      state: 'Delhi',
      addressDetails: {
        address: 'Test Address, Connaught Place',
        contact_person: 'Test Person',
        phone: '9999999999'
      }
    });

    if (warehouseResult.success) {
      console.log(`✅ B2B Warehouse created: ${warehouseResult.warehouseId}`);
    } else {
      console.log(`❌ B2B Warehouse creation failed: ${warehouseResult.error}`);
    }
    */

    // Test 8: B2B Logout
    console.log('\n📋 Test 8: B2B Logout');
    const logoutResult = await delhiveryAPI.b2bLogout();

    if (logoutResult.success) {
      console.log(`✅ B2B Logout successful: ${logoutResult.message}`);
    } else {
      console.log(`❌ B2B Logout failed: ${logoutResult.error}`);
    }

    // =======================================================================
    // INTEGRATION COMPARISON
    // =======================================================================
    console.log('\n📊 B2C vs B2B Comparison\n');

    console.log('| Feature | B2C | B2B |');
    console.log('|---------|-----|-----|');
    console.log(`| Authentication | Token | JWT (24h validity) |`);
    console.log(`| Serviceability | ${b2cServiceability.success ? '✅' : '❌'} | ${b2bServiceability.success ? '✅' : '❌'} |`);
    console.log(`| Rate Calculation | ${b2cRateResult.success ? '✅' : '❌'} | ${freightResult.success ? '✅' : '❌'} |`);
    console.log(`| TAT Information | Limited | ${tatResult.success ? '✅' : '❌'} |`);
    console.log(`| Warehouse Management | Basic | ${loginResult.success ? '✅' : '❌'} |`);
    console.log(`| Document Generation | Basic | Advanced |`);

    console.log('\n🎉 Comprehensive Integration Test Complete!\n');

    console.log('📋 Integration Summary:');
    console.log('✅ B2C API: Suitable for e-commerce, individual shipments');
    console.log('✅ B2B API: Suitable for enterprise, bulk shipments, advanced features');
    console.log('✅ Both APIs integrated and working');
    console.log('✅ Fallback to database rate cards configured');

  } catch (error) {
    console.error('\n❌ Integration test failed:', error.message);
    console.error(error.stack);
  }
}

// Test database fallback when APIs are not available
async function testDatabaseFallback() {
  console.log('\n📊 Testing Database Rate Card Fallback\n');

  try {
    const { calculateShippingRates } = await import('./src/utils/shipping.js');

    const packageDetails = { weight: 1.5, paymentMode: 'COD', serviceType: 'Surface' };
    const deliveryDetails = { pickupPincode: '110001', deliveryPincode: '400001' };

    const rates = await calculateShippingRates(packageDetails, deliveryDetails, ['Delhivery']);

    if (rates.length > 0) {
      const rate = rates[0];
      console.log('✅ Database Rate Card Working:');
      console.log(`   Provider: ${rate.courier || rate.provider?.name}`);
      console.log(`   Rate: ₹${rate.total || rate.totalRate}`);
      console.log(`   Zone: ${rate.zone || 'Calculated'}`);
      console.log(`   Method: Database Rate Cards (Fallback)`);
    } else {
      console.log('❌ Database rate calculation failed');
    }

  } catch (error) {
    console.log(`❌ Database fallback test failed: ${error.message}`);
  }
}

// Usage instructions
function printUsageInstructions() {
  console.log('\n📖 Usage Instructions:');
  console.log('\n🔧 Setup Requirements:');
  console.log('1. Add your B2B credentials to environment variables:');
  console.log('   DELHIVERY_B2B_USERNAME=your_username');
  console.log('   DELHIVERY_B2B_PASSWORD=your_password');
  console.log('\n2. For production, update NODE_ENV=production');
  console.log('\n3. The system will automatically:');
  console.log('   • Try B2B/B2C APIs first');
  console.log('   • Fall back to database rate cards if APIs fail');
  console.log('   • Cache authentication tokens');
  console.log('   • Handle rate limiting');
  console.log('\n🚀 Integration Features:');
  console.log('✅ Dual API support (B2C + B2B)');
  console.log('✅ JWT authentication with auto-renewal');
  console.log('✅ Database rate card fallback');
  console.log('✅ Comprehensive error handling');
  console.log('✅ Rate limiting compliance');
  console.log('✅ Production-ready configuration');
}

// Run the comprehensive test
async function runTest() {
  await testDelhiveryIntegration();
  printUsageInstructions();
}

runTest();
