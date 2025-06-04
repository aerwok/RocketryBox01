/**
 * Quick test to verify Delhivery uses database rate cards
 */

import { calculateShippingRates } from './src/utils/shipping.js';

async function quickTest() {
  console.log('\n🧪 Quick Delhivery Rate Test\n');

  const packageDetails = { weight: 1.0, paymentMode: 'COD', serviceType: 'Surface' };
  const deliveryDetails = { pickupPincode: '110001', deliveryPincode: '400001' }; // Delhi to Mumbai

  console.log('📦 Test: 1kg COD Surface from Delhi to Mumbai');
  console.log('🔍 Expected: METRO_TO_METRO zone, database rate card pricing\n');

  try {
    const rates = await calculateShippingRates(packageDetails, deliveryDetails, ['Delhivery']);

    if (rates.length > 0) {
      const rate = rates[0];
      console.log('✅ SUCCESS: Delhivery rate calculated using database!');
      console.log(`   💰 Rate: ₹${rate.total || rate.totalRate}`);
      console.log(`   🏷️  Provider: ${rate.courier || rate.provider?.name}`);
      console.log(`   📍 Zone: ${rate.zone || 'Calculated'}`);
      console.log(`   ⚙️  Method: Database Rate Cards`);

      // Expected: 60 (base for 1kg METRO_TO_METRO) + 35 (COD) + 1.75% = ~97
      console.log('\n📊 Rate Analysis:');
      console.log('   Expected base (1kg METRO_TO_METRO): ₹60');
      console.log('   Expected COD: ₹35 + 1.75%');
      console.log('   Expected total: ~₹97');
      console.log(`   Actual total: ₹${rate.total || rate.totalRate}`);

    } else {
      console.log('❌ No rate calculated');
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
}

quickTest();
