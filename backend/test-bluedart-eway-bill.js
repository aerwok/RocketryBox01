import { generateEWayBill, bookShipment } from './src/utils/bluedart.js';
import { logger } from './src/utils/logger.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Test BlueDart E-Way Bill Generation
 */
async function testBlueDartEWayBill() {
  console.log('🧪 Testing BlueDart E-Way Bill Generation...\n');

  // Sample E-Way Bill data based on your API documentation
  const testEWayBillDetails = {
    consignee: {
      name: "MR KISHORE KUMAR",
      mobile: "9738665946",
      phone: "9738665946",
      email: "",
      address: {
        line1: "KR COLONY",
        line2: "",
        line3: ""
      },
      pincode: "560071",
      attention: "MR KISHORE KUMAR",
      gstNumber: ""
    },
    shipper: {
      name: "Bhakti Singh",
      mobile: "9819171734",
      phone: "9819171734",
      telephone: "99999999999",
      email: "",
      address: {
        line1: "A7-203,Swastik residency",
        line2: "Thane West GB ROAD",
        line3: "  400002"
      },
      pincode: "400025",
      gstNumber: "",
      vendorCode: "000PDV",
      originArea: "BOM"
    },
    services: {
      actualWeight: 50,
      declaredValue: 49000,
      productCode: "D",
      productType: 1,
      collectableAmount: 0,
      creditReferenceNo: "1544771476",
      registerPickup: false,
      isReversePickup: false,
      itemCount: 1,
      pieceCount: 1,
      pdfOutputNotRequired: true,
      specialInstruction: "PDV",
      commodity: {
        detail1: "test",
        detail2: "",
        detail3: ""
      },
      itemDetails: [
        {
          HSCode: "",
          ItemID: "10101",
          ItemName: "",
          ItemValue: 0,
          Itemquantity: 0,
          ProductDesc1: ""
        }
      ]
    },
    dimensions: {
      length: 50,
      width: 50,
      height: 50,
      count: 1
    },
    returnAddress: {
      line1: "A7-203,Swastik residency",
      line2: "Thane West GB ROAD",
      line3: "  400002",
      pincode: "400025",
      contact: "Bhakti Singh",
      mobile: "9819171734",
      email: ""
    }
  };

  const partnerDetails = {
    id: 'bluedart',
    name: 'Blue Dart Express',
    logoUrl: 'https://example.com/bluedart-logo.png'
  };

  try {
    console.log('📦 Testing E-Way Bill Generation...');
    console.log('Consignee:', testEWayBillDetails.consignee.name);
    console.log('Shipper:', testEWayBillDetails.shipper.name);
    console.log('Weight:', testEWayBillDetails.services.actualWeight, 'kg');
    console.log('Declared Value: ₹', testEWayBillDetails.services.declaredValue);
    console.log('');

    const result = await generateEWayBill(testEWayBillDetails, partnerDetails);

    if (result.success) {
      console.log('✅ E-Way Bill Generation Successful!');
      console.log('📋 Response Details:');
      console.log('   AWB Number:', result.eWayBill?.awbNumber);
      console.log('   Tracking Number:', result.eWayBill?.trackingNumber);
      console.log('   Token Number:', result.eWayBill?.tokenNumber);
      console.log('   Destination:', result.eWayBill?.destName);
      console.log('   Tracking URL:', result.trackingUrl);
      console.log('   Booking Type:', result.bookingType);
      console.log('   Message:', result.message);
      console.log('   Timestamp:', result.timestamp);
      
      if (result.eWayBill?.label) {
        console.log('   📄 Label: Available');
      }
      if (result.eWayBill?.manifest) {
        console.log('   📋 Manifest: Available');
      }
      if (result.eWayBill?.expectedDeliveryDate) {
        console.log('   📅 Expected Delivery:', result.eWayBill.expectedDeliveryDate);
      }
      if (result.eWayBill?.charges) {
        console.log('   💰 Charges:', result.eWayBill.charges, result.eWayBill?.currency || 'INR');
      }
    } else {
      console.log('❌ E-Way Bill Generation Failed');
      console.log('Error:', result.error);
      console.log('API Error:', result.apiError);
      console.log('Message:', result.message);
      
      if (result.instructions) {
        console.log('📋 Manual Instructions:');
        Object.entries(result.instructions).forEach(([step, instruction]) => {
          console.log(`   ${step}: ${instruction}`);
        });
      }
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    console.error('Stack:', error.stack);
  }
}

/**
 * Test BlueDart Shipment Booking (using E-Way Bill)
 */
async function testBlueDartShipmentBooking() {
  console.log('\n🧪 Testing BlueDart Shipment Booking (with E-Way Bill)...\n');

  // Sample shipment data
  const testShipmentDetails = {
    referenceNumber: 'TEST' + Date.now(),
    serviceType: 'standard',
    weight: 2,
    dimensions: {
      length: 20,
      width: 15,
      height: 10
    },
    declaredValue: 1000,
    commodity: 'Test Package',
    consignee: {
      name: 'Test Customer',
      phone: '9876543210',
      email: 'customer@test.com',
      address: {
        line1: 'Test Address Line 1',
        line2: 'Test Address Line 2',
        line3: '',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001'
      }
    },
    shipper: {
      name: 'Test Seller',
      phone: '9876543211',
      email: 'seller@test.com',
      address: {
        line1: 'Seller Address Line 1',
        line2: 'Seller Address Line 2',
        line3: '',
        city: 'Delhi',
        state: 'Delhi',
        pincode: '110001'
      }
    }
  };

  const partnerDetails = {
    id: 'bluedart',
    name: 'Blue Dart Express'
  };

  try {
    console.log('📦 Testing Shipment Booking...');
    console.log('Reference:', testShipmentDetails.referenceNumber);
    console.log('Weight:', testShipmentDetails.weight, 'kg');
    console.log('From:', testShipmentDetails.shipper.address.pincode);
    console.log('To:', testShipmentDetails.consignee.address.pincode);
    console.log('');

    const result = await bookShipment(testShipmentDetails, partnerDetails);

    if (result.success) {
      console.log('✅ Shipment Booking Successful!');
      console.log('📋 Booking Details:');
      console.log('   AWB Number:', result.awb);
      console.log('   Tracking URL:', result.trackingUrl);
      console.log('   Booking Type:', result.bookingType);
      console.log('   Courier:', result.courierName);
      console.log('   Message:', result.message);
      
      if (result.eWayBillData) {
        console.log('   🧾 E-Way Bill Data:');
        console.log('      Token Number:', result.eWayBillData.tokenNumber);
        console.log('      Destination:', result.eWayBillData.destName);
        console.log('      Expected Delivery:', result.eWayBillData.expectedDeliveryDate);
      }
    } else {
      console.log('❌ Shipment Booking Failed');
      console.log('Error:', result.error);
      console.log('Message:', result.message);
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

/**
 * Run all tests
 */
async function runTests() {
  console.log('🚀 BlueDart E-Way Bill Integration Tests');
  console.log('=' .repeat(50));
  
  try {
    await testBlueDartEWayBill();
    await testBlueDartShipmentBooking();
    
    console.log('\n' + '='.repeat(50));
    console.log('✅ All tests completed!');
    
  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests();
}

export { testBlueDartEWayBill, testBlueDartShipmentBooking }; 