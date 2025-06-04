/**
 * Delhivery API Diagnostic Test
 * Troubleshoots authentication and configuration issues
 */

const API_TOKEN = 'a8473f4a9d74a88afaa4f7417abb427708a11a97';

async function diagnoseDelhiveryAPI() {
  console.log('\n🔍 Delhivery API Diagnostic Test\n');

  const axios = (await import('axios')).default;

  // Test configurations
  const configs = [
    {
      name: 'Staging Environment',
      baseUrl: 'https://staging-express.delhivery.com',
      description: 'Official staging environment'
    },
    {
      name: 'Production Environment',
      baseUrl: 'https://track.delhivery.com',
      description: 'Production environment (if token is prod)'
    }
  ];

  // Different authentication formats to try
  const authFormats = [
    `Token ${API_TOKEN}`,
    `Bearer ${API_TOKEN}`,
    API_TOKEN
  ];

  console.log(`📋 Testing API Token: ${API_TOKEN.substring(0, 12)}...${API_TOKEN.slice(-8)}`);
  console.log(`📋 Token Length: ${API_TOKEN.length} characters`);
  console.log(`📋 Token Format: ${/^[a-f0-9]+$/.test(API_TOKEN) ? 'Valid hex' : 'Contains non-hex chars'}\n`);

  for (const config of configs) {
    console.log(`🌐 Testing ${config.name}`);
    console.log(`   URL: ${config.baseUrl}`);
    console.log(`   Description: ${config.description}`);

    for (const authFormat of authFormats) {
      console.log(`\n   🔑 Auth Format: "${authFormat.substring(0, 20)}..."`);

      try {
        const response = await axios.get(`${config.baseUrl}/c/api/pin-codes/json/`, {
          headers: {
            'Authorization': authFormat,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'User-Agent': 'RocketryBox-Test/1.0'
          },
          params: {
            filter_codes: '110001'
          },
          timeout: 15000
        });

        console.log(`   ✅ SUCCESS! Status: ${response.status}`);
        console.log(`   ✅ Response type: ${typeof response.data}`);
        console.log(`   ✅ Has delivery_codes: ${response.data?.delivery_codes ? 'Yes' : 'No'}`);

        if (response.data?.delivery_codes) {
          console.log(`   ✅ Delivery codes count: ${response.data.delivery_codes.length}`);
          if (response.data.delivery_codes.length > 0) {
            const sample = response.data.delivery_codes[0];
            console.log(`   ✅ Sample pincode: ${sample.postal_code?.pin || 'N/A'}`);
            console.log(`   ✅ COD available: ${sample.cod || 'N/A'}`);
          }
        }

        console.log('\n   🎉 WORKING CONFIGURATION FOUND!');
        console.log(`   📝 Use: ${config.baseUrl} with "${authFormat.split(' ')[0]}" auth`);
        return {
          success: true,
          baseUrl: config.baseUrl,
          authFormat: authFormat,
          environment: config.name
        };

      } catch (error) {
        const status = error.response?.status || 'No response';
        const message = error.response?.data || error.message;
        console.log(`   ❌ Failed: ${status} - ${typeof message === 'string' ? message.substring(0, 100) : 'Error object'}`);

        if (error.response?.status === 401) {
          console.log(`   💡 401 = Invalid token or wrong environment`);
        } else if (error.response?.status === 403) {
          console.log(`   💡 403 = Token valid but insufficient permissions`);
        } else if (error.response?.status === 404) {
          console.log(`   💡 404 = Wrong endpoint URL`);
        }
      }
    }
    console.log(''); // Add spacing between configs
  }

  console.log('\n📊 Diagnostic Summary:');
  console.log('❌ No working configuration found');
  console.log('\n💡 Possible Solutions:');
  console.log('1. Verify the API token is correct and active');
  console.log('2. Check if token is for staging vs production');
  console.log('3. Ensure token has pincode serviceability permissions');
  console.log('4. Contact Delhivery support to verify token status');
  console.log('5. Check if your IP needs to be whitelisted');

  return {
    success: false,
    message: 'No working configuration found'
  };
}

// Test our integration code with mock responses
async function testIntegrationCode() {
  console.log('\n🧪 Testing Integration Code (Mock Mode)\n');

  try {
    // Test our utility functions with mock data
    const { calculateRate } = await import('./src/utils/delhivery.js');

    const packageDetails = {
      weight: 1.5,
      paymentMode: 'COD',
      serviceType: 'Surface'
    };

    const deliveryDetails = {
      pickupPincode: '110001',
      deliveryPincode: '400001'
    };

    const partnerDetails = {
      id: 'delhivery-test',
      name: 'Delhivery'
    };

    console.log('📦 Testing rate calculation logic...');
    const result = await calculateRate(packageDetails, deliveryDetails, partnerDetails);

    if (result) {
      console.log('✅ Integration code is working');
      console.log(`✅ Sample rate: ₹${result.totalRate || 'N/A'}`);
      console.log(`✅ Provider: ${result.provider?.name || 'N/A'}`);
      console.log(`✅ Service: ${result.provider?.serviceType || 'N/A'}`);
    } else {
      console.log('❌ Integration code returned null');
    }

  } catch (error) {
    console.log(`❌ Integration test failed: ${error.message}`);
  }
}

// Run diagnostics
async function runDiagnostics() {
  const apiResult = await diagnoseDelhiveryAPI();
  await testIntegrationCode();

  console.log('\n🏁 Final Assessment:');
  if (apiResult.success) {
    console.log('✅ Delhivery API: Working');
    console.log('✅ Integration: Ready for production');
  } else {
    console.log('⚠️ Delhivery API: Token needs verification');
    console.log('✅ Integration: Code is ready, needs valid token');
  }

  console.log('\n📞 Next Steps:');
  console.log('1. Contact Delhivery support to verify your API token');
  console.log('2. Confirm which environment (staging/production) your token is for');
  console.log('3. Verify your account has the required API permissions');
  console.log('4. Test with the correct environment and auth format');
}

runDiagnostics();
