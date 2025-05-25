// Debug script to test partners API call
// Run this in the browser console

async function debugPartnersAPI() {
  try {
    console.log('🔍 Debugging Partners API...');
    
    // Check if we have a token
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    console.log('Token found:', !!token);
    
    if (!token) {
      console.error('❌ No auth token found in localStorage or sessionStorage');
      return;
    }
    
    // Test the API call
    const response = await fetch('http://localhost:8000/api/v2/admin/partners', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API Response:', data);
      console.log('Partners count:', data.count);
      console.log('Partners data:', data.data);
    } else {
      const errorText = await response.text();
      console.error('❌ API Error:', errorText);
    }
    
  } catch (error) {
    console.error('❌ Network Error:', error);
  }
}

// Run the debug function
debugPartnersAPI(); 