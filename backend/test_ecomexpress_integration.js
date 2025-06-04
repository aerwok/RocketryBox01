import 'dotenv/config';
import { ECOMEXPRESS_CONFIG } from './src/config/ecomexpress.config.js';
import { EcomExpressService } from './src/services/ecomexpress.service.js';

/**
 * EcomExpress Integration Test Suite
 * Tests all major EcomExpress API functionality for all service types
 */

class EcomExpressIntegrationTest {
  constructor() {
    this.service = new EcomExpressService();
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
      // Test shipment data for each service type
      testShipments: {
        BA: {
          serviceType: 'BA',
          shipper: {
            name: 'RocketryBox Test Shipper BA',
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
            name: 'Test Customer BA',
            phone: '9876543211',
            gstNumber: '',
            address: {
              line1: '456 Customer Street, Customer Area',
              city: 'Mumbai',
              state: 'Maharashtra',
              pincode: '400001'
            }
          },
          orderNumber: `TEST_BA_ORD_${Date.now()}`,
          invoiceNumber: `TEST_BA_INV_${Date.now()}`,
          commodity: 'Test Product BA',
          declaredValue: 500,
          weight: 1, // kg
          dimensions: {
            length: 20,
            width: 15,
            height: 10
          },
          cod: false,
          codAmount: 0
        },
        EXSPLUS: {
          serviceType: 'EXSPLUS',
          shipper: {
            name: 'RocketryBox Test Shipper EXSPLUS',
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
            name: 'Test Customer EXSPLUS',
            phone: '9876543211',
            gstNumber: '',
            address: {
              line1: '456 Customer Street, Customer Area',
              city: 'Mumbai',
              state: 'Maharashtra',
              pincode: '400001'
            }
          },
          orderNumber: `TEST_EXSPLUS_ORD_${Date.now()}`,
          invoiceNumber: `TEST_EXSPLUS_INV_${Date.now()}`,
          commodity: 'Test Product EXSPLUS',
          declaredValue: 1000,
          weight: 0.5, // kg
          dimensions: {
            length: 15,
            width: 10,
            height: 8
          },
          cod: true,
          codAmount: 1000
        },
        EGS: {
          serviceType: 'EGS',
          shipper: {
            name: 'RocketryBox Test Shipper EGS',
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
            name: 'Test Customer EGS',
            phone: '9876543211',
            gstNumber: '',
            address: {
              line1: '456 Customer Street, Customer Area',
              city: 'Mumbai',
              state: 'Maharashtra',
              pincode: '400001'
            }
          },
          orderNumber: `TEST_EGS_ORD_${Date.now()}`,
          invoiceNumber: `TEST_EGS_INV_${Date.now()}`,
          commodity: 'Test Product EGS',
          declaredValue: 250,
          weight: 2, // kg
          dimensions: {
            length: 25,
            width: 20,
            height: 15
          },
          cod: false,
          codAmount: 0
        }
      }
    };
  }

  /**
   * Print test header
   */
  printHeader() {
    console.log('\n' + '='.repeat(80));
    console.log('🚀 ECOMEXPRESS INTEGRATION TEST SUITE');
    console.log('='.repeat(80));
    console.log(`📅 Started at: ${new Date().toLocaleString()}`);
    console.log(`🌐 API URL: ${ECOMEXPRESS_CONFIG.API_BASE_URL}`);
    console.log(`🌐 Shipment URL: ${ECOMEXPRESS_CONFIG.SHIPMENT_BASE_URL}`);
    console.log(`🌐 Tracking URL: ${ECOMEXPRESS_CONFIG.TRACKING_BASE_URL}`);
    console.log('');
    console.log('📊 Service Types:');
    console.log(`   • BA (Standard): ${ECOMEXPRESS_CONFIG.SERVICES.BA.USERNAME ? '✅ Configured' : '❌ Not Configured'}`);
    console.log(`   • EXSPLUS (Express): ${ECOMEXPRESS_CONFIG.SERVICES.EXSPLUS.USERNAME ? '✅ Configured' : '❌ Not Configured'}`);
    console.log(`   • EGS (Economy): ${ECOMEXPRESS_CONFIG.SERVICES.EGS.USERNAME ? '✅ Configured' : '❌ Not Configured'}`);
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
   * Test 1: Service Configuration Validation
   */
  async testServiceConfiguration() {
    console.log('⚙️ Testing Service Configuration...\n');

    try {
      const serviceChecks = {
        BA: {
          username: !!ECOMEXPRESS_CONFIG.SERVICES.BA.USERNAME,
          password: !!ECOMEXPRESS_CONFIG.SERVICES.BA.PASSWORD,
          code: !!ECOMEXPRESS_CONFIG.SERVICES.BA.CODE
        },
        EXSPLUS: {
          username: !!ECOMEXPRESS_CONFIG.SERVICES.EXSPLUS.USERNAME,
          password: !!ECOMEXPRESS_CONFIG.SERVICES.EXSPLUS.PASSWORD,
          code: !!ECOMEXPRESS_CONFIG.SERVICES.EXSPLUS.CODE
        },
        EGS: {
          username: !!ECOMEXPRESS_CONFIG.SERVICES.EGS.USERNAME,
          password: !!ECOMEXPRESS_CONFIG.SERVICES.EGS.PASSWORD,
          code: !!ECOMEXPRESS_CONFIG.SERVICES.EGS.CODE
        }
      };

      const allServicesConfigured = Object.values(serviceChecks).every(service =>
        Object.values(service).every(Boolean)
      );

      this.logTest('Service Configuration', allServicesConfigured, serviceChecks);

      Object.entries(serviceChecks).forEach(([serviceName, checks]) => {
        const serviceConfigured = Object.values(checks).every(Boolean);
        console.log(`   📦 ${serviceName} Service: ${serviceConfigured ? '✅ Configured' : '❌ Missing credentials'}`);

        if (!serviceConfigured) {
          Object.entries(checks).forEach(([field, isSet]) => {
            if (!isSet) {
              console.log(`      ❌ Missing: ECOMEXPRESS_${serviceName}_${field.toUpperCase()}`);
            }
          });
        }
      });
      console.log('');

      if (!allServicesConfigured) {
        console.log('   ⚠️ Missing configuration may cause test failures');
        console.log('   📝 Check your .env file for EcomExpress credentials');
        console.log('');
      }

    } catch (error) {
      this.logTest('Service Configuration', false, null, error.message);
    }
  }

  /**
   * Test 2: Serviceability Check for each service type
   */
  async testServiceability() {
    console.log('📍 Testing Serviceability Check for All Services...\n');

    const serviceTypes = ['BA', 'EXSPLUS', 'EGS'];

    for (const serviceType of serviceTypes) {
      try {
        const result = await this.service.checkServiceability(
          this.testData.testPincodes.serviceable,
          serviceType
        );

        this.logTest(
          `Serviceability - ${serviceType} - ${this.testData.testPincodes.serviceable}`,
          result.success,
          result,
          result.error
        );

        if (result.success) {
          console.log(`   📦 Service: ${serviceType}`);
          console.log(`   📍 Pincode: ${this.testData.testPincodes.serviceable}`);
          console.log(`   ✅ Serviceable: ${result.serviceable}`);
          console.log('');
        }
      } catch (error) {
        this.logTest(
          `Serviceability - ${serviceType} - ${this.testData.testPincodes.serviceable}`,
          false,
          null,
          error.message
        );
      }
    }
  }

  /**
   * Test 3: Rate Calculation for each service type
   */
  async testRateCalculation() {
    console.log('💰 Testing Rate Calculation for All Services...\n');

    const serviceTypes = ['BA', 'EXSPLUS', 'EGS'];

    for (const serviceType of serviceTypes) {
      try {
        const shipmentData = this.testData.testShipments[serviceType];
        const result = await this.service.calculateRate(shipmentData, serviceType);

        this.logTest(`Rate Calculation - ${serviceType}`, result.success, result, result.error);

        if (result.success) {
          console.log(`   📦 Service: ${serviceType}`);
          console.log(`   💰 Total Rate: ₹${result.totalRate || 'N/A'}`);
          console.log(`   📊 Rate Source: ${result.rateSource || 'API'}`);
          console.log(`   ⚖️ Weight: ${shipmentData.weight}kg`);
          console.log(`   💸 COD: ${shipmentData.cod ? 'Yes' : 'No'}`);
          console.log('');
        }
      } catch (error) {
        this.logTest(`Rate Calculation - ${serviceType}`, false, null, error.message);
      }
    }
  }

  /**
   * Test 4: Shipment Booking for each service type
   */
  async testShipmentBooking() {
    console.log('📦 Testing Shipment Booking for All Services...\n');

    const serviceTypes = ['BA', 'EXSPLUS', 'EGS'];
    const awbNumbers = {};

    for (const serviceType of serviceTypes) {
      try {
        const shipmentData = this.testData.testShipments[serviceType];
        const result = await this.service.bookShipment(shipmentData, serviceType);

        this.logTest(`Shipment Booking - ${serviceType}`, result.success, result, result.apiError);

        if (result.success) {
          console.log(`   📦 Service: ${serviceType}`);
          console.log(`   📋 AWB Number: ${result.awb}`);
          console.log(`   🏢 Courier: ${result.courierName}`);
          console.log(`   📊 Booking Type: ${result.bookingType}`);

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

          awbNumbers[serviceType] = result.awb;
        }
      } catch (error) {
        this.logTest(`Shipment Booking - ${serviceType}`, false, null, error.message);
      }
    }

    return awbNumbers;
  }

  /**
   * Test 5: Shipment Tracking for each service type
   */
  async testShipmentTracking(awbNumbers = {}) {
    console.log('🔍 Testing Shipment Tracking for All Services...\n');

    const serviceTypes = ['BA', 'EXSPLUS', 'EGS'];

    for (const serviceType of serviceTypes) {
      const testAwb = awbNumbers[serviceType] || `EC${serviceType}${Date.now()}TEST`;

      try {
        const result = await this.service.trackShipment(testAwb, serviceType);
        this.logTest(`Shipment Tracking - ${serviceType}`, result.success, result, result.apiError);

        if (result.success) {
          console.log(`   📦 Service: ${serviceType}`);
          console.log(`   📋 AWB Number: ${result.trackingId || result.awbNumber}`);
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
        this.logTest(`Shipment Tracking - ${serviceType}`, false, null, error.message);
      }
    }
  }

  /**
   * Test 6: Shipment Cancellation for each service type
   */
  async testShipmentCancellation(awbNumbers = {}) {
    console.log('❌ Testing Shipment Cancellation for All Services...\n');

    const serviceTypes = ['BA', 'EXSPLUS', 'EGS'];

    for (const serviceType of serviceTypes) {
      const testAwb = awbNumbers[serviceType] || `EC${serviceType}${Date.now()}TEST`;

      try {
        const result = await this.service.cancelShipment(testAwb, serviceType);
        this.logTest(`Shipment Cancellation - ${serviceType}`, result.success, result, result.error);

        if (result.success) {
          console.log(`   📦 Service: ${serviceType}`);
          console.log(`   📋 AWB Number: ${result.awb || result.trackingId}`);
          console.log(`   💬 Message: ${result.message || 'Cancellation processed'}`);
          console.log('');
        }
      } catch (error) {
        this.logTest(`Shipment Cancellation - ${serviceType}`, false, null, error.message);
      }
    }
  }

  /**
   * Test 7: Service Health Check
   */
  async testServiceHealth() {
    console.log('💊 Testing Service Health Status...\n');

    try {
      const result = await this.service.getHealthStatus();
      this.logTest('Service Health', result.overall === 'healthy', result);

      if (result) {
        console.log(`   🏥 Overall Status: ${result.overall}`);
        console.log(`   📦 BA Service: ${result.services?.BA || 'unknown'}`);
        console.log(`   📦 EXSPLUS Service: ${result.services?.EXSPLUS || 'unknown'}`);
        console.log(`   📦 EGS Service: ${result.services?.EGS || 'unknown'}`);
        console.log(`   🌐 API Connectivity: ${result.api}`);
        console.log(`   📊 Total Checks: ${result.checks}`);
        console.log('');
      }
    } catch (error) {
      this.logTest('Service Health', false, null, error.message);
    }
  }

  /**
   * Test 8: Pickup Request (if available)
   */
  async testPickupRequest(awbNumbers = {}) {
    console.log('📋 Testing Pickup Request...\n');

    try {
      const allAwbs = Object.values(awbNumbers).filter(Boolean);

      if (allAwbs.length === 0) {
        // Create test AWBs if none provided
        allAwbs.push(`ECBA${Date.now()}TEST`, `ECEXS${Date.now()}TEST`, `ECEGS${Date.now()}TEST`);
      }

      const result = await this.service.requestPickup(allAwbs);
      this.logTest('Pickup Request', result.success, result, result.error);

      if (result.success) {
        console.log(`   📋 AWB Numbers: ${allAwbs.join(', ')}`);
        console.log(`   📦 Pickup Status: ${result.status || 'Requested'}`);
        console.log(`   💬 Message: ${result.message || 'Pickup request processed'}`);
        console.log('');
      }
    } catch (error) {
      this.logTest('Pickup Request', false, null, error.message);
    }
  }

  /**
   * Test 9: Multi-Service Integration Test
   */
  async testMultiServiceIntegration() {
    console.log('🔗 Testing Multi-Service Integration...\n');

    try {
      // Test all services simultaneously for the same shipment route
      const testRoute = {
        pickup: this.testData.testPincodes.origin,
        delivery: this.testData.testPincodes.destination
      };

      const serviceResults = {};
      const serviceTypes = ['BA', 'EXSPLUS', 'EGS'];

      for (const serviceType of serviceTypes) {
        try {
          const serviceabilityResult = await this.service.checkServiceability(
            testRoute.delivery,
            serviceType
          );

          serviceResults[serviceType] = {
            serviceable: serviceabilityResult.serviceable,
            responseTime: serviceabilityResult.responseTime
          };
        } catch (error) {
          serviceResults[serviceType] = {
            serviceable: false,
            error: error.message
          };
        }
      }

      const overallSuccess = Object.values(serviceResults).some(result => result.serviceable);

      this.logTest('Multi-Service Integration', overallSuccess, serviceResults);

      console.log(`   🗺️ Route: ${testRoute.pickup} → ${testRoute.delivery}`);
      Object.entries(serviceResults).forEach(([service, result]) => {
        console.log(`   📦 ${service}: ${result.serviceable ? '✅ Available' : '❌ Not Available'}`);
        if (result.responseTime) {
          console.log(`      ⏱️ Response Time: ${result.responseTime}ms`);
        }
        if (result.error) {
          console.log(`      ❌ Error: ${result.error}`);
        }
      });
      console.log('');

    } catch (error) {
      this.logTest('Multi-Service Integration', false, null, error.message);
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
      console.log('   • Missing service credentials for specific service types');
    }

    console.log('\n📋 Next Steps:');
    console.log('   • Review failed tests above');
    console.log('   • Check environment variables for all service types');
    console.log('   • Verify network connectivity');
    console.log('   • Contact EcomExpress support: business@ecomexpress.in');
    console.log('   • Phone: +91-124-6148888');
    console.log('   • Ensure all three service accounts are activated:');
    console.log('     - BA (Standard Delivery)');
    console.log('     - EXSPLUS (Express Delivery)');
    console.log('     - EGS (Economy Delivery)');
  }

  /**
   * Run all tests
   */
  async runAllTests() {
    this.printHeader();

    try {
      // Test 1: Service Configuration
      await this.testServiceConfiguration();

      // Test 2: Serviceability Check
      await this.testServiceability();

      // Test 3: Rate Calculation
      await this.testRateCalculation();

      // Test 4: Shipment Booking
      const awbNumbers = await this.testShipmentBooking();

      // Test 5: Shipment Tracking
      await this.testShipmentTracking(awbNumbers);

      // Test 6: Pickup Request
      await this.testPickupRequest(awbNumbers);

      // Test 7: Shipment Cancellation
      await this.testShipmentCancellation(awbNumbers);

      // Test 8: Service Health
      await this.testServiceHealth();

      // Test 9: Multi-Service Integration
      await this.testMultiServiceIntegration();

    } catch (error) {
      console.log(`💥 Test suite error: ${error.message}`);
    }

    this.printSummary();
    return this.testResults.failed === 0 ? 0 : 1;
  }
}

// Run the tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new EcomExpressIntegrationTest();
  tester.runAllTests()
    .then(exitCode => {
      process.exit(exitCode);
    })
    .catch(error => {
      console.error('💥 Fatal error:', error);
      process.exit(1);
    });
}

export default EcomExpressIntegrationTest;
