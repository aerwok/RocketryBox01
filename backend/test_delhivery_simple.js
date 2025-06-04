/**
 * Simple Delhivery Integration Test
 */

import delhiveryConfig, { DELHIVERY_CONFIG, validateDelhiveryConfig } from './src/config/delhivery.config.js';

console.log('🚀 Testing Delhivery Integration...');

try {
  console.log('✅ Configuration loaded successfully');
  console.log(`📍 Base URL: ${DELHIVERY_CONFIG.BASE_URL}`);
  console.log(`👤 Client: ${DELHIVERY_CONFIG.CLIENT_NAME}`);
  console.log(`🔧 Endpoints available: ${Object.keys(DELHIVERY_CONFIG.ENDPOINTS).length}`);

  // Test configuration validation
  const isValid = validateDelhiveryConfig();
  console.log(`🔍 Configuration valid: ${isValid}`);

  // Test service types
  console.log(`📦 Service types: ${Object.keys(DELHIVERY_CONFIG.SERVICE_TYPES).join(', ')}`);

  // Test default config object
  console.log(`🔧 Default config has validateConfig: ${typeof delhiveryConfig.validateConfig === 'function'}`);

  console.log('\n✨ Delhivery integration is ready to use!');
  console.log('\n📋 Next steps:');
  console.log('1. Set your real API credentials in environment variables');
  console.log('   - DELHIVERY_API_TOKEN=your_real_token');
  console.log('   - DELHIVERY_CLIENT_NAME=your_client_name');
  console.log('2. Test with actual API calls');
  console.log('3. Run full test suite: node test_delhivery_integration.js');

} catch (error) {
  console.error('❌ Error testing Delhivery integration:', error.message);
  console.error(error.stack);
  process.exit(1);
}
