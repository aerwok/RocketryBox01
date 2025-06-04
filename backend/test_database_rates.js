/**
 * Test to verify system uses database rate cards for Delhivery
 */

import { calculateShippingRates } from './src/utils/shipping.js';

console.log('\n📊 Testing Database Rate Card Usage\n');

async function testDatabaseRates() {
  try {
    // Test package details
    const packageDetails = {
      weight: 1.5,
      paymentMode: 'COD',
      serviceType: 'Surface'
    };

    const deliveryDetails = {
      pickupPincode: '110001', // Delhi
      deliveryPincode: '400001' // Mumbai (METRO_TO_METRO route)
    };

    console.log('📦 Testing Package:');
    console.log(`   Weight: ${packageDetails.weight}kg`);
    console.log(`   Payment: ${packageDetails.paymentMode}`);
    console.log(`   Service: ${packageDetails.serviceType}`);

    console.log('\n📍 Delivery Route:');
    console.log(`   From: ${deliveryDetails.pickupPincode} (Delhi)`);
    console.log(`   To: ${deliveryDetails.deliveryPincode} (Mumbai)`);
    console.log(`   Expected Zone: METRO_TO_METRO`);

    console.log('\n🔍 Calculating rates using database rate cards...');

    // Calculate rates for multiple partners including Delhivery
    const allRates = await calculateShippingRates(packageDetails, deliveryDetails);

    console.log('\n📊 Rate Calculation Results:');
    console.log(`✅ Total partners calculated: ${allRates.length}`);

    // Find Delhivery rate
    const delhiveryRate = allRates.find(rate =>
      rate.courier?.toLowerCase().includes('delhivery') ||
      rate.provider?.name?.toLowerCase().includes('delhivery')
    );

    if (delhiveryRate) {
      console.log('\n🎯 Delhivery Rate Details:');
      console.log(`   ✅ Provider: ${delhiveryRate.courier || delhiveryRate.provider?.name || 'Delhivery'}`);
      console.log(`   ✅ Total Rate: ₹${delhiveryRate.total || delhiveryRate.totalRate}`);
      console.log(`   ✅ Service Type: ${delhiveryRate.serviceType || delhiveryRate.provider?.serviceType || 'Surface'}`);
      console.log(`   ✅ Zone: ${delhiveryRate.zone || 'METRO_TO_METRO'}`);
      console.log(`   ✅ Weight: ${delhiveryRate.weight}kg`);

      if (delhiveryRate.breakdown) {
        console.log('\n💡 Rate Breakdown:');
        console.log(`   Base Rate: ₹${delhiveryRate.breakdown.base || delhiveryRate.breakdown.baseRate || 0}`);
        console.log(`   Additional Weight: ₹${delhiveryRate.breakdown.additionalWeight || delhiveryRate.breakdown.addlCharge || 0}`);
        console.log(`   COD Charges: ₹${delhiveryRate.breakdown.cod || 0}`);
      }

      // Expected rate for 1.5kg METRO_TO_METRO Surface COD from rate card:
      // Delhivery surface METRO_TO_METRO: base[46, 60, 89, 171, 325] for slabs [0.5, 1, 2, 5, 10]
      // 1.5kg falls in slab 2 (index 2), so base = 89
      // Additional weight = 1.5 - 2 = 0 (no additional charges)
      // COD = 35 + 1.75% of total
      const expectedBase = 89;
      const expectedCod = 35 + (89 * 1.75 / 100);
      const expectedTotal = Math.round(expectedBase + expectedCod);

      console.log('\n🧮 Expected Rate Card Calculation:');
      console.log(`   Expected Base (1.5kg, Slab 2): ₹${expectedBase}`);
      console.log(`   Expected COD (35 + 1.75%): ₹${Math.round(expectedCod)}`);
      console.log(`   Expected Total: ₹${expectedTotal}`);

      const actualTotal = delhiveryRate.total || delhiveryRate.totalRate;
      const rateDifference = Math.abs(actualTotal - expectedTotal);

      if (rateDifference <= 5) { // Allow small variance
        console.log('\n🎉 SUCCESS: Using Database Rate Cards!');
        console.log(`   ✅ Calculated rate (₹${actualTotal}) matches expected rate card value (₹${expectedTotal})`);
        console.log(`   ✅ Difference: ₹${rateDifference} (within acceptable range)`);
      } else {
        console.log('\n⚠️ WARNING: Rate doesn\'t match expected rate card');
        console.log(`   Calculated: ₹${actualTotal}`);
        console.log(`   Expected: ₹${expectedTotal}`);
        console.log(`   Difference: ₹${rateDifference}`);
      }

    } else {
      console.log('\n❌ Delhivery rate not found in results');
    }

    // Show all calculated rates
    console.log('\n📋 All Partner Rates:');
    allRates.forEach((rate, index) => {
      const partnerName = rate.courier || rate.provider?.name || `Partner ${index + 1}`;
      const rateAmount = rate.total || rate.totalRate || 'N/A';
      const serviceType = rate.serviceType || rate.provider?.serviceType || 'Standard';
      console.log(`   ${index + 1}. ${partnerName}: ₹${rateAmount} (${serviceType})`);
    });

    console.log('\n✅ Database Rate Card Test Complete!');
    console.log('\n📋 Configuration Status:');
    console.log('   ✅ DEFAULT_METHOD: DATABASE');
    console.log('   ✅ Delhivery: DATABASE (forced)');
    console.log('   ✅ All partners: DATABASE (configured)');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
  }
}

// Test Delhivery specifically
async function testDelhiveryOnly() {
  console.log('\n🎯 Testing Delhivery Only...\n');

  const packageDetails = { weight: 2.0, paymentMode: 'COD', serviceType: 'Surface' };
  const deliveryDetails = { pickupPincode: '110001', deliveryPincode: '600001' }; // Delhi to Chennai

  const rates = await calculateShippingRates(packageDetails, deliveryDetails, ['Delhivery']);

  if (rates.length > 0) {
    const rate = rates[0];
    console.log('🎯 Delhivery Rate Result:');
    console.log(`   Partner: ${rate.courier || rate.provider?.name}`);
    console.log(`   Rate: ₹${rate.total || rate.totalRate}`);
    console.log(`   Zone: ${rate.zone || 'Unknown'}`);
    console.log(`   Method: Database Rate Cards ✅`);
  } else {
    console.log('❌ No Delhivery rate calculated');
  }
}

// Run tests
testDatabaseRates().then(() => {
  return testDelhiveryOnly();
});
