// Simple rate calculation test
import mongoose from 'mongoose';
import RateCard from './src/models/ratecard.model.js';

console.log('🔧 Starting simple rate test...');

// Connect to MongoDB
mongoose.connect('mongodb+srv://aerwoktheweb:ElgqUh9k2u1KeYBb@rocketrybox.lvmzkf9.mongodb.net/?retryWrites=true&w=majority&appName=RocketryBox')
  .then(async () => {
    console.log('✅ Connected to MongoDB');
    
    // Check rate cards in database
    const totalCards = await RateCard.countDocuments();
    const activeCards = await RateCard.countDocuments({ isActive: true });
    console.log(`📊 Total rate cards: ${totalCards}, Active: ${activeCards}`);
    
    // Get a sample rate card
    const sampleCard = await RateCard.findOne({ isActive: true });
    if (sampleCard) {
      console.log('📝 Sample rate card:', {
        courier: sampleCard.courier,
        zone: sampleCard.zone,
        mode: sampleCard.mode,
        baseRate: sampleCard.baseRate,
        addlRate: sampleCard.addlRate,
        codAmount: sampleCard.codAmount,
        codPercent: sampleCard.codPercent
      });
    }
    
    // Test manual calculation
    console.log('\n💰 Testing manual rate calculation...');
    
    const testParams = {
      weight: 1.5, // kg
      zone: 'Within City',
      courier: 'Bluedart',
      isCOD: false,
      declaredValue: 1000
    };
    
    console.log('Test parameters:', testParams);
    
    // Find matching rate card
    const rateCard = await RateCard.findOne({
      zone: testParams.zone,
      courier: testParams.courier,
      isActive: true
    });
    
    if (rateCard) {
      console.log('✅ Found matching rate card');
      
      // Calculate manually
      const finalWeight = Math.max(testParams.weight, rateCard.minimumBillableWeight || 0.5);
      const baseRate = rateCard.baseRate;
      const additionalWeight = Math.max(0, finalWeight - 0.5);
      const additionalUnits = Math.ceil(additionalWeight / 0.5);
      const additionalCharges = additionalUnits * rateCard.addlRate;
      const shippingCost = baseRate + additionalCharges;
      
      let codCharges = 0;
      if (testParams.isCOD) {
        if (rateCard.codAmount) codCharges += rateCard.codAmount;
        if (rateCard.codPercent && testParams.declaredValue) {
          codCharges += (rateCard.codPercent / 100) * testParams.declaredValue;
        }
      }
      
      const subtotal = shippingCost + codCharges;
      const gst = 0.18 * subtotal;
      const total = subtotal + gst;
      
      console.log('\n📋 Calculation breakdown:');
      console.log(`Weight: ${testParams.weight} kg → Final: ${finalWeight} kg`);
      console.log(`Base rate: ₹${baseRate}`);
      console.log(`Additional units: ${additionalUnits} × ₹${rateCard.addlRate} = ₹${additionalCharges}`);
      console.log(`Shipping cost: ₹${shippingCost}`);
      console.log(`COD charges: ₹${codCharges}`);
      console.log(`Subtotal: ₹${subtotal}`);
      console.log(`GST (18%): ₹${gst.toFixed(2)}`);
      console.log(`🎯 Total: ₹${total.toFixed(2)}`);
      
    } else {
      console.log('❌ No matching rate card found');
    }
    
    // Get all couriers
    const couriers = await RateCard.distinct('courier', { isActive: true });
    console.log('\n🚚 Available couriers:', couriers);
    
    // Get all zones
    const zones = await RateCard.distinct('zone', { isActive: true });
    console.log('🗺️ Available zones:', zones);
    
    await mongoose.disconnect();
    console.log('\n✅ Test completed and disconnected');
  })
  .catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  }); 