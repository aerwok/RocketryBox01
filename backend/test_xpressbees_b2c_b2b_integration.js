import 'dotenv/config';
import { XPRESSBEES_CONFIG } from './src/config/xpressbees.config.js';
import { XpressBeesService } from './src/services/xpressbees.service.js';

/**
 * XpressBees B2C & B2B Comprehensive Integration Test Suite
 * Tests all B2C and B2B service types with specific service codes
 */

class XpressBeesB2CB2BIntegrationTest {
  constructor() {
    this.service = new XpressBeesService();
    this.testResults = {
      passed: 0,
      failed: 0,
      total: 0,
      startTime: Date.now()
    };

    // XpressBees Service Codes and Configurations
    this.serviceTypes = {
      B2C_STANDARD: {
        code: '16789',
        name: 'B2C Standard (Surface)',
        type: 'B2C',
        mode: 'Surface',
        description: 'ROCKETRY BOX PRIVATE LIMITED FRANCHISE B2C'
      },
      B2C_EXPRESS: {
        code: '16790',
        name: 'B2C Express (Air)',
        type: 'B2C',
        mode: 'Air',
        description: 'ROCKETRY BOX PRIVATE LIMITED FRANCHISE B2C AIR'
      },
      B2B_STANDARD: {
        code: '16791',
        name: 'B2B Standard',
        type: 'B2B',
        mode: 'Surface',
        description: 'ROCKETRY BOX PRIVATE LIMITED FRANCHISE B2B'
      }
    };

    this.testData = {
      // Test pincodes
      testPincodes: {
        serviceable: '110001', // Delhi
        origin: '560001', // Bangalore
        destination: '400001' // Mumbai
      },
      // B2C Test shipment data
      b2cShipment: {
        shipper: {
          name: 'RocketryBox B2C Seller',
          phone: '9876543210',
          gstNumber: 'GST12345B2C',
          address: {
            line1: '123 B2C Seller Street',
            city: 'Bangalore',
            state: 'Karnataka',
            pincode: '560001'
          }
        },
        consignee: {
          name: 'Individual Customer',
          phone: '9876543211',
          address: {
            line1: '456 Customer Home',
            city: 'Mumbai',
            state: 'Maharashtra',
            pincode: '400001'
          }
        },
        orderNumber: `B2C_ORD_${Date.now()}`,
        invoiceNumber: `B2C_INV_${Date.now()}`,
        commodity: 'Mobile Phone',
        declaredValue: 15000,
        weight: 0.5, // kg
        dimensions: {
          length: 15,
          width: 10,
          height: 5
        },
        cod: true,
        codAmount: 15000
      },
      // B2B Test shipment data
      b2bShipment: {
        shipper: {
          name: 'RocketryBox B2B Supplier',
          phone: '9876543210',
          gstNumber: 'GST12345B2B',
          address: {
            line1: '123 B2B Warehouse Complex',
            city: 'Bangalore',
            state: 'Karnataka',
            pincode: '560001'
          }
        },
        consignee: {
          name: 'Business Customer Ltd',
          phone: '9876543212',
          gstNumber: 'GST67890B2B',
          address: {
            line1: '789 Corporate Office',
            city: 'Mumbai',
            state: 'Maharashtra',
            pincode: '400001'
          }
        },
        orderNumber: `B2B_ORD_${Date.now()}`,
        invoiceNumber: `B2B_INV_${Date.now()}`,
        commodity: 'Industrial Equipment',
        declaredValue: 50000,
        weight: 5, // kg
        dimensions: {
          length: 50,
          width: 30,
          height: 20
        },
        cod: false,
        codAmount: 0
      }
    };
  }

  /**
   * Print test header
   */
  printHeader() {
    console.log('\n' + '='.repeat(80));
    console.log('🚀 XPRESSBEES B2C & B2B COMPREHENSIVE INTEGRATION TEST SUITE');
    console.log('='.repeat(80));
    console.log(`📅 Started at: ${new Date().toLocaleString()}`);
    console.log(`🌐 Base URL: ${XPRESSBEES_CONFIG.API_BASE_URL}`);
    console.log('');
    console.log('📊 Service Types to Test:');
    Object.entries(this.serviceTypes).forEach(([key, service]) => {
      console.log(`   • ${service.name} (${service.code}) - ${service.description}`);
    });
    console.log('='.repeat(80));
  }

  /**
   * Log test result
   */
  logTest(testName, success, result, error = null) {
    this.testResults.total++;
    if (success) {
      this.testResults.passed++;
      console.log(`✅ ${testName}: PASSED`);
      if (result?.responseTime) {
        console.log(`   ⏱️ Response Time: ${result.responseTime}ms`);
      }
    } else {
      this.testResults.failed++;
      console.log(`❌ ${testName}: FAILED`);
      if (error) {
        console.log(`   💥 Error: ${error}`);
      }
    }

    if (result && typeof result === 'object' && result.success !== undefined) {
      console.log(`   📊 API Response: ${result.success ? 'Success' : 'Failed'}`);
    }
    console.log('');
  }

