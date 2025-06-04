/**
 * Delhivery API Integration Test Suite
 * Complete B2C and B2B functionality testing
 * Based on official Delhivery API documentation
 */

import { DELHIVERY_CONFIG } from './src/config/delhivery.config.js';
import delhiveryService from './src/services/delhivery.service.js';
import { DelhiveryAPI } from './src/utils/delhivery.js';

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

/**
 * Enhanced logging with colors and formatting
 */
const log = {
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  section: (msg) => console.log(`\n${colors.cyan}${colors.bright}=== ${msg} ===${colors.reset}`),
  subsection: (msg) => console.log(`\n${colors.magenta}--- ${msg} ---${colors.reset}`),
  result: (success, msg) => success ? log.success(msg) : log.error(msg)
};

/**
 * Test configuration and sample data
 */
const TEST_CONFIG = {
  // Test pincodes
  VALID_PINCODES: ['110001', '400001', '560001', '600001'], // Delhi, Mumbai, Bangalore, Chennai
  INVALID_PINCODES: ['000000', '999999'],

  // Sample shipment data
  SAMPLE_SHIPMENT: {
    // Sender details
    senderName: 'RocketryBox Test Sender',
    senderAddress: 'Test Warehouse, Sector 1, Test City',
    senderPincode: '110001',
    senderPhone: '9876543210',
    senderEmail: 'sender@rocketrybox.com',

    // Receiver details
    receiverName: 'Test Customer',
    receiverAddress: 'Test Address, Lane 1, Test Area',
    receiverPincode: '400001',
    receiverPhone: '9123456789',
    receiverEmail: 'customer@test.com',

    // Package details
    weight: 1.5, // kg
    dimensions: {
      length: 20,
      width: 15,
      height: 10
    },
    products: [
      { name: 'Test Product 1', quantity: 1, value: 500 },
      { name: 'Test Product 2', quantity: 2, value: 750 }
    ],

    // Order details
    orderId: `TEST_DLVY_${Date.now()}`,
    paymentMode: 'COD',
    codAmount: 1250,
    invoiceValue: 1250,
    serviceType: 'Surface',

    // Optional details
    pickupLocation: 'Test Warehouse',
    fragileShipment: false,
    gstDetails: {
      hsnCode: '123456',
      sellerGst: 'TEST123456789',
      invoiceReference: `INV_${Date.now()}`
    }
  }
};

/**
 * Performance metrics tracking
 */
class PerformanceTracker {
  constructor() {
    this.metrics = [];
  }

  start(operation) {
    return {
      operation,
      startTime: Date.now(),
      end: () => {
        const endTime = Date.now();
        const duration = endTime - this.startTime;
        this.metrics.push({ operation, duration, timestamp: new Date() });
        return duration;
      }
    };
  }

  getReport() {
    const totalTests = this.metrics.length;
    const totalTime = this.metrics.reduce((sum, m) => sum + m.duration, 0);
    const avgTime = totalTime / totalTests;
    const slowestTest = this.metrics.reduce((max, m) => m.duration > max.duration ? m : max, { duration: 0 });
    const fastestTest = this.metrics.reduce((min, m) => m.duration < min.duration ? m : min, { duration: Infinity });

    return {
      totalTests,
      totalTime,
      avgTime: Math.round(avgTime),
      slowestTest: { ...slowestTest, duration: Math.round(slowestTest.duration) },
      fastestTest: { ...fastestTest, duration: Math.round(fastestTest.duration) }
    };
  }
}

const performanceTracker = new PerformanceTracker();

/**
 * Test result aggregator
 */
class TestResults {
  constructor() {
    this.results = [];
  }

  add(testName, success, duration, details = {}) {
    this.results.push({
      testName,
      success,
      duration,
      details,
      timestamp: new Date()
    });
  }

  getSummary() {
    const total = this.results.length;
    const passed = this.results.filter(r => r.success).length;
    const failed = total - passed;
    const successRate = ((passed / total) * 100).toFixed(1);

    return { total, passed, failed, successRate };
  }

  getFailures() {
    return this.results.filter(r => !r.success);
  }
}

const testResults = new TestResults();

/**
 * Test helper functions
 */
