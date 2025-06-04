import mongoose from 'mongoose';
import RateCard from './src/models/ratecard.model.js';
import rateCardService from './src/services/ratecard.service.js';

// Connect to MongoDB
const MONGODB_URI = 'mongodb+srv://aerwoktheweb:ElgqUh9k2u1KeYBb@rocketrybox.lvmzkf9.mongodb.net/?retryWrites=true&w=majority&appName=RocketryBox';

console.log('🔧 Testing Rate Calculation with MongoDB Data...\n');

mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log('✅ Connected to MongoDB\n');
    
    // Test 1: Check MongoDB data
    console.log('📊 MongoDB Rate Card Data:');
    const allCards = await RateCard.find({ isActive: true }).limit(5);
    allCards.forEach(card => {
      console.log(`  - ${card.courier} | ${card.zone} | Base: ₹${card.baseRate} | Add: ₹${card.addlRate} | COD: ₹${card.codAmount}`);
    });
    
    // Test 2: Test zone filtering
    console.log('\n🗺️ Testing Zone Filtering:');
    const withinCityCards = await rateCardService.getAllRateCards({ zone: 'Within City' });
    console.log(`  - Within City rate cards: ${withinCityCards.count}`);
    
    const metroCards = await rateCardService.getAllRateCards({ zone: 'Metro to Metro' });
    console.log(`  - Metro to Metro rate cards: ${metroCards.count}`);
    
    // Test 3: Test pincode to zone determination
    console.log('\n🎯 Testing Zone Determination:');
    const pickupInfo = rateCardService.getPincodeInfo('110001'); // Delhi
    const deliveryInfo = rateCardService.getPincodeInfo('110002'); // Delhi
    console.log(`  - Pickup (110001): ${pickupInfo?.city}, ${pickupInfo?.state}`);
    console.log(`  - Delivery (110002): ${deliveryInfo?.city}, ${deliveryInfo?.state}`);
    
    // Determine zone manually
    let zone = 'Rest of India';
    if (pickupInfo && deliveryInfo) {
      if (pickupInfo.city === deliveryInfo.city) {
        zone = 'Within City';
      } else if (pickupInfo.state === deliveryInfo.state) {
        zone = 'Within State';
      }
    }
    console.log(`  - Determined Zone: ${zone}`);
    
    // Test 4: Get rate cards for this zone
    console.log('\n💰 Testing Rate Calculation:');
    const zoneCards = await rateCardService.getAllRateCards({ zone: zone });
    console.log(`  - Rate cards for ${zone}: ${zoneCards.count}`);
    
    if (zoneCards.count > 0) {
      const sampleCard = zoneCards.rateCards[0];
      console.log(`  - Sample calculation for ${sampleCard.courier}:`);
      
      const weight = 1.5; // 1.5 kg
      const finalWeight = Math.max(weight, sampleCard.minimumBillableWeight || 0.5);
      const weightMultiplier = Math.ceil(finalWeight / 0.5);
      const shippingCost = sampleCard.baseRate + (sampleCard.addlRate * (weightMultiplier - 1));
      const codCharges = sampleCard.codAmount; // For COD
      const gst = 0.18 * (shippingCost + codCharges);
      const total = shippingCost + codCharges + gst;
      
      console.log(`    • Weight: ${finalWeight} kg (${weightMultiplier} units)`);
      console.log(`    • Base Rate: ₹${sampleCard.baseRate}`);
      console.log(`    • Additional: ₹${sampleCard.addlRate} × ${weightMultiplier - 1} = ₹${sampleCard.addlRate * (weightMultiplier - 1)}`);
      console.log(`    • Shipping: ₹${shippingCost.toFixed(2)}`);
      console.log(`    • COD: ₹${codCharges}`);
      console.log(`    • GST: ₹${gst.toFixed(2)}`);
      console.log(`    • Total: ₹${total.toFixed(2)}`);
    }
    
    console.log('\n✅ Test completed - MongoDB integration verified!');
    mongoose.connection.close();
    
  })
  .catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  }); 