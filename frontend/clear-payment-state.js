// Clear all payment-related states and debugging utility
// Run this in the browser console to reset payment states

console.log('🔧 Payment State Debugger & Cleaner');
console.log('=====================================');

// Check current payment states
console.log('\n📊 Current Payment States:');
console.log('walletRechargeInProgress:', window.walletRechargeInProgress);
console.log('razorpayModalOpen:', window.razorpayModalOpen);

// Clear all payment state flags
window.walletRechargeInProgress = false;
window.razorpayModalOpen = false;

console.log('\n🧹 Cleared payment state flags');

// Clear all wallet-related cache
const walletCacheKeys = [];
for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.includes('wallet') || key.includes('balance') || key.includes('transaction'))) {
        walletCacheKeys.push(key);
    }
}

walletCacheKeys.forEach(key => {
    localStorage.removeItem(key);
    console.log(`🗑️ Removed cache: ${key}`);
});

// Clear sessionStorage wallet data
const sessionKeys = [];
for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    if (key && (key.includes('wallet') || key.includes('balance') || key.includes('transaction'))) {
        sessionKeys.push(key);
    }
}

sessionKeys.forEach(key => {
    sessionStorage.removeItem(key);
    console.log(`🗑️ Removed session: ${key}`);
});

// Add debugging helpers
window.debugPayment = {
    // Check current state
    checkState: () => {
        console.log('Payment States:');
        console.log('- walletRechargeInProgress:', window.walletRechargeInProgress);
        console.log('- razorpayModalOpen:', window.razorpayModalOpen);
    },
    
    // Clear all states
    clearStates: () => {
        window.walletRechargeInProgress = false;
        window.razorpayModalOpen = false;
        console.log('✅ Payment states cleared');
    },
    
    // Test wallet API
    testWalletAPI: async () => {
        try {
            const response = await fetch('/api/v2/seller/wallet/balance', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token') || sessionStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            });
            const data = await response.json();
            console.log('Wallet API Response:', data);
        } catch (error) {
            console.error('Wallet API Error:', error);
        }
    }
};

console.log('\n🛠️ Debugging tools added to window.debugPayment:');
console.log('- debugPayment.checkState() - Check payment states');
console.log('- debugPayment.clearStates() - Clear payment states');
console.log('- debugPayment.testWalletAPI() - Test wallet balance API');

console.log('\n✅ Payment state cleanup completed!');
console.log('🔄 Refreshing page to apply changes...');

// Refresh the page
setTimeout(() => {
    window.location.reload();
}, 1000); 