// Debug wallet API responses directly in the browser
// Run this in the browser console to test the API

console.log('🔧 Wallet API Debugger');
console.log('=====================');

// Function to test wallet API directly
window.debugWalletAPI = async () => {
    try {
        console.log('🚀 Testing wallet API...');
        
        // Get auth token
        const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
        
        if (!token) {
            console.error('❌ No auth token found');
            return;
        }
        
        console.log('🔑 Auth token found');
        
        // Test wallet balance API
        console.log('\n📊 Testing wallet balance...');
        const balanceResponse = await fetch('/api/v2/seller/wallet/balance', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        const balanceData = await balanceResponse.json();
        console.log('Balance API Response:', balanceData);
        
        // Test wallet history API
        console.log('\n📋 Testing wallet history...');
        const historyResponse = await fetch('/api/v2/seller/wallet/history?page=1&limit=10', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('History Response Status:', historyResponse.status);
        console.log('History Response Headers:', historyResponse.headers);
        
        const historyData = await historyResponse.json();
        console.log('History API Raw Response:', historyData);
        console.log('History Response Type:', typeof historyData);
        console.log('History Data is Array:', Array.isArray(historyData));
        
        if (historyData && typeof historyData === 'object') {
            console.log('History Data Properties:', Object.keys(historyData));
            console.log('Has success property:', 'success' in historyData);
            console.log('Has data property:', 'data' in historyData);
            console.log('Has pagination property:', 'pagination' in historyData);
            
            if (historyData.data) {
                console.log('Data type:', typeof historyData.data);
                console.log('Data is array:', Array.isArray(historyData.data));
                console.log('Data length:', historyData.data.length);
            }
        }
        
        // Test with WalletService
        console.log('\n🛠️ Testing with WalletService...');
        if (window.walletService) {
            const serviceResponse = await window.walletService.getWalletHistory(1, 10);
            console.log('WalletService Response:', serviceResponse);
        } else {
            console.log('⚠️ WalletService not available in window');
        }
        
    } catch (error) {
        console.error('❌ Error testing wallet API:', error);
    }
};

// Test API response structure parsing
window.debugResponseStructure = (response) => {
    console.log('🔍 Analyzing response structure...');
    console.log('Response:', response);
    console.log('Type:', typeof response);
    console.log('Is Array:', Array.isArray(response));
    
    if (response && typeof response === 'object' && !Array.isArray(response)) {
        console.log('Properties:', Object.keys(response));
        
        Object.keys(response).forEach(key => {
            const value = response[key];
            console.log(`- ${key}:`, typeof value, Array.isArray(value) ? `(array of ${value.length})` : '');
        });
    }
};

console.log('\n🛠️ Debug tools available:');
console.log('- debugWalletAPI() - Test wallet APIs directly');
console.log('- debugResponseStructure(response) - Analyze response structure');

// Auto-run if we're on the wallet page
if (window.location.pathname.includes('wallet') || window.location.pathname.includes('seller')) {
    console.log('\n🎯 Auto-running wallet API test...');
    setTimeout(() => {
        window.debugWalletAPI();
    }, 1000);
} 