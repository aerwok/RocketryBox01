/**
 * Test script for shipping rate calculation API
 * This tests the fixed endpoint that was causing 404 errors
 */

const testShippingRates = async () => {
    const API_BASE = 'http://localhost:8000/api/v2';
    
    console.log('🚚 Testing Shipping Rate Calculation API...\n');
    
    // Test data for rate calculation
    const testData = {
        fromPincode: '110001', // Delhi
        toPincode: '400001',   // Mumbai
        weight: 1.5,
        length: 20,
        width: 15,
        height: 10,
        mode: 'Surface',
        orderType: 'cod',
        codCollectableAmount: 1000,
        includeRTO: false
    };
    
    try {
        console.log('📊 Test Data:', JSON.stringify(testData, null, 2));
        console.log('\n🔗 Testing endpoint: /shipping/ratecards/calculate');
        
        const response = await fetch(`${API_BASE}/shipping/ratecards/calculate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(testData)
        });
        
        console.log('📡 Response status:', response.status);
        console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ API Error:', errorText);
            return;
        }
        
        const result = await response.json();
        console.log('\n✅ API Response:', JSON.stringify(result, null, 2));
        
        if (result.success && result.data) {
            console.log('\n📋 Rate Calculation Summary:');
            console.log(`   Zone: ${result.data.zone}`);
            console.log(`   Billed Weight: ${result.data.billedWeight} kg`);
            console.log(`   Total Options: ${result.data.totalOptions || result.data.calculations?.length || 0}`);
            
            if (result.data.calculations && result.data.calculations.length > 0) {
                console.log('\n🏷️  Best Rate:');
                const bestRate = result.data.calculations[0];
                console.log(`   Courier: ${bestRate.courier}`);
                console.log(`   Mode: ${bestRate.mode}`);
                console.log(`   Total Cost: ₹${bestRate.total}`);
                console.log(`   Delivery: ${result.data.deliveryEstimate || 'N/A'}`);
            }
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error('Stack trace:', error.stack);
    }
};

// Test the legacy endpoint too
const testLegacyEndpoint = async () => {
    const API_BASE = 'http://localhost:8000/api/v2';
    
    console.log('\n\n🔄 Testing Legacy Endpoint...');
    console.log('🔗 Testing endpoint: /seller/rate-card/calculate');
    
    const testData = {
        fromPincode: '110001',
        toPincode: '400001',
        weight: 1.5,
        length: 20,
        width: 15,
        height: 10,
        mode: 'Surface',
        isCOD: true,
        declaredValue: 1000
    };
    
    try {
        const response = await fetch(`${API_BASE}/seller/rate-card/calculate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer dummy-token' // This might be needed for seller endpoints
            },
            body: JSON.stringify(testData)
        });
        
        console.log('📡 Response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.log('ℹ️  Legacy endpoint response:', errorText);
        } else {
            const result = await response.json();
            console.log('✅ Legacy endpoint working:', result.success);
        }
        
    } catch (error) {
        console.log('ℹ️  Legacy endpoint test:', error.message);
    }
};

// Run tests
const runTests = async () => {
    console.log('🚀 Starting Shipping Rate API Tests\n');
    console.log('=' .repeat(50));
    
    await testShippingRates();
    await testLegacyEndpoint();
    
    console.log('\n' + '='.repeat(50));
    console.log('🏁 Test completed!\n');
    
    console.log('💡 Next steps:');
    console.log('   1. Check the Create New Order page');
    console.log('   2. Try calculating shipping rates');
    console.log('   3. The 404 error should be resolved');
};

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    runTests().catch(console.error);
}

export { testShippingRates, testLegacyEndpoint, runTests }; 