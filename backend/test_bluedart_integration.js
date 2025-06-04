import 'dotenv/config';
import { BLUEDART_CONFIG } from './src/config/bluedart.config.js';
import { BlueDartService } from './src/services/bluedart.service.js';

/**
 * BlueDart Integration Test Suite
 * Tests all major BlueDart API functionality
 */

class BlueDartIntegrationTest {
  constructor() {
    this.service = new BlueDartService();
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
      // Test pickup data
      testPickup: {
        AWBNo: [],
        AreaCode: 'BLR',
        CustomerCode: 'TEST01',
        CustomerName: 'RocketryBox Test Customer',
        CustomerPincode: '560001',
        CustomerAddress1: '123 Test Street, Test Area',
        CustomerAddress2: 'Near Test Landmark',
        ContactPersonName: 'Test Contact Person',
        CustomerTelephoneNumber: '9876543210',
        MobileTelNo: '9876543210',
        EmailID: 'test@rocketrybox.com',
        OfficeCloseTime: '1800',
        ProductCode: 'A',
        ShipmentPickupDate: new Date().toISOString().split('T')[0],
        ShipmentPickupTime: '1400',
        NumberofPieces: 1,
        WeightofShipment: 0.5,
        VolumeWeight: 0.5,
        DoxNDox: '1',
        PackType: 'P',
        Remarks: 'Test pickup request',
        ReferenceNo: `TEST_REF_${Date.now()}`
      }
    };
  }

  /**
   * Print test header
   */
  printHeader() {
    console.log('\n' + '='.repeat(80));
    console.log('🚀 BLUEDART INTEGRATION TEST SUITE');
    console.log('='.repeat(80));
    console.log(`📅 Started at: ${new Date().toLocaleString()}`);
    console.log(`🌐 Base URL: ${BLUEDART_CONFIG.BASE_URL}`);
    console.log(`🆔 Consumer Key: ${BLUEDART_CONFIG.CONSUMER_KEY ? '✅ Set' : '❌ Not Set'}`);
    console.log(`🔐 Consumer Secret: ${BLUEDART_CONFIG.CONSUMER_SECRET ? '✅ Set' : '❌ Not Set'}`);
    console.log(`👤 User: ${BLUEDART_CONFIG.USER ? '✅ Set' : '❌ Not Set'}`);
    console.log(`🔑 License Key: ${BLUEDART_CONFIG.LICENSE_KEY ? '✅ Set' : '❌ Not Set'}`);
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
   * Test 1: JWT Token Generation
   */
  async testJWTAuthentication() {
    console.log('🔑 Testing JWT Token Generation...\n');

    try {
      const token = await this.service.getJWTToken();

      if (typeof token === 'string' && token.length > 0) {
        this.logTest('JWT Authentication', true, {
          token: `${token.substring(0, 30)}...`,
          length: token.length
        });
        return token;
      } else {
        this.logTest('JWT Authentication', false, null, 'Invalid token response');
        return null;
      }
    } catch (error) {
      this.logTest('JWT Authentication', false, null, error.message);
      return null;
    }
  }

  /**
   * Test 2: Transit Time Calculation
   */
  async testTransitTime() {
    console.log('🚚 Testing Transit Time Calculation...\n');

    try {
      const result = await this.service.getTransitTime(
        this.testData.testPincodes.origin,
        this.testData.testPincodes.destination,
        'A'
      );

      this.logTest('Transit Time', result.success, result, result.error);

      if (result.success && result.transitData) {
        console.log(`   📍 Origin: ${result.originPincode}`);
        console.log(`   📍 Destination: ${result.destinationPincode}`);
        console.log(`   📦 Product Code: ${result.productCode}`);
        console.log('');
      }
    } catch (error) {
      this.logTest('Transit Time', false, null, error.message);
    }
  }

  /**
   * Test 3: Pickup Registration
   */
  async testPickupRegistration() {
    console.log('📦 Testing Pickup Registration...\n');

    try {
      const result = await this.service.registerPickup(this.testData.testPickup);
      this.logTest('Pickup Registration', result.success, result, result.error || result.message);

      if (result.success) {
        if (result.pickupRequestNumber) {
          console.log(`   📋 Pickup Request Number: ${result.pickupRequestNumber}`);
        }
        if (result.tokenNumber) {
          console.log(`   🎫 Token Number: ${result.tokenNumber}`);
        }
        console.log(`   📊 Registration Type: ${result.technicalStatus || 'API_AUTOMATED'}`);

        if (result.error === 'ACCOUNT_ACTIVATION_REQUIRED') {
          console.log('   💡 Account Status: Activation required for pickup registration');
          console.log('   📞 Next Step: Contact BlueDart support for account activation');
        }
        console.log('');

        return result.pickupRequestNumber || result.tokenNumber;
      }
    } catch (error) {
      this.logTest('Pickup Registration', false, null, error.message);
    }

    return null;
  }

  /**
   * Test 4: Shipment Tracking
   */
  async testShipmentTracking(awbNumber = null) {
    console.log('🔍 Testing Shipment Tracking...\n');

    // Use provided AWB or create a test one
    const testAwb = awbNumber || `BD${Date.now()}TEST`;

    try {
      const result = await this.service.trackShipment(testAwb);
      this.logTest('Shipment Tracking', result.success, result, result.error);

      if (result.success) {
        console.log(`   📋 AWB Number: ${result.awbNumber}`);
        console.log(`   📊 Tracking Data Available: ${!!result.trackingData}`);

        if (result.trackingData) {
          console.log(`   📍 Status: Available`);
        } else {
          console.log(`   📍 Status: No tracking data found (expected for test AWB)`);
        }
        console.log('');
      }
    } catch (error) {
      this.logTest('Shipment Tracking', false, null, error.message);
    }
  }

  /**
   * Test 5: Service Health Check
   */
  async testServiceHealth() {
    console.log('💊 Testing Service Health...\n');

    try {
      // Test multiple endpoints to check overall health
      const healthChecks = {
        jwtGeneration: false,
        transitTime: false,
        overallHealth: false
      };

      // Check JWT generation
      try {
        const token = await this.service.getJWTToken();
        healthChecks.jwtGeneration = !!token;
      } catch (error) {
        console.log(`   🔑 JWT Generation: Failed - ${error.message}`);
      }

      // Check transit time endpoint
      try {
        const transitResult = await this.service.getTransitTime('110001', '400001', 'A');
        healthChecks.transitTime = transitResult.success;
      } catch (error) {
        console.log(`   🚚 Transit Time: Failed - ${error.message}`);
      }

      // Calculate overall health
      const successfulChecks = Object.values(healthChecks).filter(Boolean).length;
      const totalChecks = Object.keys(healthChecks).length - 1; // Exclude overallHealth
      healthChecks.overallHealth = successfulChecks > 0;

      this.logTest('Service Health', healthChecks.overallHealth, {
        jwtGeneration: healthChecks.jwtGeneration ? 'Healthy' : 'Failed',
        transitTime: healthChecks.transitTime ? 'Healthy' : 'Failed',
        successRate: `${successfulChecks}/${totalChecks}`
      });

      console.log(`   🔑 JWT Generation: ${healthChecks.jwtGeneration ? '✅ Healthy' : '❌ Failed'}`);
      console.log(`   🚚 Transit Time API: ${healthChecks.transitTime ? '✅ Healthy' : '❌ Failed'}`);
      console.log(`   📊 Success Rate: ${successfulChecks}/${totalChecks}`);
      console.log('');

    } catch (error) {
      this.logTest('Service Health', false, null, error.message);
    }
  }

  /**
   * Test 6: Configuration Validation
   */
  async testConfigurationValidation() {
    console.log('⚙️ Testing Configuration Validation...\n');

    try {
      const configChecks = {
        consumerKey: !!BLUEDART_CONFIG.CONSUMER_KEY,
        consumerSecret: !!BLUEDART_CONFIG.CONSUMER_SECRET,
        user: !!BLUEDART_CONFIG.USER,
        licenseKey: !!BLUEDART_CONFIG.LICENSE_KEY,
        baseUrl: !!BLUEDART_CONFIG.BASE_URL && BLUEDART_CONFIG.BASE_URL.startsWith('http')
      };

      const validConfig = Object.values(configChecks).every(Boolean);

      this.logTest('Configuration Validation', validConfig, configChecks);

      console.log(`   🔑 Consumer Key: ${configChecks.consumerKey ? '✅ Set' : '❌ Missing'}`);
      console.log(`   🔐 Consumer Secret: ${configChecks.consumerSecret ? '✅ Set' : '❌ Missing'}`);
      console.log(`   👤 User: ${configChecks.user ? '✅ Set' : '❌ Missing'}`);
      console.log(`   🎫 License Key: ${configChecks.licenseKey ? '✅ Set' : '❌ Missing'}`);
      console.log(`   🌐 Base URL: ${configChecks.baseUrl ? '✅ Valid' : '❌ Invalid'}`);
      console.log('');

      if (!validConfig) {
        console.log('   ⚠️ Missing configuration may cause test failures');
        console.log('   📝 Check your .env file for BlueDart credentials');
        console.log('');
      }

    } catch (error) {
      this.logTest('Configuration Validation', false, null, error.message);
    }
  }

  /**
   * Test 7: E-Way Bill Generation (if available)
   */
  async testEWayBillGeneration() {
    console.log('📋 Testing E-Way Bill Generation Capability...\n');

    try {
      // Check if E-Way Bill endpoint is configured
      const hasEWayBillEndpoint = !!BLUEDART_CONFIG.EWAY_BILL_URL;

      this.logTest('E-Way Bill Configuration', hasEWayBillEndpoint, {
        endpointConfigured: hasEWayBillEndpoint,
        feature: 'E-Way Bill Generation'
      });

      if (hasEWayBillEndpoint) {
        console.log(`   🌐 E-Way Bill URL: ${BLUEDART_CONFIG.EWAY_BILL_URL}`);
        console.log(`   📊 Feature Status: Available`);
      } else {
        console.log(`   📊 Feature Status: Endpoint not configured`);
      }
      console.log('');

    } catch (error) {
      this.logTest('E-Way Bill Configuration', false, null, error.message);
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
      console.log('   • Account limitations (pickup registration requires activation)');
      console.log('   • Network connectivity issues');
      console.log('   • API endpoint maintenance');
    }

    console.log('\n📋 Next Steps:');
    console.log('   • Review failed tests above');
    console.log('   • Check environment variables');
    console.log('   • Verify network connectivity');
    console.log('   • Contact BlueDart support: business@bluedart.com');
    console.log('   • Phone: 1860 233 1234');
    console.log('   • For pickup registration: Account activation may be required');
  }

  /**
   * Run all tests
   */
  async runAllTests() {
    this.printHeader();

    try {
      // Test 1: JWT Authentication
      const token = await this.testJWTAuthentication();

      // Test 2: Configuration Validation
      await this.testConfigurationValidation();

      // Test 3: Transit Time
      await this.testTransitTime();

      // Test 4: Pickup Registration
      const pickupReference = await this.testPickupRegistration();

      // Test 5: Shipment Tracking
      await this.testShipmentTracking();

      // Test 6: Service Health
      await this.testServiceHealth();

      // Test 7: E-Way Bill Configuration
      await this.testEWayBillGeneration();

    } catch (error) {
      console.log(`💥 Test suite error: ${error.message}`);
    }

    this.printSummary();
    return this.testResults.failed === 0 ? 0 : 1;
  }
}

// Run the tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new BlueDartIntegrationTest();
  tester.runAllTests()
    .then(exitCode => {
      process.exit(exitCode);
    })
    .catch(error => {
      console.error('💥 Fatal error:', error);
      process.exit(1);
    });
}

export default BlueDartIntegrationTest;
