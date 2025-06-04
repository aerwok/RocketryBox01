import dotenv from 'dotenv';
dotenv.config();

import { EKART_CONFIG } from './src/config/ekart.config.js';
import { EkartService } from './src/services/ekart.service.js';

console.log('✅ Test file is loading...');

/**
 * Ekart Logistics Integration Test Suite
 * Tests all major Ekart API functionality
 */

class EkartIntegrationTest {
  constructor() {
    this.service = new EkartService();
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
        codAmount: 0
      }
    };
  }

  /**
   * Print test header
   */
  printHeader() {
    console.log('\n' + '='.repeat(80));
    console.log('🚀 EKART LOGISTICS INTEGRATION TEST SUITE');
    console.log('='.repeat(80));
    console.log(`📅 Started at: ${new Date().toLocaleString()}`);
    console.log(`🌐 Base URL: ${EKART_CONFIG.BASE_URL}`);
    console.log(`🆔 Client ID: ${EKART_CONFIG.CLIENT_ID}`);
    console.log(`👤 Username: ${EKART_CONFIG.USERNAME ? '✅ Set' : '❌ Not Set'}`);
    console.log(`🔑 Password: ${EKART_CONFIG.PASSWORD ? '✅ Set' : '❌ Not Set'}`);
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
      const token = await this.service.getAccessToken();

      if (typeof token === 'string' && token.length > 0) {
        this.logTest('Authentication', true, { token: `${token.substring(0, 20)}...` });
        return token;
      } else if (token && token.success === false) {
        this.logTest('Authentication', false, token, token.error);
        return null;
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
   * Test 2: Serviceability Check
   */
  async testServiceability() {
    console.log('📍 Testing Serviceability Check...\n');

    // Test serviceable pincode
    try {
      const result1 = await this.service.checkServiceability(this.testData.testPincodes.serviceable);
      this.logTest(
        `Serviceability - ${this.testData.testPincodes.serviceable}`,
        result1.success,
        result1,
        result1.error
      );
    } catch (error) {
      this.logTest(
        `Serviceability - ${this.testData.testPincodes.serviceable}`,
        false,
        null,
        error.message
      );
    }

    // Test unserviceable pincode
    try {
      const result2 = await this.service.checkServiceability(this.testData.testPincodes.unserviceable);
      this.logTest(
        `Serviceability - ${this.testData.testPincodes.unserviceable}`,
        result2.success,
        result2,
        result2.error
      );
    } catch (error) {
      this.logTest(
        `Serviceability - ${this.testData.testPincodes.unserviceable}`,
        false,
        null,
        error.message
      );
    }
  }

  /**
   * Test 3: Pricing Estimate
   */
  async testPricingEstimate() {
    console.log('💰 Testing Pricing Estimate...\n');

    const estimateData = {
      pickupPincode: this.testData.testPincodes.origin,
      dropPincode: this.testData.testPincodes.destination,
      weight: 500, // grams
      length: 20,
      width: 15,
      height: 10,
      paymentType: 'Prepaid',
      invoiceAmount: 500
    };

    try {
      const result = await this.service.getPricingEstimate(estimateData);
      this.logTest('Pricing Estimate', result.success, result, result.error);

      if (result.success && result.courierPartners) {
        console.log(`   📦 Available Partners: ${result.totalPartners}`);
        result.courierPartners.forEach((partner, index) => {
          console.log(`   ${index + 1}. ${partner.courier_name || 'Ekart'} - Rate: ₹${partner.total_amount || 'N/A'}`);
        });
        console.log('');
      }
    } catch (error) {
      this.logTest('Pricing Estimate', false, null, error.message);
    }
  }

  /**
   * Test 4: Shipment Booking
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
   * Test 5: Shipment Tracking
   */
  async testShipmentTracking(awbNumber = null) {
    console.log('🔍 Testing Shipment Tracking...\n');

    // Use provided AWB or create a test one
    const testAwb = awbNumber || `EK${Date.now()}TEST`;

    try {
      const result = await this.service.trackShipment(testAwb);
      this.logTest('Shipment Tracking', result.success, result, result.apiError);

      if (result.success) {
        console.log(`   📋 AWB Number: ${result.trackingId}`);
        console.log(`   📊 Status: ${result.status || 'N/A'}`);
        console.log(`   📍 Current Location: ${result.currentLocation || 'N/A'}`);
        console.log(`   🏢 Courier: ${result.courierName}`);
        console.log(`   📊 Tracking Type: ${result.trackingType}`);

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
   * Test 6: Shipment Cancellation
   */
  async testShipmentCancellation(awbNumber = null) {
    console.log('❌ Testing Shipment Cancellation...\n');

    // Use provided AWB or create a test one
    const testAwb = awbNumber || `EK${Date.now()}TEST`;

    try {
      const result = await this.service.cancelShipment(testAwb);
      this.logTest('Shipment Cancellation', result.success, result, result.error);

      if (result.success) {
        console.log(`   📋 AWB Number: ${result.trackingId}`);
        console.log(`   💬 Message: ${result.message}`);
        console.log('');
      }
    } catch (error) {
      this.logTest('Shipment Cancellation', false, null, error.message);
    }
  }

  /**
   * Test 7: Health Status Check
   */
  async testHealthStatus() {
    console.log('💊 Testing Service Health Status...\n');

    try {
      const result = await this.service.getHealthStatus();
      this.logTest('Health Status', result.status === 'HEALTHY', result);

      if (result) {
        console.log(`   🏥 Overall Status: ${result.status}`);
        console.log(`   🔑 Authentication: ${result.details?.authentication || 'N/A'}`);
        console.log(`   🌐 API Endpoint: ${result.details?.apiEndpoint || 'N/A'}`);
        console.log(`   🆔 Client ID: ${result.details?.clientId || 'N/A'}`);
        console.log(`   🔐 Has Credentials: ${result.details?.hasCredentials ? 'Yes' : 'No'}`);
        console.log(`   💬 Message: ${result.message || 'N/A'}`);
        console.log(`   📅 Timestamp: ${result.timestamp || 'N/A'}`);
        console.log('');
      }
    } catch (error) {
      this.logTest('Health Status', false, null, error.message);
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
    console.log('   • Contact Ekart support if needed: business@ekartlogistics.in');
    console.log('   • Phone: 1800-123-EKART');
  }

  /**
   * Run all tests
   */
  async runAllTests() {
    this.printHeader();

    try {
      // Test 1: Authentication
      const token = await this.testAuthentication();

      // Test 2: Serviceability Check
      await this.testServiceability();

      // Test 3: Pricing Estimate
      await this.testPricingEstimate();

      // Test 4: Shipment Booking
      const awbNumber = await this.testShipmentBooking();

      // Test 5: Shipment Tracking
      await this.testShipmentTracking(awbNumber);

      // Test 6: Shipment Cancellation
      await this.testShipmentCancellation(awbNumber);

      // Test 7: Health Status
      await this.testHealthStatus();

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
  process.argv[1].endsWith('test_ekart_integration.js');

console.log('🔍 Debug: isMainModule =', isMainModule);

if (isMainModule) {
  console.log('🔍 Debug: Starting test execution...');
  console.log('🔍 Debug: Creating EkartIntegrationTest...');

  const tester = new EkartIntegrationTest();
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

export default EkartIntegrationTest;