  /**
   * Test Authentication for all service types
   */
  async testAuthentication() {
    console.log('🔑 Testing Authentication for B2C & B2B Services...\n');

    try {
      const token = await this.service.authenticate();

      if (typeof token === 'string' && token.length > 0) {
        this.logTest('Global Authentication', true, {
          token: `${token.substring(0, 30)}...`,
          validForAllServices: true
        });
        return token;
      } else {
        this.logTest('Global Authentication', false, null, 'Invalid token response');
        return null;
      }
    } catch (error) {
      this.logTest('Global Authentication', false, null, error.message);
      return null;
    }
  }

  /**
   * Test rate calculation for each service type
   */
  async testRateCalculationByServiceType() {
    console.log('💰 Testing Rate Calculation for Each Service Type...\n');

    for (const [serviceKey, serviceConfig] of Object.entries(this.serviceTypes)) {
      const shipmentData = serviceConfig.type === 'B2C' ? this.testData.b2cShipment : this.testData.b2bShipment;

      try {
        // Prepare rate calculation data with specific service code
        const rateData = {
          packageDetails: {
            weight: shipmentData.weight,
            serviceType: serviceConfig.code,
            dimensions: shipmentData.dimensions,
            cod: shipmentData.cod
          },
          deliveryDetails: {
            pickupPincode: shipmentData.shipper.address.pincode,
            deliveryPincode: shipmentData.consignee.address.pincode
          },
          partnerDetails: {
            id: 'xpressbees',
            serviceCode: serviceConfig.code,
            rates: {
              baseRate: serviceConfig.type === 'B2B' ? 75 : 50, // B2B typically higher base rate
              weightRate: serviceConfig.mode === 'Air' ? 25 : 15, // Air service higher rate
              codCharges: shipmentData.cod ? 25 : 0,
              fuelSurchargePercent: 10,
              expressCharge: serviceConfig.mode === 'Air' ? 30 : 0
            }
          }
        };

        const result = await this.service.calculateRate(
          rateData.packageDetails,
          rateData.deliveryDetails,
          rateData.partnerDetails
        );

        this.logTest(`Rate Calculation - ${serviceConfig.name}`, result.success, result, result.error);

        if (result.success) {
          console.log(`   📦 Service: ${serviceConfig.name} (${serviceConfig.code})`);
          console.log(`   🏷️ Type: ${serviceConfig.type}`);
          console.log(`   ✈️ Mode: ${serviceConfig.mode}`);
          console.log(`   💰 Total Rate: ₹${result.totalRate}`);
          console.log(`   ⚖️ Weight: ${shipmentData.weight}kg`);
          console.log(`   💸 COD: ${shipmentData.cod ? 'Yes' : 'No'}`);
          console.log('');
        }
      } catch (error) {
        this.logTest(`Rate Calculation - ${serviceConfig.name}`, false, null, error.message);
      }
    }
  }

  /**
   * Test shipment booking for each service type
   */
  async testShipmentBookingByServiceType() {
    console.log('📦 Testing Shipment Booking for Each Service Type...\n');

    const awbNumbers = {};

    for (const [serviceKey, serviceConfig] of Object.entries(this.serviceTypes)) {
      const shipmentData = serviceConfig.type === 'B2C' ?
        { ...this.testData.b2cShipment, serviceCode: serviceConfig.code, serviceType: serviceConfig.name } :
        { ...this.testData.b2bShipment, serviceCode: serviceConfig.code, serviceType: serviceConfig.name };

      try {
        const result = await this.service.bookShipment(shipmentData);
        this.logTest(`Shipment Booking - ${serviceConfig.name}`, result.success, result, result.apiError);

        if (result.success) {
          console.log(`   📦 Service: ${serviceConfig.name} (${serviceConfig.code})`);
          console.log(`   🏷️ Type: ${serviceConfig.type}`);
          console.log(`   📋 AWB Number: ${result.awb}`);
          console.log(`   🏢 Courier: ${result.courierName}`);
          console.log(`   📊 Booking Type: ${result.bookingType}`);

          if (result.trackingUrl) {
            console.log(`   🔗 Tracking URL: ${result.trackingUrl}`);
          }

          awbNumbers[serviceKey] = result.awb;
          console.log('');
        }
      } catch (error) {
        this.logTest(`Shipment Booking - ${serviceConfig.name}`, false, null, error.message);
      }
    }

    return awbNumbers;
  }

