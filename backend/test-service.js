// Test the full service calculation with pincode determination
import mongoose from 'mongoose';
import rateCardService from './src/services/ratecard.service.js';

console.log('🔧 Testing RateCard Service...');

// Connect to MongoDB
mongoose.connect('mongodb+srv://aerwoktheweb:ElgqUh9k2u1KeYBb@rocketrybox.lvmzkf9.mongodb.net/?retryWrites=true&w=majority&appName=RocketryBox')
  .then(async () => {
    console.log('✅ Connected to MongoDB');
    
    // Test zone determination
    console.log('\n🗺️ Testing zone determination...');
    const zoneMappings = [
      { from: '110001', to: '110019', expected: 'Within City' },
      { from: '110001', to: '122001', expected: 'Within State' }, 
      { from: '110001', to: '400001', expected: 'Metro to Metro' },
      { from: '110001', to: '560001', expected: 'Rest of India' },
      { from: '110001', to: '797001', expected: 'Special Zone' }
    ];
    
    for (const mapping of zoneMappings) {
      const zone = await rateCardService.determineZone(mapping.from, mapping.to);
      console.log(`${mapping.from} → ${mapping.to}: ${zone} (Expected: ${mapping.expected})`);
    }
    
    // Test full calculation
    console.log('\n💰 Testing full service calculation...');
    
    const testCases = [
      {
        name: 'Within City - Standard package',
        data: {
          fromPincode: '110001',
          toPincode: '110019',
          weight: 1.0,
          dimensions: { length: 20, width: 15, height: 10 },
          mode: 'Surface',
          isCOD: false,
          declaredValue: 1000
        }
      },
      {
        name: 'COD Order - With high declared value',
        data: {
          fromPincode: '110001',
          toPincode: '400001',
          weight: 2.5,
          dimensions: { length: 30, width: 20, height: 15 },
          mode: 'Surface',
          isCOD: true,
          declaredValue: 5000
        }
      }
    ];
    
    for (const testCase of testCases) {
      console.log(`\n📦 ${testCase.name}`);
      console.log('Input:', JSON.stringify(testCase.data, null, 2));
      
      const result = await rateCardService.calculateShippingRate(testCase.data);
      
      if (result.success) {
        console.log('✅ Calculation successful!');
        console.log(`Zone: ${result.zone}`);
        console.log(`Chargeable Weight: ${result.chargeableWeight} kg`);
        console.log(`Volumetric Weight: ${result.volumetricWeight} kg`);
        console.log(`Options: ${result.calculations.length}`);
        
        if (result.calculations.length > 0) {
          console.log('\n💰 Rate Options:');
          result.calculations.forEach((calc, index) => {
            console.log(`${index + 1}. ${calc.courier}: ₹${calc.totalAmount}`);
            console.log(`   Base: ₹${calc.baseRate} + Additional: ₹${calc.additionalCharges} + COD: ₹${calc.codCharges} + GST: ₹${calc.gst} = ₹${calc.totalAmount}`);
          });
          
          console.log(`\n🎯 Cheapest option: ${result.calculations[0].courier} - ₹${result.calculations[0].totalAmount}`);
        }
      } else {
        console.log('❌ Calculation failed:', result.error);
      }
      
      console.log('\n' + '='.repeat(60));
    }
    
    await mongoose.disconnect();
    console.log('\n✅ All tests completed');
  })
  .catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  }); 