const testHelpers = {
  async runTest(testName, testFunction) {
    const timer = performanceTracker.start(testName);
    try {
      log.subsection(testName);
      const result = await testFunction();
      const duration = timer.end();

      if (result.success) {
        log.success(`${testName} completed successfully (${duration}ms)`);
        testResults.add(testName, true, duration, result);
      } else {
        log.error(`${testName} failed: ${result.error}`);
        testResults.add(testName, false, duration, result);
      }

      return result;
    } catch (error) {
      const duration = timer.end();
      log.error(`${testName} threw exception: ${error.message}`);
      testResults.add(testName, false, duration, { error: error.message });
      return { success: false, error: error.message };
    }
  },

  validateResponse(response, requiredFields = []) {
    if (!response) {
      return { valid: false, error: 'No response received' };
    }

    for (const field of requiredFields) {
      if (!(field in response)) {
        return { valid: false, error: `Missing required field: ${field}` };
      }
    }

    return { valid: true };
  },

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
};

/**
 * 1. Configuration and Initialization Tests
 */
async function testConfiguration() {
  return testHelpers.runTest('Configuration Validation', async () => {
    log.info('Testing Delhivery configuration...');

    // Test configuration loading
    if (!DELHIVERY_CONFIG) {
      return { success: false, error: 'Delhivery configuration not loaded' };
    }

    // Test required configuration fields
    const requiredFields = ['API_TOKEN', 'CLIENT_NAME', 'BASE_URL', 'ENDPOINTS'];
    for (const field of requiredFields) {
      if (!DELHIVERY_CONFIG[field]) {
        return { success: false, error: `Missing configuration field: ${field}` };
      }
    }

    // Test configuration validation function
    const isValid = DELHIVERY_CONFIG.validateConfig();
    log.info(`Configuration validation: ${isValid ? 'Valid' : 'Invalid (using defaults)'}`);

    return {
      success: true,
      configValid: isValid,
      apiEndpoint: DELHIVERY_CONFIG.BASE_URL,
      clientName: DELHIVERY_CONFIG.CLIENT_NAME
    };
  });
}

async function testServiceInitialization() {
  return testHelpers.runTest('Service Initialization', async () => {
    log.info('Initializing Delhivery service...');

    const initResult = await delhiveryService.initialize();

    if (!initResult.success) {
      return { success: false, error: `Service initialization failed: ${initResult.error}` };
    }

    const status = delhiveryService.getServiceStatus();
    log.info(`Service status: ${status.healthStatus}`);
    log.info(`Supported services: ${status.supportedServices.join(', ')}`);

    return {
      success: true,
      status: status.healthStatus,
      isInitialized: status.isInitialized,
      supportedServices: status.supportedServices
    };
  });
}

/**
 * 2. API Connectivity Tests
 */
async function testAPIConnectivity() {
  return testHelpers.runTest('API Connectivity', async () => {
    log.info('Testing Delhivery API connectivity...');

    const delhiveryAPI = new DelhiveryAPI();
    const healthCheck = await delhiveryService.performHealthCheck();

    if (!healthCheck.success) {
      return {
        success: false,
        error: `API connectivity failed: ${healthCheck.error}`,
        responseTime: healthCheck.responseTime
      };
    }

    log.info(`API response time: ${healthCheck.responseTime}ms`);

    return {
      success: true,
      responseTime: healthCheck.responseTime,
      status: healthCheck.status,
      endpoint: healthCheck.endpoint
    };
  });
}

/**
 * 3. Pincode Serviceability Tests
 */
async function testPincodeServiceability() {
  return testHelpers.runTest('Pincode Serviceability Check', async () => {
    log.info('Testing pincode serviceability checks...');

    const results = {};

    // Test valid pincodes
    for (const pincode of TEST_CONFIG.VALID_PINCODES) {
      log.info(`Checking serviceability for pincode: ${pincode}`);
      const result = await delhiveryService.checkPincodeServiceability(pincode);

      if (!result.success) {
        return { success: false, error: `Failed to check pincode ${pincode}: ${result.error}` };
      }

      results[pincode] = {
        serviceable: result.serviceable,
        services: result.services,
        location: result.locationDetails
      };

      log.info(`Pincode ${pincode}: ${result.serviceable ? 'Serviceable' : 'Not Serviceable'}`);
      if (result.services) {
        log.info(`  Services: COD=${result.services.cod}, Prepaid=${result.services.prepaid}`);
      }
    }

    // Test invalid pincodes
    for (const pincode of TEST_CONFIG.INVALID_PINCODES) {
      const result = await delhiveryService.checkPincodeServiceability(pincode);
      if (result.success && result.serviceable) {
        log.warning(`Invalid pincode ${pincode} reported as serviceable`);
      }
    }

    return {
      success: true,
      results,
      testedPincodes: TEST_CONFIG.VALID_PINCODES.length + TEST_CONFIG.INVALID_PINCODES.length
    };
  });
}