  /**
   * Test bulk booking for B2B services
   */
  async testB2BBulkBooking() {
    console.log('📦 Testing B2B Bulk Booking...\n');

    try {
      // Create multiple B2B shipments
      const bulkShipments = [];
      for (let i = 1; i <= 3; i++) {
        bulkShipments.push({
          ...this.testData.b2bShipment,
          orderNumber: `B2B_BULK_${Date.now()}_${i}`,
          invoiceNumber: `B2B_BULK_INV_${Date.now()}_${i}`,
          serviceCode: this.serviceTypes.B2B_STANDARD.code
        });
      }

      // Test bulk booking functionality
      const bulkResults = [];
      for (const shipment of bulkShipments) {
        try {
          const result = await this.service.bookShipment(shipment);
          bulkResults.push(result);
        } catch (error) {
          bulkResults.push({ success: false, error: error.message });
        }
      }

      const successfulBookings = bulkResults.filter(r => r.success).length;
      const bulkSuccess = successfulBookings > 0;

      this.logTest('B2B Bulk Booking', bulkSuccess, {
        totalShipments: bulkShipments.length,
        successfulBookings,
        bulkCapability: 'Supported'
      });

      if (bulkSuccess) {
        console.log(`   📦 Total Shipments: ${bulkShipments.length}`);
        console.log(`   ✅ Successfully Booked: ${successfulBookings}`);
        console.log(`   🏷️ Service: B2B Standard`);
        console.log('');
      }

    } catch (error) {
      this.logTest('B2B Bulk Booking', false, null, error.message);
    }
  }

  /**
   * Test COD vs Prepaid for B2C services
   */
  async testB2CCODvsPrepaid() {
    console.log('💸 Testing B2C COD vs Prepaid Services...\n');

    const paymentModes = [
      { type: 'COD', data: { ...this.testData.b2cShipment, cod: true, codAmount: 15000 } },
      { type: 'Prepaid', data: { ...this.testData.b2cShipment, cod: false, codAmount: 0 } }
    ];

    for (const paymentMode of paymentModes) {
      try {
        const shipmentData = {
          ...paymentMode.data,
          serviceCode: this.serviceTypes.B2C_STANDARD.code,
          orderNumber: `B2C_${paymentMode.type}_${Date.now()}`
        };

        const result = await this.service.bookShipment(shipmentData);
        this.logTest(`B2C ${paymentMode.type} Booking`, result.success, result, result.apiError);

        if (result.success) {
          console.log(`   💰 Payment Mode: ${paymentMode.type}`);
          console.log(`   📋 AWB Number: ${result.awb}`);
          console.log(`   💸 COD Amount: ₹${shipmentData.codAmount}`);
          console.log('');
        }
      } catch (error) {
        this.logTest(`B2C ${paymentMode.type} Booking`, false, null, error.message);
      }
    }
  }

  /**
   * Test service-specific tracking for each type
   */
  async testServiceSpecificTracking(awbNumbers = {}) {
    console.log('🔍 Testing Service-Specific Tracking...\n');

    for (const [serviceKey, serviceConfig] of Object.entries(this.serviceTypes)) {
      const testAwb = awbNumbers[serviceKey] || `XB${serviceConfig.code}${Date.now()}TEST`;

      try {
        const result = await this.service.trackShipment(testAwb);
        this.logTest(`Tracking - ${serviceConfig.name}`, result.success, result, result.apiError);

        if (result.success) {
          console.log(`   📦 Service: ${serviceConfig.name}`);
          console.log(`   🏷️ Type: ${serviceConfig.type}`);
          console.log(`   📋 AWB Number: ${result.trackingNumber}`);
          console.log(`   📊 Status: ${result.status || 'N/A'}`);
          console.log(`   📍 Location: ${result.currentLocation || 'N/A'}`);
          console.log('');
        }
      } catch (error) {
        this.logTest(`Tracking - ${serviceConfig.name}`, false, null, error.message);
      }
    }
  }

  /**
   * Test service availability and coverage
   */
  async testServiceAvailability() {
    console.log('🗺️ Testing Service Availability by Type...\n');

    const testRoutes = [
      { from: '560001', to: '110001', route: 'Bangalore → Delhi' },
      { from: '400001', to: '600001', route: 'Mumbai → Chennai' },
      { from: '700001', to: '500001', route: 'Kolkata → Hyderabad' }
    ];

    for (const route of testRoutes) {
      console.log(`\n📍 Testing Route: ${route.route}`);

      for (const [serviceKey, serviceConfig] of Object.entries(this.serviceTypes)) {
        try {
          // Test serviceability for this route and service type
          const rateData = {
            packageDetails: {
              weight: 1,
              serviceType: serviceConfig.code,
              dimensions: { length: 20, width: 15, height: 10 }
            },
            deliveryDetails: {
              pickupPincode: route.from,
              deliveryPincode: route.to
            },
            partnerDetails: {
              id: 'xpressbees',
              serviceCode: serviceConfig.code
            }
          };

          const result = await this.service.calculateRate(
            rateData.packageDetails,
            rateData.deliveryDetails,
            rateData.partnerDetails
          );

          const testName = `${route.route} - ${serviceConfig.name}`;
          this.logTest(testName, result.success, result, result.error);

          if (result.success) {
            console.log(`     ✅ Available - Rate: ₹${result.totalRate || 'N/A'}`);
          }
        } catch (error) {
          this.logTest(`${route.route} - ${serviceConfig.name}`, false, null, error.message);
        }
      }
    }
  }

