import 'dotenv/config';
import { XPRESSBEES_CONFIG } from './src/config/xpressbees.config.js';
import { XpressBeesService } from './src/services/xpressbees.service.js';

/**
 * XpressBees Integration Test Suite
 * Tests all major XpressBees API functionality
 */

class XpressBeesIntegrationTest {
  constructor() {
    this.service = new XpressBeesService();
    this.testResults = {
      passed: 0,
      failed: 0,
      total: 0,
      startTime: Date.now()
    };
    this.testData = {
      // Test pincodes
      testPincodes: {
        serviceable: '110001', // Delhi
        unserviceable: '123456', // Invalid
        origin: '560001', // Bangalore
        destination: '400001' // Mumbai
      },
      // Test shipment data
      testShipment: {
        shipper: {
          name: 'RocketryBox Test Shipper',
          phone: '9876543210',
          gstNumber: 'GST12345',
          address: {
            line1: '123 Test Street, Test Area',
            city: 'Bangalore',
            state: 'Karnataka',
            pincode: '560001'
          }
        },
        consignee: {
          name: 'Test Customer',
          phone: '9876543211',
          gstNumber: '',
          address: {
            line1: '456 Customer Street, Customer Area',
            city: 'Mumbai',
            state: 'Maharashtra',
            pincode: '400001'
          }
        },
        orderNumber: `TEST_ORD_${Date.now()}`,
        invoiceNumber: `TEST_INV_${Date.now()}`,
        commodity: 'Test Product',
        declaredValue: 500,
        weight: 1, // kg
        dimensions: {
          length: 20,
          width: 15,
          height: 10
        },
        cod: false,
        codAmount: 0,
        serviceType: 'standard'
      },
      // Test rate calculation data
      testRateData: {
        packageDetails: {
          weight: 1,
          serviceType: 'standard',
          dimensions: {
            length: 20,
            width: 15,
            height: 10
          },
          cod: false
        },
        deliveryDetails: {
          pickupPincode: '560001',
          deliveryPincode: '400001'
        },
        partnerDetails: {
          id: 'xpressbees',
          rates: {
            baseRate: 50,
            weightRate: 15,
            codCharges: 25,
            fuelSurchargePercent: 10,
            expressCharge: 20
          }
        }
      }
    };
  }

