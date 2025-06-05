import mongoose from 'mongoose';

// MongoDB URI with RocketryBox database
const MONGODB_URI = 'mongodb+srv://aerwoktheweb:T7whTb8Y8dFZnsak@cluster0.gyjm2lw.mongodb.net/RocketryBox?retryWrites=true&w=majority&appName=Cluster0';

// Seller schema
const sellerSchema = new mongoose.Schema({}, { strict: false });
const Seller = mongoose.model('Seller', sellerSchema);

async function completeRajeshProfile() {
  try {
    console.log('🔗 Connecting to MongoDB RocketryBox database...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to RocketryBox database!');

    // Find Rajesh Kumar
    console.log('🔍 Finding Rajesh Kumar (RBS002)...');
    const rajesh = await Seller.findOne({ rbUserId: 'RBS002' });

    if (!rajesh) {
      console.log('❌ Rajesh Kumar (RBS002) not found');
      return;
    }

    console.log(`✅ Found: ${rajesh.name} (${rajesh.email})`);

    // Comprehensive business data for Rajesh Kumar
    const completeBusinessData = {
      // Enhanced Company Details
      businessName: 'TechStore India Pvt Ltd',
      companyCategory: 'Electronics & Technology',
      brandName: 'TechStore',
      website: 'https://techstore.in',
      supportContact: '+91-9876543210',
      supportEmail: 'support@techstore.in',
      operationsEmail: 'operations@techstore.in',
      financeEmail: 'finance@techstore.in',

      // Complete Address Information
      address: {
        street: '123 Electronics Plaza, MG Road',
        landmark: 'Near Metro Station',
        city: 'Bangalore',
        state: 'Karnataka',
        country: 'India',
        postalCode: '560001'
      },

      // Business Registration & Tax Details
      gstin: '29ABCTY1234L1Z5',
      panNumber: 'ABCTY1234L',

      // Enhanced Documents with Verification Status
      documents: {
        gstin: 'GSTIN29ABCTY1234L1Z5',
        pan: 'ABCTY1234L',
        aadhaar: 'XXXX-XXXX-2468',
        documents: [
          {
            type: 'GST Certificate',
            url: '/documents/sellers/rajesh/gst-certificate.pdf',
            status: 'verified',
            uploadedAt: new Date(),
            verifiedAt: new Date(),
            verifiedBy: 'Admin Team'
          },
          {
            type: 'PAN Card',
            url: '/documents/sellers/rajesh/pan-card.pdf',
            status: 'verified',
            uploadedAt: new Date(),
            verifiedAt: new Date(),
            verifiedBy: 'Admin Team'
          },
          {
            type: 'Aadhaar Card',
            url: '/documents/sellers/rajesh/aadhaar-card.pdf',
            status: 'verified',
            uploadedAt: new Date(),
            verifiedAt: new Date(),
            verifiedBy: 'Admin Team'
          },
          {
            type: 'Business License',
            url: '/documents/sellers/rajesh/business-license.pdf',
            status: 'verified',
            uploadedAt: new Date(),
            verifiedAt: new Date(),
            verifiedBy: 'Admin Team'
          },
          {
            type: 'Shop & Establishment Certificate',
            url: '/documents/sellers/rajesh/shop-establishment.pdf',
            status: 'verified',
            uploadedAt: new Date(),
            verifiedAt: new Date(),
            verifiedBy: 'Admin Team'
          },
          {
            type: 'Trade License',
            url: '/documents/sellers/rajesh/trade-license.pdf',
            status: 'verified',
            uploadedAt: new Date(),
            verifiedAt: new Date(),
            verifiedBy: 'Admin Team'
          }
        ]
      },

      // Complete Bank Details
      bankDetails: [
        {
          accountType: 'Current Account',
          bankName: 'HDFC Bank',
          accountNumber: '50200012345678',
          ifscCode: 'HDFC0001234',
          accountHolderName: 'TechStore India Pvt Ltd',
          branchName: 'MG Road Branch, Bangalore',
          branchAddress: 'MG Road, Bangalore - 560001',
          cancelledCheque: {
            url: '/documents/sellers/rajesh/cancelled-cheque.pdf',
            status: 'verified',
            uploadedAt: new Date(),
            verifiedAt: new Date()
          },
          isPrimary: true,
          isVerified: true,
          verifiedAt: new Date(),
          verifiedBy: 'Finance Team'
        }
      ],

      // Online Store Presence
      storeLinks: {
        website: 'https://techstore.in',
        amazon: 'https://amazon.in/stores/techstore-india',
        flipkart: 'https://flipkart.com/seller/techstore',
        myntra: '',
        meesho: 'https://meesho.com/techstore',
        shopify: 'https://techstore-india.myshopify.com',
        opencart: ''
      },

      // Business Performance Metrics
      businessStats: {
        totalOrders: 1847,
        completedOrders: 1756,
        cancelledOrders: 62,
        returnedOrders: 29,
        totalRevenue: 4250000,
        monthlyRevenue: 485000,
        averageOrderValue: 2420,
        customerRating: 4.7,
        onTimeDeliveryRate: 96.2,
        returnRate: 1.6,
        customerSatisfactionScore: 4.6
      },

      // Product Categories & Inventory
      productCategories: [
        'Smartphones & Mobile Accessories',
        'Laptops & Desktop Computers',
        'Audio & Headphones',
        'Smart Watches & Wearables',
        'Gaming Accessories',
        'Computer Peripherals',
        'Smart Home Devices',
        'Camera & Photography',
        'Power Banks & Chargers',
        'Storage Devices'
      ],

      // Detailed Operational Information
      operationalDetails: {
        warehouseAddress: '456 Warehouse Complex, Whitefield Industrial Area, Bangalore - 560066',
        secondaryWarehouse: '789 Logistics Hub, Electronic City, Bangalore - 560100',
        workingHours: {
          monday: { open: '09:00', close: '18:00', isOpen: true },
          tuesday: { open: '09:00', close: '18:00', isOpen: true },
          wednesday: { open: '09:00', close: '18:00', isOpen: true },
          thursday: { open: '09:00', close: '18:00', isOpen: true },
          friday: { open: '09:00', close: '18:00', isOpen: true },
          saturday: { open: '10:00', close: '16:00', isOpen: true },
          sunday: { open: '', close: '', isOpen: false, note: 'Closed' }
        },
        shippingZones: [
          'Karnataka', 'Tamil Nadu', 'Andhra Pradesh', 'Telangana',
          'Kerala', 'Maharashtra', 'Delhi NCR', 'Gujarat', 'Rajasthan'
        ],
        serviceAreas: ['Pan India'],
        returnPolicy: '7 days return policy for defective products, 3 days for mobile phones',
        cancellationPolicy: 'Free cancellation before order processing',
        warrantyPolicy: 'Manufacturer warranty applicable for all products',
        codLimit: 50000,
        prepaidDiscount: 2,
        bulkOrderDiscount: 5
      },

      // Financial & Business Information
      financialDetails: {
        monthlyTurnover: 485000,
        annualTurnover: 5820000,
        gstTurnover: 5820000,
        businessVintage: '4 years',
        employeeCount: 18,
        businessType: 'Private Limited Company',
        incorporationDate: '2020-03-15',
        financialYear: '2024-25',
        lastAuditDate: '2024-03-31',
        creditRating: 'AAA',
        paymentTerms: '30 days'
      },

      // Complete KYC & Verification Status
      kycStatus: 'completed',
      kycCompletedAt: new Date(),
      verificationStatus: {
        email: true,
        phone: true,
        documents: true,
        bankAccount: true,
        business: true,
        address: true,
        gst: true,
        pan: true
      },

      // Agreement & Compliance
      agreementStatus: 'signed',
      agreementSignedAt: new Date(),
      complianceStatus: {
        gstCompliant: true,
        fssaiRequired: false,
        environmentalClearance: false,
        trademarkRegistered: true,
        copyrightCompliant: true
      },

      // Account Status & Settings
      status: 'active',
      isVerified: true,
      verifiedAt: new Date(),
      isPremiumSeller: true,
      sellerTier: 'Gold',

      // Payment & Credit Information
      walletBalance: 75000,
      paymentMode: 'credit',
      creditLimit: 150000,
      creditPeriod: 30,
      creditUtilized: 45000,
      lastCreditDate: new Date(),

      // Performance Ratings
      ratings: {
        overall: 4.7,
        productQuality: 4.8,
        packaging: 4.6,
        shipping: 4.7,
        customerService: 4.5,
        communication: 4.6
      },

      // Additional Metadata
      lastProfileUpdate: new Date(),
      profileCompleteness: 100,
      businessModel: 'B2C',
      primaryMarkets: ['Electronics', 'Mobile Accessories', 'Computing'],
      competitiveAdvantage: 'Latest technology products, competitive pricing, fast delivery',
      businessGoals: 'Expand to pan-India, increase product categories, achieve ₹10M annual revenue'
    };

    console.log('📝 Updating Rajesh Kumar\'s profile with comprehensive business data...');

    // Update the seller record
    const updatedSeller = await Seller.findByIdAndUpdate(
      rajesh._id,
      { $set: completeBusinessData },
      { new: true, runValidators: false }
    );

    console.log('\n🎉 Successfully completed Rajesh Kumar\'s seller profile!');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📍 Company: TechStore India Pvt Ltd');
    console.log('🏢 Category: Electronics & Technology');
    console.log('🏦 Bank: HDFC Bank - Current Account (Verified)');
    console.log('📋 Documents: 6 documents verified (GST, PAN, Aadhaar, etc.)');
    console.log('💳 Payment: Credit mode with ₹1,50,000 limit');
    console.log('⭐ Overall Rating: 4.7/5');
    console.log('📊 Monthly Turnover: ₹4,85,000');
    console.log('🎯 Total Orders: 1,847 (96.2% on-time delivery)');
    console.log('✅ KYC Status: Completed & Verified');
    console.log('🥇 Seller Tier: Gold (Premium Seller)');
    console.log('🌐 Online Presence: Website, Amazon, Flipkart, Shopify');
    console.log('📦 Product Categories: 10 categories');
    console.log('🚚 Service Areas: Pan India');
    console.log('💼 Profile Completeness: 100%');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🆔 Updated Seller ID:', updatedSeller._id);

  } catch (error) {
    console.error('❌ Error completing Rajesh profile:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

completeRajeshProfile();
