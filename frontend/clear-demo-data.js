// Simple script to clear all demo wallet data from browser storage
// Run this in the browser console to clear cached demo data

console.log('🧹 Clearing wallet demo data...');

// Clear localStorage
const localStorageKeys = [];
for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.includes('wallet') || key.includes('balance') || key.includes('transaction'))) {
        localStorageKeys.push(key);
    }
}

localStorageKeys.forEach(key => {
    localStorage.removeItem(key);
    console.log(`Removed: ${key}`);
});

// Clear sessionStorage
const sessionStorageKeys = [];
for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    if (key && (key.includes('wallet') || key.includes('balance') || key.includes('transaction'))) {
        sessionStorageKeys.push(key);
    }
}

sessionStorageKeys.forEach(key => {
    sessionStorage.removeItem(key);
    console.log(`Removed: ${key}`);
});

// Clear all storage if needed
// localStorage.clear();
// sessionStorage.clear();

console.log('✅ Demo data clearing complete. Refreshing page...');

// Refresh the page to load fresh data
window.location.reload(); 