  /**
   * Print test header
   */
  printHeader() {
    console.log('\n' + '='.repeat(80));
    console.log('🚀 XPRESSBEES INTEGRATION TEST SUITE');
    console.log('='.repeat(80));
    console.log(`📅 Started at: ${new Date().toLocaleString()}`);
    console.log(`🌐 Base URL: ${XPRESSBEES_CONFIG.API_BASE_URL}`);
    console.log(`📧 Email: ${XPRESSBEES_CONFIG.AUTH.EMAIL ? '✅ Set' : '❌ Not Set'}`);
    console.log(`🔑 Password: ${XPRESSBEES_CONFIG.AUTH.PASSWORD ? '✅ Set' : '❌ Not Set'}`);
    console.log(`📊 Service Types: B2C Standard, B2C Express, B2B Standard`);
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
   * Test 1: Authentication
   */
  async testAuthentication() {
    console.log('🔑 Testing Authentication...\n');

    try {
      const token = await this.service.authenticate();

      if (typeof token === 'string' && token.length > 0) {
        this.logTest('Authentication', true, {
          token: `${token.substring(0, 30)}...`,
          length: token.length
        });
        return token;
      } else {
        this.logTest('Authentication', false, null, 'Invalid token response');
        return null;
      }
    } catch (error) {
      this.logTest('Authentication', false, null, error.message);
      return null;
    }
  }

  /**
   * Test 2: Rate Calculation
   */
  async testRateCalculation() {
    console.log('💰 Testing Rate Calculation...\n');

    // Test standard service
    try {
      const result = await this.service.calculateRate(
        this.testData.testRateData.packageDetails,
        this.testData.testRateData.deliveryDetails,
        this.testData.testRateData.partnerDetails
      );

      this.logTest('Rate Calculation - Standard', result.success, result, result.error);

      if (result.success) {
        console.log(`   📦 Service: ${result.provider.serviceName}`);
        console.log(`   💰 Total Rate: ₹${result.totalRate}`);
        console.log(`   📊 Rate Source: ${result.rateType}`);
        console.log(`   ⚖️ Chargeable Weight: ${result.chargeableWeight}kg`);
        console.log(`   📅 Estimated Days: ${result.provider.estimatedDays} days`);
        console.log('');
      }
    } catch (error) {
      this.logTest('Rate Calculation - Standard', false, null, error.message);
    }

    // Test express service
    try {
      const expressRateData = {
        ...this.testData.testRateData,
        packageDetails: {
          ...this.testData.testRateData.packageDetails,
          serviceType: 'express'
        }
      };

      const result = await this.service.calculateRate(
        expressRateData.packageDetails,
        expressRateData.deliveryDetails,
        expressRateData.partnerDetails
      );

      this.logTest('Rate Calculation - Express', result.success, result, result.error);

      if (result.success) {
        console.log(`   📦 Service: ${result.provider.serviceName}`);
        console.log(`   💰 Total Rate: ₹${result.totalRate}`);
        console.log(`   📊 Express Charge: ₹${result.breakdown.serviceCharge}`);
        console.log(`   📅 Estimated Days: ${result.provider.estimatedDays} days`);
        console.log('');
      }
    } catch (error) {
      this.logTest('Rate Calculation - Express', false, null, error.message);
    }
  }

  /**
   * Test 3: Shipment Booking
   */
  async testShipmentBooking() {
    console.log('📦 Testing Shipment Booking...\n');

    try {
      const result = await this.service.bookShipment(this.testData.testShipment);
      this.logTest('Shipment Booking', result.success, result, result.apiError);

      if (result.success) {
        console.log(`   📋 AWB Number: ${result.awb}`);
        console.log(`   🏢 Courier: ${result.courierName}`);
        console.log(`   📊 Booking Type: ${result.bookingType}`);
        console.log(`   📋 Order ID: ${result.orderId}`);

        if (result.trackingUrl) {
          console.log(`   🔗 Tracking URL: ${result.trackingUrl}`);
        }

        if (result.bookingType === 'MANUAL_REQUIRED') {
          console.log('   📝 Manual Booking Instructions:');
          Object.entries(result.instructions || {}).forEach(([key, value]) => {
            console.log(`      ${key}: ${value}`);
          });
        }
        console.log('');

        return result.awb;
      }
    } catch (error) {
      this.logTest('Shipment Booking', false, null, error.message);
    }

    return null;
  }

  /**
   * Test 4: Shipment Tracking
   */
  async testShipmentTracking(awbNumber = null) {
    console.log('🔍 Testing Shipment Tracking...\n');

    // Use provided AWB or create a test one
    const testAwb = awbNumber || `XB${Date.now()}TEST`;

    try {
      const result = await this.service.trackShipment(testAwb);
      this.logTest('Shipment Tracking', result.success, result, result.apiError);

      if (result.success) {
        console.log(`   📋 AWB Number: ${result.trackingNumber}`);
        console.log(`   📊 Status: ${result.status || 'N/A'}`);
        console.log(`   📍 Current Location: ${result.currentLocation || 'N/A'}`);
        console.log(`   🏢 Courier: ${result.courierName}`);
        console.log(`   📊 Tracking Type: ${result.trackingType}`);

        if (result.trackingHistory && result.trackingHistory.length > 0) {
          console.log(`   📜 History Events: ${result.trackingHistory.length}`);
        }

        if (result.trackingUrl) {
          console.log(`   🔗 Tracking URL: ${result.trackingUrl}`);
        }

        if (result.trackingType === 'MANUAL_REQUIRED') {
          console.log('   📝 Manual Tracking Instructions:');
          Object.entries(result.instructions || {}).forEach(([key, value]) => {
            console.log(`      ${key}: ${value}`);
          });
        }
        console.log('');
      }
    } catch (error) {
      this.logTest('Shipment Tracking', false, null, error.message);
    }
  }

  /**
   * Test 5: Shipment Cancellation
   */
  async testShipmentCancellation(awbNumber = null) {
    console.log('❌ Testing Shipment Cancellation...\n');

    // Use provided AWB or create a test one
    const testAwb = awbNumber || `XB${Date.now()}TEST`;

    try {
      const result = await this.service.cancelShipment(testAwb);
      this.logTest('Shipment Cancellation', result.success, result, result.error);

      if (result.success) {
        console.log(`   📋 AWB Number: ${result.awb}`);
        console.log(`   💬 Message: ${result.message}`);
        console.log('');
      }
    } catch (error) {
      this.logTest('Shipment Cancellation', false, null, error.message);
    }
  }

  /**
   * Test 6: Courier List
   */
  async testCourierList() {
    console.log('🚚 Testing Courier List...\n');

    try {
      const result = await this.service.getCourierList();
      this.logTest('Courier List', result.success, result, result.error);

      if (result.success && result.couriers) {
        console.log(`   📦 Available Couriers: ${result.couriers.length}`);
        result.couriers.slice(0, 5).forEach((courier, index) => {
          console.log(`   ${index + 1}. ${courier.courier_name} (ID: ${courier.courier_id})`);
        });
        if (result.couriers.length > 5) {
          console.log(`   ... and ${result.couriers.length - 5} more`);
        }
        console.log('');
      }
    } catch (error) {
      this.logTest('Courier List', false, null, error.message);
    }
  }

  /**
   * Test 7: Pickup Request
   */
  async testPickupRequest(awbNumbers = null) {
    console.log('📋 Testing Pickup Request...\n');

    // Use provided AWBs or create test ones
    const testAwbs = awbNumbers || [`XB${Date.now()}TEST1`, `XB${Date.now()}TEST2`];

    try {
      const result = await this.service.requestPickup(testAwbs);
      this.logTest('Pickup Request', result.success, result, result.error);

      if (result.success) {
        console.log(`   📋 AWB Numbers: ${testAwbs.join(', ')}`);
        console.log(`   📦 Pickup Status: ${result.status || 'Requested'}`);
        console.log(`   💬 Message: ${result.message}`);
        console.log('');
      }
    } catch (error) {
      this.logTest('Pickup Request', false, null, error.message);
    }
  }

  /**
   * Test 8: Service Health Check
   */
  async testServiceHealth() {
    console.log('💊 Testing Service Health Status...\n');

    try {
      const result = await this.service.getHealthStatus();
      this.logTest('Service Health', result.overall === 'healthy', result);

      if (result) {
        console.log(`   🏥 Overall Status: ${result.overall}`);
        console.log(`   🔑 Authentication: ${result.auth}`);
        console.log(`   🌐 API Connectivity: ${result.api}`);
        console.log(`   💾 Cache Status: ${result.cache}`);
        console.log(`   📊 Total Checks: ${result.checks}`);
        console.log('');
      }
    } catch (error) {
      this.logTest('Service Health', false, null, error.message);
    }
  }

  /**
   * Test 9: Configuration Validation
   */
  async testConfigurationValidation() {
    console.log('⚙️ Testing Configuration Validation...\n');

    try {
      const configChecks = {
        email: !!XPRESSBEES_CONFIG.AUTH.EMAIL,
        password: !!XPRESSBEES_CONFIG.AUTH.PASSWORD,
        baseUrl: !!XPRESSBEES_CONFIG.API_BASE_URL && XPRESSBEES_CONFIG.API_BASE_URL.startsWith('http'),
        endpoints: !!XPRESSBEES_CONFIG.ENDPOINTS,
        serviceTypes: !!XPRESSBEES_CONFIG.SERVICE_TYPES
      };

      const validConfig = Object.values(configChecks).every(Boolean);

      this.logTest('Configuration Validation', validConfig, configChecks);

      console.log(`   📧 Email: ${configChecks.email ? '✅ Set' : '❌ Missing'}`);
      console.log(`   🔑 Password: ${configChecks.password ? '✅ Set' : '❌ Missing'}`);
      console.log(`   🌐 Base URL: ${configChecks.baseUrl ? '✅ Valid' : '❌ Invalid'}`);
      console.log(`   🔗 Endpoints: ${configChecks.endpoints ? '✅ Configured' : '❌ Missing'}`);
      console.log(`   📦 Service Types: ${configChecks.serviceTypes ? '✅ Configured' : '❌ Missing'}`);
      console.log('');

      if (!validConfig) {
        console.log('   ⚠️ Missing configuration may cause test failures');
        console.log('   📝 Check your .env file for XpressBees credentials');
        console.log('');
      }

    } catch (error) {
      this.logTest('Configuration Validation', false, null, error.message);
    }
  }

  /**
   * Print test summary
   */
  printSummary() {
    const endTime = Date.now();
    const duration = endTime - this.testResults.startTime;
    const successRate = ((this.testResults.passed / this.testResults.total) * 100).toFixed(1);

    console.log('\n' + '='.repeat(80));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(80));
    console.log(`✅ Passed: ${this.testResults.passed}`);
    console.log(`❌ Failed: ${this.testResults.failed}`);
    console.log(`📊 Total: ${this.testResults.total}`);
    console.log(`🎯 Success Rate: ${successRate}%`);
    console.log(`⏱️ Total Duration: ${duration}ms (${(duration / 1000).toFixed(2)}s)`);
    console.log(`📅 Completed at: ${new Date().toLocaleString()}`);
    console.log('='.repeat(80));

    if (this.testResults.failed > 0) {
      console.log('\n⚠️ Some tests failed. This may be expected for:');
      console.log('   • Test data (non-existent AWB numbers)');
      console.log('   • Account limitations (unactivated features)');
      console.log('   • Network connectivity issues');
      console.log('   • API endpoint maintenance');
    }

    console.log('\n📋 Next Steps:');
    console.log('   • Review failed tests above');
    console.log('   • Check environment variables');
    console.log('   • Verify network connectivity');
    console.log('   • Contact XpressBees support: business@xpressbees.com');
    console.log('   • Phone: 1860 266 9090');
    console.log('   • Service Types: B2C Standard (16789), B2C Air (16790), B2B (16791)');
  }

