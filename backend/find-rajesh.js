import mongoose from 'mongoose';

// MongoDB URI with specific database name
const MONGODB_URI = 'mongodb+srv://aerwoktheweb:T7whTb8Y8dFZnsak@cluster0.gyjm2lw.mongodb.net/RocketryBox?retryWrites=true&w=majority&appName=Cluster0';

// Simple seller schema
const sellerSchema = new mongoose.Schema({}, { strict: false });
const Seller = mongoose.model('Seller', sellerSchema);

async function findRajesh() {
  try {
    console.log('Connecting to MongoDB RocketryBox database...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to RocketryBox database!');

    console.log('Searching for all sellers...');
    const sellers = await Seller.find({}).limit(10);
    console.log(`Found ${sellers.length} sellers:`);

    sellers.forEach((seller, index) => {
      console.log(`${index + 1}. Name: ${seller.name || 'No name'} | Email: ${seller.email || 'No email'} | RB ID: ${seller.rbUserId || 'No RB ID'}`);
    });

    console.log('\nSearching for Rajesh specifically...');
    const rajesh = await Seller.findOne({
      $or: [
        { name: /rajesh/i },
        { email: /rajesh/i },
        { rbUserId: 'RBS002' }
      ]
    });

    if (rajesh) {
      console.log('✅ Found Rajesh:', rajesh.name, rajesh.email, rajesh.rbUserId);
      console.log('📋 Current data preview:', {
        businessName: rajesh.businessName || 'Not set',
        companyCategory: rajesh.companyCategory || 'Not set',
        gstin: rajesh.gstin || 'Not set',
        bankDetails: rajesh.bankDetails ? 'Present' : 'Not set'
      });
      return rajesh;
    } else {
      console.log('❌ Rajesh not found');
      return null;
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected');
  }
}

findRajesh();
