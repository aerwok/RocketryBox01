import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const testPartnersAPI = async () => {
  try {
    console.log('Testing partners API endpoint...');
    
    // First, login to get a token
    const loginResponse = await axios.post('http://localhost:8000/api/v2/admin/auth/login', {
      email: 'superadmin01@rocketrybox.com',
      password: 'Admin@123'
    });
    
    if (!loginResponse.data.success) {
      console.error('Login failed:', loginResponse.data);
      return;
    }
    
    const token = loginResponse.data.data.token;
    console.log('Login successful, token received');
    
    // Now test the partners API
    const partnersResponse = await axios.get('http://localhost:8000/api/v2/admin/partners', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Partners API Response:');
    console.log('Status:', partnersResponse.status);
    console.log('Success:', partnersResponse.data.success);
    console.log('Count:', partnersResponse.data.count);
    console.log('Total:', partnersResponse.data.total);
    
    if (partnersResponse.data.data && partnersResponse.data.data.length > 0) {
      console.log('\nPartners found:');
      partnersResponse.data.data.forEach((partner, index) => {
        console.log(`${index + 1}. ${partner.name} (${partner.apiStatus}) - ID: ${partner._id}`);
      });
    } else {
      console.log('No partners returned from API');
    }
    
  } catch (error) {
    console.error('Error testing partners API:', error.response?.data || error.message);
  }
};

// Run the script
testPartnersAPI(); 