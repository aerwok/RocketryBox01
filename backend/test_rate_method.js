/**
 * Test to verify if Delhivery uses API or Database rate cards
 */

// Set environment variables
process.env.DELHIVERY_API_TOKEN = 'a8473f4a9d74a88afaa4f7417abb427708a11a97';
process.env.DELHIVERY_CLIENT_NAME = 'RocketryBox';
process.env.NODE_ENV = 'production';

import { calculateShippingRates } from './src/utils/shipping.js';

console.log('\n🧪 Testing Delhivery Rate Calculation Method\n');

async function testRateMethod() {
  try {
    // Test package details
    const packageDetails = {
      weight: 1.5,
      paymentMode: 'COD',
      serviceType: 'Surface'
    };

    const deliveryDetails = {
      pickupPincode: '110001', // Delhi
      deliveryPincode: '400001' // Mumbai
    };

    console.log('📦 Package Details:');
    console.log(`   Weight: ${packageDetails.weight}kg`);
    console.log(`   Payment: ${packageDetails.paymentMode}`);
    console.log(`   Service: ${packageDetails.serviceType}`);

    console.log('\n📍 Delivery Route:');
    console.log(`   From: ${deliveryDetails.pickupPincode} (Delhi)`);
    console.log(`   To: ${deliveryDetails.deliveryPincode} (Mumbai)`);

    console.log('\n🔍 Calculating Delhivery rates...');

    // Calculate rates specifically for Delhivery
    const rates = await calculateShippingRates(packageDetails, deliveryDetails, ['Delhivery']);

    console.log('\n📊 Rate Calculation Results:');

    if (rates && rates.length > 0) {
      const delhiveryRate = rates[0];
      console.log('✅ Rate calculation successful');
      console.log(`   Provider: ${delhiveryRate.provider?.name || 'Unknown'}`);
      console.log(`   Total Rate: ₹${delhiveryRate.totalRate || 'N/A'}`);
      console.log(`   Service Type: ${delhiveryRate.provider?.serviceType || 'N/A'}`);
      console.log(`   Estimated Delivery: ${delhiveryRate.provider?.estimatedDays || delhiveryRate.transitTime || 'N/A'}`);

      // Check if it has API-specific properties
      if (delhiveryRate.breakdown) {
        console.log('\n💡 Rate Breakdown (indicates API usage):');
        console.log(`   Base Rate: ₹${delhiveryRate.breakdown.baseRate || 0}`);
        console.log(`   Fuel Surcharge: ₹${delhiveryRate.breakdown.fuelSurcharge || 0}`);
        console.log(`   Service Charge: ₹${delhiveryRate.breakdown.serviceCharge || 0}`);
        console.log(`   Additional Charges: ₹${delhiveryRate.breakdown.additionalCharges || 0}`);
        console.log(`   Tax: ₹${delhiveryRate.breakdown.tax || 0}`);

        if (delhiveryRate.breakdown.baseRate || delhiveryRate.breakdown.fuelSurcharge) {
          console.log('\n🎯 CONCLUSION: Using LIVE API RATES');
          console.log('   ✅ Delhivery API is providing detailed rate breakdown');
        } else {
          console.log('\n🎯 CONCLUSION: Using DATABASE RATE CARDS');
          console.log('   ⚠️ Falling back to hardcoded rate cards');
        }
      } else {
        console.log('\n🎯 CONCLUSION: Using DATABASE RATE CARDS');
        console.log('   ⚠️ No API rate breakdown found, using fallback rates');
      }

      // Check for API-specific error handling
      if (delhiveryRate.success === false) {
        console.log('\n❌ API Error Detected:');
        console.log(`   Error: ${delhiveryRate.error}`);
        console.log('   📝 System likely fell back to database rates');
      }

    } else {
      console.log('❌ No rates calculated');
      console.log('   📝 Check partner configuration or API connectivity');
    }

    console.log('\n📋 Rate Calculation Method Summary:');
    console.log('1. System attempts Delhivery API first');
    console.log('2. If API fails, falls back to database rate cards');
    console.log('3. Database rates are zone-based (WITHIN_CITY, METRO_TO_METRO, etc.)');
    console.log('4. API rates include detailed breakdowns (fuel, service charges)');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
  }
}

// Run the test
testRateMethod();
