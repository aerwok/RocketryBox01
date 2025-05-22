// Script to create a test seller for RocketryBox
const axios = require('axios');

const registerSeller = async () => {
  try {
    // Create a timestamp to ensure unique email/phone
    const timestamp = Date.now();
    
    const testSeller = {
      name: "Test Seller",
      email: `testseller${timestamp}@example.com`,
      phone: `9${timestamp.toString().slice(-9)}`, // Generate a valid 10-digit phone number
      password: "password123",
      businessName: "Test Business Pvt Ltd",
      companyCategory: "E-commerce",
      brandName: "TestBrand",
      website: "https://testbusiness.com",
      supportContact: `9${timestamp.toString().slice(-9).split('').reverse().join('')}`,
      supportEmail: `support_${timestamp}@testbusiness.com`,
      operationsEmail: `operations_${timestamp}@testbusiness.com`,
      financeEmail: `finance_${timestamp}@testbusiness.com`,
      gstin: "27AADCB2230M1ZT" // Valid GSTIN format
    };

    console.log('Registering test seller:', testSeller);
    
    // First send OTP (simulated in dev environment)
    console.log('Simulating OTP verification...');
    
    // Send OTP request
    const otpResponse = await axios.post('http://localhost:8000/api/v2/seller/auth/otp/send', {
      emailOrPhone: testSeller.email,
      purpose: 'register'
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('OTP Response:', otpResponse.data);
    
    // In dev environment, the OTP should be in the response
    const otp = otpResponse.data.data.otp;
    
    if (!otp) {
      throw new Error('Failed to get OTP from response');
    }
    
    // Verify OTP
    await axios.post('http://localhost:8000/api/v2/seller/auth/otp/verify', {
      emailOrPhone: testSeller.email,
      otp,
      purpose: 'register'
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('OTP verified successfully');
    
    // Register seller
    const response = await axios.post('http://localhost:8000/api/v2/seller/auth/register', testSeller, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Test seller created successfully!');
    console.log('Access Token:', response.data.data.accessToken);
    console.log('Seller ID:', response.data.data.seller._id);
    
    // Return the credentials for easy reference
    return {
      email: testSeller.email,
      phone: testSeller.phone,
      password: testSeller.password,
      accessToken: response.data.data.accessToken,
      refreshToken: response.data.data.refreshToken,
      sellerId: response.data.data.seller._id
    };
  } catch (error) {
    console.error('Failed to create test seller:');
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Response data:', error.response.data);
      console.error('Status code:', error.response.status);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received from server. Is the server running?');
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error:', error.message);
    }
  }
};

// Run the registration
registerSeller().then(credentials => {
  if (credentials) {
    console.log('\nTest Seller Login Credentials:');
    console.log('-----------------------------');
    console.log(`Email: ${credentials.email}`);
    console.log(`Phone: ${credentials.phone}`);
    console.log(`Password: ${credentials.password}`);
    console.log(`Seller ID: ${credentials.sellerId}`);
    
    console.log('\nTo login from the frontend:');
    console.log('1. Go to /seller/login');
    console.log(`2. Enter ${credentials.email} or ${credentials.phone}`);
    console.log(`3. Enter ${credentials.password}`);
    
    console.log('\nTo use in development:');
    console.log('// Store these credentials in localStorage to simulate login');
    console.log(`localStorage.setItem('auth_token', '${credentials.accessToken}');`);
    console.log(`localStorage.setItem('refresh_token', '${credentials.refreshToken}');`);
    console.log(`// Redirect to seller dashboard`);
    console.log(`window.location.href = '/seller/dashboard';`);
  }
}); 