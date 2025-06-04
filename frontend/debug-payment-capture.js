// Payment Debug Capture Tool
// Run this in browser console before making a payment to capture debug data

console.log('🔧 Payment Debug Capture Tool');
console.log('==============================');

// Store original Razorpay constructor
const OriginalRazorpay = window.Razorpay;

// Enhanced debugging wrapper for Razorpay
window.Razorpay = function(options) {
    console.log('🚀 Razorpay Payment Initiated');
    console.log('Payment Options:', options);
    
    // Store original handlers
    const originalHandler = options.handler;
    const originalOnDismiss = options.modal?.ondismiss;
    
    // Wrap success handler with debugging
    options.handler = function(response) {
        console.log('✅ Payment Success Response:', response);
        console.log('📊 Response Analysis:', {
            payment_id: response.razorpay_payment_id,
            order_id: response.razorpay_order_id,
            signature: response.razorpay_signature,
            signature_length: response.razorpay_signature?.length,
            payment_id_prefix: response.razorpay_payment_id?.substring(0, 8),
            order_id_prefix: response.razorpay_order_id?.substring(0, 10)
        });
        
        // Store for later debugging
        window.lastPaymentResponse = response;
        
        // Test verification locally
        console.log('🧪 Testing verification data format...');
        const verificationData = {
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_signature: response.razorpay_signature,
            amount: options.amount / 100 // Convert back from paise
        };
        
        console.log('📤 Verification data to be sent:', verificationData);
        window.lastVerificationData = verificationData;
        
        // Call original handler
        if (originalHandler) {
            originalHandler(response);
        }
    };
    
    // Wrap dismiss handler with debugging
    if (options.modal) {
        options.modal.ondismiss = function() {
            console.log('❌ Payment Modal Dismissed');
            if (originalOnDismiss) {
                originalOnDismiss();
            }
        };
    }
    
    // Create original Razorpay instance
    return new OriginalRazorpay(options);
};

// Debug tools
window.debugPaymentData = {
    // Show last payment response
    showLastPayment: () => {
        if (window.lastPaymentResponse) {
            console.log('📋 Last Payment Response:', window.lastPaymentResponse);
            console.log('📋 Last Verification Data:', window.lastVerificationData);
        } else {
            console.log('⚠️ No payment data captured yet');
        }
    },
    
    // Test verification endpoint manually
    testVerification: async (customData = null) => {
        const data = customData || window.lastVerificationData;
        if (!data) {
            console.error('❌ No verification data available');
            return;
        }
        
        try {
            console.log('🧪 Testing verification endpoint...');
            const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
            
            const response = await fetch('/api/v2/seller/wallet/recharge/verify', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            
            console.log('📡 Verification Response Status:', response.status);
            
            const result = await response.json();
            console.log('📡 Verification Response:', result);
            
            return result;
        } catch (error) {
            console.error('❌ Verification test failed:', error);
        }
    },
    
    // Simulate payment response for testing
    simulatePayment: () => {
        const mockResponse = {
            razorpay_payment_id: 'pay_test_' + Date.now(),
            razorpay_order_id: 'order_test_' + Date.now(),
            razorpay_signature: 'mock_signature_' + Date.now()
        };
        
        console.log('🎭 Simulating payment response:', mockResponse);
        window.lastPaymentResponse = mockResponse;
        window.lastVerificationData = {
            ...mockResponse,
            amount: 100 // ₹100 test amount
        };
        
        return mockResponse;
    },
    
    // Clear captured data
    clear: () => {
        delete window.lastPaymentResponse;
        delete window.lastVerificationData;
        console.log('🧹 Payment debug data cleared');
    }
};

// Monitor fetch requests to verification endpoint
const originalFetch = window.fetch;
window.fetch = function(...args) {
    const [url, options] = args;
    
    if (typeof url === 'string' && url.includes('/wallet/recharge/verify')) {
        console.log('🔍 Intercepted verification request:', {
            url: url,
            method: options?.method,
            body: options?.body
        });
        
        // Parse and log the verification data
        if (options?.body) {
            try {
                const data = JSON.parse(options.body);
                console.log('📤 Verification request data:', data);
            } catch (e) {
                console.log('📤 Verification request body (raw):', options.body);
            }
        }
        
        // Return promise that logs response
        return originalFetch.apply(this, args).then(response => {
            console.log('📥 Verification response status:', response.status);
            
            // Clone response to read body without consuming it
            const clonedResponse = response.clone();
            clonedResponse.json().then(data => {
                console.log('📥 Verification response body:', data);
            }).catch(e => {
                console.log('📥 Failed to parse verification response:', e);
            });
            
            return response;
        }).catch(error => {
            console.error('📥 Verification request failed:', error);
            throw error;
        });
    }
    
    return originalFetch.apply(this, args);
};

console.log('\n🛠️ Debug tools available:');
console.log('- debugPaymentData.showLastPayment() - Show captured payment data');
console.log('- debugPaymentData.testVerification() - Test verification endpoint');
console.log('- debugPaymentData.simulatePayment() - Create mock payment data');
console.log('- debugPaymentData.clear() - Clear captured data');

console.log('\n✅ Payment capture tool is active!');
console.log('🎯 Make a payment to capture debug data automatically.');

// Auto-enable on wallet pages
if (window.location.pathname.includes('wallet') || window.location.pathname.includes('seller')) {
    console.log('🎯 Payment debugging is now active on this page');
} 