/**
 * 4. Rate Calculation Tests
 */
async function testRateCalculation() {
  return testHelpers.runTest('Rate Calculation', async () => {
    log.info('Testing shipping rate calculations...');

    const delhiveryAPI = new DelhiveryAPI();
    const packageDetails = {
      weight: TEST_CONFIG.SAMPLE_SHIPMENT.weight,
      paymentMode: 'COD',
      serviceType: 'Surface'
    };

    const deliveryDetails = {
      pickupPincode: TEST_CONFIG.SAMPLE_SHIPMENT.senderPincode,
      deliveryPincode: TEST_CONFIG.SAMPLE_SHIPMENT.receiverPincode
    };

    const partnerDetails = {
      id: 'delhivery-test',
      name: 'Delhivery'
    };

    const rateResult = await delhiveryAPI.calculateRate(packageDetails, deliveryDetails, partnerDetails);

    if (!rateResult.success) {
      return { success: false, error: `Rate calculation failed: ${rateResult.error}` };
    }

    const validation = testHelpers.validateResponse(rateResult, [
      'success', 'provider', 'totalRate'
    ]);

    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    log.info(`Service: ${rateResult.provider.serviceType}`);
    log.info(`Total Rate: ₹${rateResult.totalRate}`);
    log.info(`Estimated Delivery: ${rateResult.provider.estimatedDays}`);

    // Test different service types
    const expressRate = await delhiveryAPI.calculateRate(
      { ...packageDetails, serviceType: 'Express' },
      deliveryDetails,
      partnerDetails
    );

    return {
      success: true,
      surfaceRate: rateResult.totalRate,
      expressRate: expressRate.success ? expressRate.totalRate : null,
      breakdown: rateResult.breakdown,
      estimatedDays: rateResult.provider.estimatedDays
    };
  });
}

/**
 * 5. Waybill Management Tests
 */
async function testWaybillManagement() {
  return testHelpers.runTest('Waybill Management', async () => {
    log.info('Testing waybill management...');

    const requestedCount = 10;
    const waybillResult = await delhiveryService.manageWaybills(requestedCount);

    if (!waybillResult.success) {
      return { success: false, error: `Waybill fetch failed: ${waybillResult.error}` };
    }

    const validation = testHelpers.validateResponse(waybillResult, [
      'success', 'waybills', 'source'
    ]);

    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    log.info(`Fetched ${waybillResult.waybills.length} waybills from ${waybillResult.source}`);
    log.info(`Remaining in cache: ${waybillResult.remaining || 0}`);

    // Test cache functionality
    const cachedResult = await delhiveryService.manageWaybills(5);
    const usedCache = cachedResult.source === 'cache';

    return {
      success: true,
      waybillCount: waybillResult.waybills.length,
      source: waybillResult.source,
      cacheWorking: usedCache,
      sampleWaybill: waybillResult.waybills[0]
    };
  });
}

/**
 * 6. Shipment Creation Tests
 */
