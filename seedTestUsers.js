const axios = require('axios');

const users = [
  {
    endpoint: 'http://localhost:8000/api/customer/auth/register',
    data: {
      name: 'Test Customer',
      email: 'customer@test.com',
      phone: '9000000001',
      password: 'Test@1234',
      confirmPassword: 'Test@1234',
      acceptTerms: true,
      address1: '123 Test Street',
      address2: 'Test Apartment',
      city: 'Test City',
      state: 'Test State',
      pincode: '123456'
    }
  },
  {
    endpoint: 'http://localhost:8000/api/seller/auth/register',
    data: {
      name: 'Test Seller',
      email: 'seller@test.com',
      phone: '9000000002',
      password: 'Test@1234',
      confirmPassword: 'Test@1234',
      businessName: 'Test Seller Business',
      acceptTerms: true
      // Add other required seller fields if needed
    }
  },
  {
    endpoint: 'http://localhost:8000/api/v2/admin/auth/register',
    data: {
      fullName: 'Test Admin',
      email: 'admin@test.com',
      password: 'Test@1234',
      confirmPassword: 'Test@1234',
      department: 'IT',
      role: 'Admin',
      phoneNumber: '9000000003'
      // Add other required admin fields if needed
    }
  }
];

async function registerUser(user) {
  try {
    const res = await axios.post(user.endpoint, user.data);
    console.log(`Registered at ${user.endpoint}:`, res.data);
  } catch (err) {
    if (err.response) {
      console.error(`Error registering at ${user.endpoint}:`, err.response.data);
    } else {
      console.error(`Error registering at ${user.endpoint}:`, err.message);
    }
  }
}

async function main() {
  for (const user of users) {
    await registerUser(user);
  }
}

main(); 