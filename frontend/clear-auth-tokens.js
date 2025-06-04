// Quick script to clear all authentication tokens
console.log('🧹 Clearing all authentication tokens...');

// Clear localStorage items
localStorage.removeItem('seller_token');
localStorage.removeItem('current_seller_data');

// Clear all possible auth keys from localStorage (they're encrypted)
const authKeys = [
  'auth_token',
  'refresh_token', 
  'user_type',
  'user_permissions',
  'user_context'
];

authKeys.forEach(key => {
  localStorage.removeItem(key);
  console.log(`✅ Cleared: ${key}`);
});

// Clear all localStorage to be thorough
localStorage.clear();

console.log('✅ All authentication data cleared!');
console.log('👉 Please refresh the page and log in again.');
console.log('');
console.log('To run this script:');
console.log('1. Copy this entire script');  
console.log('2. Paste it in your browser console (F12 → Console)');
console.log('3. Press Enter'); 