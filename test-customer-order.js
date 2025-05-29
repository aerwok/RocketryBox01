import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: './backend/.env' });

const BASE_URL = 'http://localhost:8000';

// Test customer credentials (using timestamp to make it unique)
const timestamp = Date.now().toString().slice(-4);
const testCustomer = {
  email: `testcustomer${timestamp}@example.com`,
  password: 'Test@123',
  confirmPassword: 'Test@123',
  name: 'Test Customer',
  mobile: `987654${timestamp}`,
  acceptTerms: true
};

// Test order data
const testOrderData = {
  pickupAddress: {
    name: 'John Sender',
    phone: '9876543210',
    email: 'sender@example.com',
    address1: '123 Pickup Street',
    address2: 'Near Pickup Mall',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400001',
    country: 'India'
  },
  deliveryAddress: {
    name: 'Jane Receiver',
    phone: '9876543211',
    email: 'receiver@example.com',
    address1: '456 Delivery Avenue',
    address2: 'Opposite Delivery Park',
    city: 'Delhi',
    state: 'Delhi',
    pincode: '110001',
    country: 'India'
  },
  package: {
    weight: 1.5,
    dimensions: {
      length: 20,
      width: 15,
      height: 10
    },
    declaredValue: 1000,
    items: [
      {
        name: 'Test Product',
        quantity: 1,
        value: 1000
      }
    ]
  },
  serviceType: 'standard',
  paymentMethod: 'online',
  instructions: 'Handle with care',
  pickupDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // Tomorrow
};

let authToken = null;

// Helper function to make API requests
async function makeRequest(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...(authToken && { 'Authorization': `Bearer ${authToken}` })
    }
  };

  const response = await fetch(url, { ...defaultOptions, ...options });
  const data = await response.json();

  console.log(`\n📡 ${options.method || 'GET'} ${endpoint}`);
  console.log(`Status: ${response.status} ${response.statusText}`);
  
  if (!response.ok) {
    console.log('❌ Error Response:', JSON.stringify(data, null, 2));
    throw new Error(`API Error: ${response.status} - ${data.message || 'Unknown error'}`);
  }

  console.log('✅ Success Response:', JSON.stringify(data, null, 2));
  return data;
}

// Test functions
async function registerCustomer() {
  console.log('\n🔐 Testing Customer Registration...');
  console.log('📧 Email:', testCustomer.email);
  console.log('📱 Mobile:', testCustomer.mobile);
  
  try {
    const response = await makeRequest('/api/v2/customer/auth/register', {
      method: 'POST',
      body: JSON.stringify(testCustomer)
    });
    console.log('✅ Customer registration successful');
    return response;
  } catch (error) {
    if (error.message.includes('already registered') || error.message.includes('already exists')) {
      console.log('ℹ️ Customer already exists, proceeding to login');
      return null;
    }
    throw error;
  }
}

async function loginCustomer() {
  console.log('\n🔑 Testing Customer Login...');
  const response = await makeRequest('/api/v2/customer/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      phoneOrEmail: testCustomer.email,
      password: testCustomer.password
    })
  });

  if (response.success && (response.data.token || response.data.accessToken)) {
    authToken = response.data.token || response.data.accessToken;
    console.log('✅ Customer login successful');
    console.log('🎫 Auth token obtained');
    return response;
  } else {
    throw new Error('Login failed - no token received');
  }
}

async function testRateCalculation() {
  console.log('\n💰 Testing Rate Calculation...');
  const rateData = {
    weight: testOrderData.package.weight,
    pickupPincode: testOrderData.pickupAddress.pincode,
    deliveryPincode: testOrderData.deliveryAddress.pincode,
    serviceType: testOrderData.serviceType
  };

  const response = await makeRequest('/api/v2/customer/orders/rates', {
    method: 'POST',
    body: JSON.stringify(rateData)
  });

  console.log('✅ Rate calculation successful');
  return response;
}

async function createOrder() {
  console.log('\n📦 Testing Order Creation...');
  const response = await makeRequest('/api/v2/customer/orders', {
    method: 'POST',
    body: JSON.stringify(testOrderData)
  });

  console.log('✅ Order creation successful');
  return response;
}

async function getOrderHistory() {
  console.log('\n📋 Testing Order History...');
  const response = await makeRequest('/api/v2/customer/orders');
  console.log('✅ Order history retrieved successfully');
  return response;
}

async function getOrderById(orderId) {
  console.log(`\n🔍 Testing Get Order by ID: ${orderId}...`);
  const response = await makeRequest(`/api/v2/customer/orders/${orderId}`);
  console.log('✅ Order details retrieved successfully');
  return response;
}

// Main test function
async function runTests() {
  console.log('🚀 Starting Customer Order Creation Tests...');
  console.log('=' .repeat(60));

  try {
    // Step 1: Register customer (if needed)
    const registrationResponse = await registerCustomer();
    
    // If registration was successful, use the token from registration
    if (registrationResponse && registrationResponse.data.accessToken) {
      authToken = registrationResponse.data.accessToken;
      console.log('🎫 Using token from registration');
    } else {
      // Step 2: Login customer if registration didn't provide token
      await loginCustomer();
    }

    // Step 3: Test rate calculation
    await testRateCalculation();

    // Step 4: Create order
    const orderResponse = await createOrder();
    const orderId = orderResponse.data.order.id;

    // Step 5: Get order history
    await getOrderHistory();

    // Step 6: Get specific order details
    if (orderId) {
      await getOrderById(orderId);
    }

    console.log('\n🎉 All tests completed successfully!');
    console.log('=' .repeat(60));

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Additional utility functions for debugging
async function checkAuthStatus() {
  console.log('\n🔍 Checking Auth Status...');
  try {
    const response = await makeRequest('/api/v2/customer/auth/check');
    console.log('✅ Auth status check successful');
    return response;
  } catch (error) {
    console.log('❌ Auth status check failed:', error.message);
    return null;
  }
}

async function testCustomerProfile() {
  console.log('\n👤 Testing Customer Profile...');
  try {
    const response = await makeRequest('/api/v2/customer/profile');
    console.log('✅ Profile retrieval successful');
    return response;
  } catch (error) {
    console.log('❌ Profile retrieval failed:', error.message);
    return null;
  }
}

// Extended test function with more comprehensive checks
async function runExtendedTests() {
  console.log('🚀 Starting Extended Customer Order Tests...');
  console.log('=' .repeat(60));

  try {
    // Basic tests
    await runTests();

    // Additional tests
    await checkAuthStatus();
    await testCustomerProfile();

    console.log('\n🎉 All extended tests completed successfully!');
    console.log('=' .repeat(60));

  } catch (error) {
    console.error('\n❌ Extended test failed:', error.message);
    process.exit(1);
  }
}

// Export functions for individual testing
export {
  registerCustomer,
  loginCustomer,
  testRateCalculation,
  createOrder,
  getOrderHistory,
  getOrderById,
  checkAuthStatus,
  testCustomerProfile,
  runTests,
  runExtendedTests
};

// Run tests if this file is executed directly
console.log('🔧 Test script starting...');
console.log('Arguments:', process.argv);

const testType = process.argv[2] || 'basic';
console.log('Test type:', testType);

if (testType === 'extended') {
  runExtendedTests().catch(console.error);
} else {
  runTests().catch(console.error);
} 