import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Seller from './src/modules/seller/models/seller.model.js';

// Load environment variables
dotenv.config();

// Set MongoDB URI directly (from env.example)
const MONGODB_URI = process.env.MONGODB_ATLAS_URI || 'mongodb+srv://aerwoktheweb:T7whTb8Y8dFZnsak@cluster0.gyjm2lw.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

console.log('Starting Rajesh data population script...');
console.log('MongoDB URI:', MONGODB_URI ? 'Found' : 'Not found');

const populateRajeshData = async () => {
  try {
    console.log('Attempting to connect to MongoDB...');
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // First, let's see all sellers in the database
    console.log('🔍 Searching for all sellers...');
    const allSellers = await Seller.find({}, 'name email rbUserId _id').limit(10);
    console.log(`Found ${allSellers.length} sellers in database:`);
    allSellers.forEach(seller => {
      console.log(`  - ${seller.name} | Email: ${seller.email} | RB ID: ${seller.rbUserId || 'None'} | MongoDB ID: ${seller._id}`);
    });

    // Try different search methods for Rajesh
    console.log('\n🔍 Searching for Rajesh Kumar by different methods...');

    // Method 1: By RB User ID
    let rajesh = await Seller.findOne({ rbUserId: 'RBS002' });
    console.log('Search by rbUserId "RBS002":', rajesh ? `Found: ${rajesh.name}` : 'Not found');

    // Method 2: By name containing "Rajesh"
    if (!rajesh) {
      rajesh = await Seller.findOne({ name: { $regex: 'Rajesh', $options: 'i' } });
      console.log('Search by name containing "Rajesh":', rajesh ? `Found: ${rajesh.name}` : 'Not found');
    }

    // Method 3: By email containing "rajesh"
    if (!rajesh) {
      rajesh = await Seller.findOne({ email: { $regex: 'rajesh', $options: 'i' } });
      console.log('Search by email containing "rajesh":', rajesh ? `Found: ${rajesh.name}` : 'Not found');
    }

    if (!rajesh) {
      console.log('❌ Rajesh Kumar not found in database');
      console.log('💡 Please check if the seller exists or if we\'re connected to the correct database');
      return;
    }

    console.log(`✅ Found seller: ${rajesh.name} (${rajesh.email}) | RB ID: ${rajesh.rbUserId || 'None'}`);

    // Update with comprehensive business information
    const updatedData = {
      // Company/Business Details
      businessName: 'TechStore India Pvt Ltd',
      companyCategory: 'Electronics & Gadgets',
      brandName: 'TechStore',
      website: 'https://techstore.in',
      supportContact: '+91-9876543210',
      supportEmail: 'support@techstore.in',
      operationsEmail: 'operations@techstore.in',
      financeEmail: 'finance@techstore.in',

      // Address Information
      address: {
        street: '123 Electronics Plaza, MG Road',
        landmark: 'Near Metro Station',
        city: 'Bangalore',
        state: 'Karnataka',
        country: 'India',
        postalCode: '560001'
      },

      // Business Documents
      gstin: '29ABCTY1234L1Z5',
      documents: {
        gstin: 'GSTIN29ABCTY1234L1Z5',
        pan: 'ABCTY1234L',
        aadhaar: 'XXXX-XXXX-2468',
        documents: [
          {
            type: 'GST Certificate',
            url: '/documents/gst-certificate-rajesh.pdf',
            status: 'verified',
            uploadedAt: new Date(),
            verifiedAt: new Date()
          },
          {
            type: 'PAN Card',
            url: '/documents/pan-card-rajesh.pdf',
            status: 'verified',
            uploadedAt: new Date(),
            verifiedAt: new Date()
          },
          {
            type: 'Aadhaar Card',
            url: '/documents/aadhaar-card-rajesh.pdf',
            status: 'verified',
            uploadedAt: new Date(),
            verifiedAt: new Date()
          },
          {
            type: 'Business License',
            url: '/documents/business-license-rajesh.pdf',
            status: 'verified',
            uploadedAt: new Date(),
            verifiedAt: new Date()
          },
          {
            type: 'Shop & Establishment Certificate',
            url: '/documents/shop-establishment-rajesh.pdf',
            status: 'verified',
            uploadedAt: new Date(),
            verifiedAt: new Date()
          }
        ]
      },

      // Bank Details
      bankDetails: [
        {
          accountType: 'Current Account',
          bankName: 'HDFC Bank',
          accountNumber: '50200012345678',
          ifscCode: 'HDFC0001234',
          accountHolderName: 'TechStore India Pvt Ltd',
          branchName: 'MG Road Branch, Bangalore',
          cancelledCheque: {
            url: '/documents/cancelled-cheque-rajesh.pdf',
            status: 'verified',
            uploadedAt: new Date(),
            verifiedAt: new Date()
          },
          isPrimary: true,
          isVerified: true,
          verifiedAt: new Date()
        }
      ],

      // Store Links & Online Presence
      storeLinks: {
        website: 'https://techstore.in',
        amazon: 'https://amazon.in/stores/techstore',
        flipkart: 'https://flipkart.com/seller/techstore',
        shopify: '',
        opencart: ''
      },

      // Business Stats & Performance
      businessStats: {
        totalOrders: 1250,
        completedOrders: 1180,
        cancelledOrders: 45,
        returnedOrders: 25,
        totalRevenue: 2850000,
        averageOrderValue: 2280,
        customerRating: 4.6,
        onTimeDeliveryRate: 94.5
      },

      // Inventory & Product Categories
      productCategories: [
        'Smartphones & Accessories',
        'Laptops & Computers',
        'Audio & Headphones',
        'Smart Watches',
        'Gaming Accessories',
        'Mobile Accessories',
        'Computer Peripherals'
      ],

      // Operational Details
      operationalDetails: {
        warehouseAddress: '456 Warehouse Complex, Whitefield, Bangalore - 560066',
        workingHours: {
          monday: { open: '09:00', close: '18:00' },
          tuesday: { open: '09:00', close: '18:00' },
          wednesday: { open: '09:00', close: '18:00' },
          thursday: { open: '09:00', close: '18:00' },
          friday: { open: '09:00', close: '18:00' },
          saturday: { open: '10:00', close: '16:00' },
          sunday: { open: '', close: '', closed: true }
        },
        shippingZones: ['Karnataka', 'Tamil Nadu', 'Andhra Pradesh', 'Telangana', 'Kerala'],
        returnPolicy: '7 days return policy for defective products',
        cancellationPolicy: 'Free cancellation before order processing'
      },

      // Financial Information
      financialDetails: {
        monthlyTurnover: 450000,
        gstTurnover: 5400000,
        businessVintage: '3 years',
        employeeCount: 12,
        businessType: 'Private Limited Company'
      },

      // KYC Status and Details
      kycStatus: 'completed',
      kycCompletedAt: new Date(),
      verificationStatus: {
        email: true,
        phone: true,
        documents: true,
        bankAccount: true,
        business: true
      },

      // Seller Agreement Status
      agreementStatus: 'signed',
      agreementSignedAt: new Date(),

      // Account Status
      status: 'active',
      isVerified: true,
      verifiedAt: new Date(),

      // Wallet & Payment Information
      walletBalance: 45000,
      paymentMode: 'credit',
      creditLimit: 100000,
      creditPeriod: 30,

      // Last updated
      updatedAt: new Date()
    };

    console.log('🔄 Updating seller record...');
    // Update the seller record
    const updatedSeller = await Seller.findByIdAndUpdate(rajesh._id, updatedData, { new: true });

    console.log('\n✅ Successfully updated Rajesh Kumar\'s seller profile with complete business information:');
    console.log('📍 Company: TechStore India Pvt Ltd');
    console.log('🏢 Category: Electronics & Gadgets');
    console.log('🏦 Bank: HDFC Bank - Current Account');
    console.log('📋 Documents: GST, PAN, Aadhaar, Business License - All Verified');
    console.log('💳 Payment: Credit mode with ₹1,00,000 limit');
    console.log('⭐ Rating: 4.6/5 with 1,250+ orders');
    console.log('📊 Monthly Turnover: ₹4,50,000');
    console.log('✅ KYC Status: Completed & Verified');
    console.log('🆔 Updated seller ID:', updatedSeller._id);

  } catch (error) {
    console.error('❌ Error updating Rajesh Kumar data:', error.message);
    console.error('Full error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
};

// Run the script
populateRajeshData().catch(console.error);