  /**
   * Run all tests
   */
  async runAllTests() {
    this.printHeader();

    try {
      // Test 1: Authentication
      const token = await this.testAuthentication();

      // Test 2: Configuration Validation
      await this.testConfigurationValidation();

      // Test 3: Rate Calculation
      await this.testRateCalculation();

      // Test 4: Courier List
      await this.testCourierList();

      // Test 5: Shipment Booking
      const awbNumber = await this.testShipmentBooking();

      // Test 6: Shipment Tracking
      await this.testShipmentTracking(awbNumber);

      // Test 7: Pickup Request
      await this.testPickupRequest(awbNumber ? [awbNumber] : null);

      // Test 8: Shipment Cancellation
      await this.testShipmentCancellation(awbNumber);

      // Test 9: Service Health
      await this.testServiceHealth();

    } catch (error) {
      console.log(`💥 Test suite error: ${error.message}`);
    }

    this.printSummary();
    return this.testResults.failed === 0 ? 0 : 1;
  }
}

// Run the tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new XpressBeesIntegrationTest();
  tester.runAllTests()
    .then(exitCode => {
      process.exit(exitCode);
    })
    .catch(error => {
      console.error('💥 Fatal error:', error);
      process.exit(1);
    });
}

export default XpressBeesIntegrationTest;