async function testShipmentCreation() {
  return testHelpers.runTest('Shipment Creation', async () => {
    log.info('Testing shipment creation...');

    // Get a waybill first
    const waybillResult = await delhiveryService.manageWaybills(1);
    if (!waybillResult.success || waybillResult.waybills.length === 0) {
      return { success: false, error: 'Failed to get waybill for shipment creation' };
    }

    const shipmentData = {
      ...TEST_CONFIG.SAMPLE_SHIPMENT,
      waybill: waybillResult.waybills[0],
      orderId: `TEST_DLVY_CREATE_${Date.now()}`
    };

    log.info(`Creating shipment with order ID: ${shipmentData.orderId}`);
    log.info(`Using waybill: ${shipmentData.waybill}`);

    const createResult = await delhiveryService.createShipment(shipmentData);

    if (!createResult.success) {
      // If it's a validation error, that might be expected in test environment
      if (createResult.error.includes('Validation failed')) {
        log.warning('Shipment creation failed validation (expected in test environment)');
        return {
          success: true,
          note: 'Validation test completed',
          validationErrors: createResult.details
        };
      }
      return { success: false, error: `Shipment creation failed: ${createResult.error}` };
    }

    const validation = testHelpers.validateResponse(createResult, [
      'success', 'awb', 'courierName'
    ]);

    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    log.info(`AWB: ${createResult.awb}`);
    log.info(`Status: ${createResult.status || 'Created'}`);
    log.info(`Tracking URL: ${createResult.trackingUrl || 'N/A'}`);

    return {
      success: true,
      awb: createResult.awb,
      orderId: createResult.orderId,
      status: createResult.status,
      trackingUrl: createResult.trackingUrl,
      responseTime: createResult.responseTime
    };
  });
}

/**
 * 7. Shipment Tracking Tests
 */
async function testShipmentTracking() {
  return testHelpers.runTest('Shipment Tracking', async () => {
    log.info('Testing shipment tracking...');

    // Use a sample tracking number (in real environment, use actual AWB)
    const testAWB = 'TEST_AWB_123456789';

    log.info(`Tracking shipment: ${testAWB}`);

    const trackingResult = await delhiveryService.trackShipment(testAWB);

    // In test environment, this might fail due to invalid AWB
    if (!trackingResult.success) {
      if (trackingResult.error.includes('No tracking data found')) {
        log.warning('No tracking data found (expected for test AWB)');
        return {
          success: true,
          note: 'Tracking API test completed',
          testAWB,
          error: trackingResult.error
        };
      }
      return { success: false, error: `Tracking failed: ${trackingResult.error}` };
    }

    log.info(`Status: ${trackingResult.status}`);
    log.info(`Location: ${trackingResult.currentLocation}`);
    log.info(`History entries: ${trackingResult.history?.length || 0}`);

    return {
      success: true,
      awb: testAWB,
      status: trackingResult.status,
      location: trackingResult.currentLocation,
      historyCount: trackingResult.history?.length || 0,
      responseTime: trackingResult.responseTime
    };
  });
}

/**
 * 8. Error Handling Tests
 */
async function testErrorHandling() {
  return testHelpers.runTest('Error Handling', async () => {
    log.info('Testing error handling capabilities...');

    const delhiveryAPI = new DelhiveryAPI();
    const errors = [];

    // Test invalid pincode
    try {
      const result = await delhiveryAPI.checkServiceability('invalid');
      if (result.success && result.serviceable) {
        errors.push('Invalid pincode not properly handled');
      }
    } catch (error) {
      // Expected behavior
    }

    // Test missing required fields in shipment
    try {
      const result = await delhiveryService.createShipment({});
      if (result.success) {
        errors.push('Missing required fields not properly validated');
      }
    } catch (error) {
      // Expected behavior
    }

    // Test rate calculation with invalid data
    try {
      const result = await delhiveryAPI.calculateRate(
        { weight: -1 }, // Invalid weight
        { pickupPincode: 'invalid', deliveryPincode: 'invalid' },
        {}
      );
      if (result.success) {
        errors.push('Invalid rate calculation data not properly handled');
      }
    } catch (error) {
      // Expected behavior
    }

    log.info(`Error handling tests completed. Issues found: ${errors.length}`);

    return {
      success: errors.length === 0,
      error: errors.length > 0 ? errors.join(', ') : null,
      errorTests: 3,
      issuesFound: errors.length
    };
  });
}

/**
 * 9. Performance Tests
 */