  /**
   * Print comprehensive test summary
   */
  printSummary() {
    const endTime = Date.now();
    const duration = endTime - this.testResults.startTime;
    const successRate = ((this.testResults.passed / this.testResults.total) * 100).toFixed(1);

    console.log('\n' + '='.repeat(80));
    console.log('📊 B2C & B2B COMPREHENSIVE TEST SUMMARY');
    console.log('='.repeat(80));
    console.log(`✅ Passed: ${this.testResults.passed}`);
    console.log(`❌ Failed: ${this.testResults.failed}`);
    console.log(`📊 Total: ${this.testResults.total}`);
    console.log(`🎯 Success Rate: ${successRate}%`);
    console.log(`⏱️ Total Duration: ${duration}ms (${(duration / 1000).toFixed(2)}s)`);
    console.log(`📅 Completed at: ${new Date().toLocaleString()}`);
    console.log('='.repeat(80));

    console.log('\n🏆 Service Type Coverage:');
    Object.entries(this.serviceTypes).forEach(([key, service]) => {
      console.log(`   📦 ${service.name} (${service.code}) - ${service.type} Service`);
    });

    if (this.testResults.failed > 0) {
      console.log('\n⚠️ Some tests failed. This may be expected for:');
      console.log('   • Specific service type limitations');
      console.log('   • Account activation required for certain service codes');
      console.log('   • Network connectivity issues');
      console.log('   • Service-specific API restrictions');
    }

    console.log('\n📋 Next Steps:');
    console.log('   • Review service-specific failures');
    console.log('   • Verify service code activations with XpressBees');
    console.log('   • Test with actual business vs consumer addresses');
    console.log('   • Contact XpressBees for service-specific support');
    console.log('   • Service Codes: B2C Standard (16789), B2C Air (16790), B2B (16791)');
  }

  /**
   * Run all B2C & B2B tests
   */
  async runAllTests() {
    this.printHeader();

    try {
      // Test 1: Authentication
      const token = await this.testAuthentication();

      // Test 2: Rate calculation for each service type
      await this.testRateCalculationByServiceType();

      // Test 3: Shipment booking for each service type
      const awbNumbers = await this.testShipmentBookingByServiceType();

      // Test 4: B2B bulk booking
      await this.testB2BBulkBooking();

      // Test 5: B2C COD vs Prepaid
      await this.testB2CCODvsPrepaid();

      // Test 6: Service-specific tracking
      await this.testServiceSpecificTracking(awbNumbers);

      // Test 7: Service availability testing
      await this.testServiceAvailability();

    } catch (error) {
      console.log(`💥 Test suite error: ${error.message}`);
    }

    this.printSummary();
    return this.testResults.failed === 0 ? 0 : 1;
  }
}

// Run the tests if this file is executed directly
console.log('🔍 Debug: Checking execution context...');
console.log('🔍 Debug: import.meta.url =', import.meta.url);
console.log('🔍 Debug: process.argv[1] =', process.argv[1]);

const isMainModule = import.meta.url === `file://${process.argv[1]}` ||
  import.meta.url.endsWith(process.argv[1]) ||
  process.argv[1].endsWith('test_xpressbees_b2c_b2b_integration.js');

console.log('🔍 Debug: isMainModule =', isMainModule);

if (isMainModule) {
  console.log('🔍 Debug: Starting XpressBees B2C/B2B test execution...');
  console.log('🔍 Debug: Creating XpressBeesB2CB2BIntegrationTest...');

  const tester = new XpressBeesB2CB2BIntegrationTest();
  console.log('🔍 Debug: Running all tests...');

  tester.runAllTests()
    .then(exitCode => {
      console.log('🔍 Debug: Tests completed with exit code:', exitCode);
      process.exit(exitCode);
    })
    .catch(error => {
      console.error('💥 Fatal error:', error);
      console.error('💥 Stack trace:', error.stack);
      process.exit(1);
    });
} else {
  console.log('🔍 Debug: File imported as module, not executing tests');
}

export default XpressBeesB2CB2BIntegrationTest;
