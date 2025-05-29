import axios from 'axios';

const API_URL = 'http://localhost:8000/api/v2/customer';

// Test order creation
async function testOrderCreation() {
  try {
    // First, let's get the auth token (you'll need to replace this with a valid token)
    const token = 'YOUR_AUTH_TOKEN_HERE'; // Replace with actual token
    
    const orderData = {
      pickupAddress: {
        name: "Test Sender",
        phone: "9876543210",
        address1: "123 Test Street",
        address2: "",
        city: "Mumbai",
        state: "Maharashtra",
        pincode: "400001",
        country: "India"
      },
      deliveryAddress: {
        name: "Test Receiver",
        phone: "9876543211",
        address1: "456 Test Avenue",
        address2: "",
        city: "Delhi",
        state: "Delhi",
        pincode: "110001",
        country: "India"
      },
      package: {
        weight: 0.5,
        dimensions: {
          length: 10,
          width: 10,
          height: 10
        },
        items: [{
          name: "Test Item",
          quantity: 1,
          value: 100
        }]
      },
      serviceType: "standard",
      paymentMethod: "online",
      pickupDate: new Date().toISOString()
    };

    console.log('Sending order data:', JSON.stringify(orderData, null, 2));

    const response = await axios.post(`${API_URL}/orders`, orderData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Order created successfully:', response.data);
  } catch (error) {
    console.error('Error creating order:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
      console.error('Headers:', error.response.headers);
    } else {
      console.error('Error:', error.message);
    }
  }
}

// Run the test
testOrderCreation(); 