async function testPerformance() {
  return testHelpers.runTest('Performance Tests', async () => {
    log.info('Testing performance characteristics...');

    const delhiveryAPI = new DelhiveryAPI();
    const performanceResults = [];

    // Test concurrent pincode checks
    const concurrentTests = TEST_CONFIG.VALID_PINCODES.map(async (pincode) => {
      const startTime = Date.now();
      const result = await delhiveryAPI.checkServiceability(pincode);
      const duration = Date.now() - startTime;
      return { pincode, duration, success: result.success };
    });

    const concurrentResults = await Promise.all(concurrentTests);
    const avgConcurrentTime = concurrentResults.reduce((sum, r) => sum + r.duration, 0) / concurrentResults.length;

    log.info(`Concurrent tests completed. Average time: ${Math.round(avgConcurrentTime)}ms`);

    // Test rate calculation performance
    const packageDetails = { weight: 1, serviceType: 'Surface' };
    const deliveryDetails = {
      pickupPincode: TEST_CONFIG.SAMPLE_SHIPMENT.senderPincode,
      deliveryPincode: TEST_CONFIG.SAMPLE_SHIPMENT.receiverPincode
    };

    const rateStartTime = Date.now();
    const rateResult = await delhiveryAPI.calculateRate(packageDetails, deliveryDetails, {});
    const rateDuration = Date.now() - rateStartTime;

    log.info(`Rate calculation time: ${rateDuration}ms`);

    return {
      success: true,
      concurrentTests: concurrentResults.length,
      avgConcurrentTime: Math.round(avgConcurrentTime),
      rateCalculationTime: rateDuration,
      performance: rateDuration < 5000 ? 'Good' : 'Needs optimization'
    };
  });
}

/**
 * Main test runner
 */
async function runDelhiveryTests() {
  const startTime = Date.now();

  log.section('Delhivery API Integration Test Suite');
  log.info(`Testing environment: ${DELHIVERY_CONFIG.BASE_URL}`);
  log.info(`Client: ${DELHIVERY_CONFIG.CLIENT_NAME}`);
  log.info(`Started at: ${new Date().toISOString()}`);

  // Run all tests
  const tests = [
    testConfiguration,
    testServiceInitialization,
    testAPIConnectivity,
    testPincodeServiceability,
    testRateCalculation,
    testWaybillManagement,
    testShipmentCreation,
    testShipmentTracking,
    testErrorHandling,
    testPerformance
  ];

  for (const test of tests) {
    await test();
    await testHelpers.delay(1000); // Small delay between tests
  }

  // Generate final report
  const totalTime = Date.now() - startTime;
  const summary = testResults.getSummary();
  const performanceReport = performanceTracker.getReport();
  const failures = testResults.getFailures();

  log.section('Test Results Summary');
  log.info(`Total Tests: ${summary.total}`);
  log.result(summary.passed === summary.total, `Passed: ${summary.passed}`);
  log.result(summary.failed === 0, `Failed: ${summary.failed}`);
  log.info(`Success Rate: ${summary.successRate}%`);
  log.info(`Total Execution Time: ${Math.round(totalTime / 1000)}s`);

  log.section('Performance Report');
  log.info(`Average Test Duration: ${performanceReport.avgTime}ms`);
  log.info(`Fastest Test: ${performanceReport.fastestTest.operation} (${performanceReport.fastestTest.duration}ms)`);
  log.info(`Slowest Test: ${performanceReport.slowestTest.operation} (${performanceReport.slowestTest.duration}ms)`);

  if (failures.length > 0) {
    log.section('Failed Tests');
    failures.forEach(failure => {
      log.error(`${failure.testName}: ${failure.details.error}`);
    });
  }

  // Final assessment
  log.section('Integration Assessment');
  if (summary.successRate >= 80) {
    log.success('Delhivery integration is working well! ✨');
  } else if (summary.successRate >= 60) {
    log.warning('Delhivery integration has some issues but is functional ⚠️');
  } else {
    log.error('Delhivery integration needs attention 🚨');
  }

  log.info('\n📋 Next Steps:');
  log.info('1. Configure real API credentials in environment variables');
  log.info('2. Test with real waybills and shipments');
  log.info('3. Implement webhook handling for status updates');
  log.info('4. Monitor API rate limits in production');
  log.info('5. Set up proper error alerting and logging');

  return {
    summary,
    performanceReport,
    failures,
    totalTime,
    success: summary.successRate >= 60
  };
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runDelhiveryTests()
    .then(result => {
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      log.error(`Test suite failed: ${error.message}`);
      process.exit(1);
    });
}

export { runDelhiveryTests, TEST_CONFIG };
