// Debug utility to check seller authentication tokens
console.log('🔍 Seller Authentication Token Checker');
console.log('========================================');

// Function to decode JWT token (without verification)
function decodeJWT(token) {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) {
            return { error: 'Invalid JWT format' };
        }
        
        const header = JSON.parse(atob(parts[0]));
        const payload = JSON.parse(atob(parts[1]));
        
        return {
            header,
            payload,
            signature: parts[2]
        };
    } catch (error) {
        return { error: 'Failed to decode JWT: ' + error.message };
    }
}

// Function to check token expiration
function isTokenExpired(payload) {
    if (!payload.exp) return false;
    return Date.now() >= payload.exp * 1000;
}

// Function to check authentication tokens
window.checkSellerAuth = async () => {
    console.log('\n🚀 Starting Authentication Check...\n');
    
    try {
        // Import secureStorage dynamically
        const { secureStorage } = await import('./src/utils/secureStorage.js');
        
        // Check stored tokens
        console.log('📋 Checking Stored Tokens:');
        console.log('-------------------------');
        
        const authToken = await secureStorage.getItem('auth_token');
        const refreshToken = await secureStorage.getItem('refresh_token');
        const userType = await secureStorage.getItem('user_type');
        const userContext = await secureStorage.getItem('user_context');
        const userPermissions = await secureStorage.getItem('user_permissions');
        const sellerToken = localStorage.getItem('seller_token');
        
        console.log('✅ Auth Token:', authToken ? 'Present' : '❌ Missing');
        console.log('✅ Refresh Token:', refreshToken ? 'Present' : '❌ Missing');
        console.log('✅ User Type:', userType || '❌ Missing');
        console.log('✅ User Context:', userContext ? 'Present' : '❌ Missing');
        console.log('✅ User Permissions:', userPermissions ? 'Present' : '❌ Missing');
        console.log('✅ Seller Token (localStorage):', sellerToken ? 'Present' : '❌ Missing');
        
        // Decode and analyze main auth token
        if (authToken) {
            console.log('\n🔐 Auth Token Analysis:');
            console.log('----------------------');
            
            const decoded = decodeJWT(authToken);
            if (decoded.error) {
                console.log('❌ Token Decode Error:', decoded.error);
            } else {
                console.log('📋 Header:', decoded.header);
                console.log('📋 Payload:', decoded.payload);
                
                const isExpired = isTokenExpired(decoded.payload);
                console.log('⏱️ Token Expired:', isExpired ? '❌ YES' : '✅ NO');
                
                if (decoded.payload.exp) {
                    const expiryDate = new Date(decoded.payload.exp * 1000);
                    console.log('📅 Expires At:', expiryDate.toLocaleString());
                }
                
                if (decoded.payload.iat) {
                    const issuedDate = new Date(decoded.payload.iat * 1000);
                    console.log('📅 Issued At:', issuedDate.toLocaleString());
                }
            }
        }
        
        // Check if tokens match
        if (authToken && sellerToken) {
            console.log('\n🔗 Token Consistency Check:');
            console.log('---------------------------');
            console.log('Auth Token === Seller Token:', authToken === sellerToken ? '✅ Match' : '❌ Mismatch');
        }
        
        // Parse and display user context
        if (userContext) {
            console.log('\n👤 User Context:');
            console.log('----------------');
            try {
                const context = JSON.parse(userContext);
                console.log('📋 User ID:', context.id);
                console.log('📋 Name:', context.name);
                console.log('📋 Email:', context.email);
                console.log('📋 User Type:', context.userType);
                console.log('📋 Job Role:', context.jobRole || 'N/A');
                console.log('📋 Parent Seller ID:', context.parentSellerId || 'N/A');
            } catch (error) {
                console.log('❌ Failed to parse user context:', error.message);
            }
        }
        
        // Parse and display permissions
        if (userPermissions) {
            console.log('\n🔐 User Permissions:');
            console.log('-------------------');
            try {
                const permissions = JSON.parse(userPermissions);
                if (Array.isArray(permissions)) {
                    permissions.forEach((permission, index) => {
                        console.log(`${index + 1}. ${permission}`);
                    });
                } else {
                    console.log('❌ Permissions format invalid');
                }
            } catch (error) {
                console.log('❌ Failed to parse permissions:', error.message);
            }
        }
        
        // Test API authentication
        console.log('\n🌐 API Authentication Test:');
        console.log('--------------------------');
        
        if (authToken) {
            try {
                const response = await fetch('/api/v2/seller/profile', {
                    headers: {
                        'Authorization': `Bearer ${authToken}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                console.log('📡 Profile API Status:', response.status);
                console.log('📡 Profile API Success:', response.ok ? '✅ YES' : '❌ NO');
                
                if (!response.ok) {
                    const errorText = await response.text();
                    console.log('📡 Error Response:', errorText.substring(0, 200));
                }
            } catch (error) {
                console.log('❌ API Test Failed:', error.message);
            }
        }
        
        // Summary
        console.log('\n📊 Authentication Summary:');
        console.log('=========================');
        
        const hasAuthToken = !!authToken;
        const hasUserType = !!userType;
        const hasUserContext = !!userContext;
        const tokensMatch = authToken === sellerToken;
        
        const authScore = [hasAuthToken, hasUserType, hasUserContext, tokensMatch].filter(Boolean).length;
        
        console.log('🎯 Authentication Score:', `${authScore}/4`);
        
        if (authScore === 4) {
            console.log('✅ Status: FULLY AUTHENTICATED');
        } else if (authScore >= 2) {
            console.log('⚠️ Status: PARTIALLY AUTHENTICATED');
        } else {
            console.log('❌ Status: NOT AUTHENTICATED');
        }
        
        // Recommendations
        console.log('\n💡 Recommendations:');
        console.log('-------------------');
        
        if (!hasAuthToken) {
            console.log('❌ Missing auth token - User needs to log in');
        }
        if (!hasUserType) {
            console.log('❌ Missing user type - Authentication incomplete');
        }
        if (!hasUserContext) {
            console.log('❌ Missing user context - User data not available');
        }
        if (authToken && sellerToken && !tokensMatch) {
            console.log('❌ Token mismatch - Clear storage and re-authenticate');
        }
        
        if (authScore === 4) {
            console.log('✅ All checks passed - Authentication is working correctly');
        }
        
    } catch (error) {
        console.error('💥 Authentication check failed:', error);
    }
    
    console.log('\n🏁 Authentication check completed!\n');
};

// Function to clear all authentication data
window.clearSellerAuth = async () => {
    console.log('🧹 Clearing all authentication data...');
    
    try {
        const { secureStorage } = await import('./src/utils/secureStorage.js');
        
        // Clear secure storage
        await secureStorage.removeItem('auth_token');
        await secureStorage.removeItem('refresh_token');
        await secureStorage.removeItem('user_type');
        await secureStorage.removeItem('user_permissions');
        await secureStorage.removeItem('user_context');
        
        // Clear localStorage
        localStorage.removeItem('seller_token');
        
        console.log('✅ All authentication data cleared!');
        console.log('👉 User will need to log in again');
        
    } catch (error) {
        console.error('❌ Failed to clear authentication data:', error);
    }
};

// Function to simulate authentication check
window.testSellerAuth = async () => {
    console.log('🧪 Testing Seller Authentication Service...');
    
    try {
        const { sellerAuthService } = await import('./src/services/seller-auth.service.js');
        
        console.log('📋 Testing authentication methods:');
        
        // Test isAuthenticated
        const isAuth = await sellerAuthService.isAuthenticated();
        console.log('✅ isAuthenticated():', isAuth ? '✅ TRUE' : '❌ FALSE');
        
        // Test session validation
        const sessionValid = await sellerAuthService.validateAndRestoreSession();
        console.log('✅ validateAndRestoreSession():', sessionValid ? '✅ TRUE' : '❌ FALSE');
        
        // Test getCurrentUser
        const currentUser = await sellerAuthService.getCurrentUser();
        console.log('✅ getCurrentUser():', currentUser ? '✅ User found' : '❌ No user');
        if (currentUser) {
            console.log('   - Name:', currentUser.name);
            console.log('   - Email:', currentUser.email);
            console.log('   - Type:', currentUser.userType);
            console.log('   - Job Role:', currentUser.jobRole || 'N/A');
        }
        
        // Test permissions
        const permissions = await sellerAuthService.getCurrentUserPermissions();
        console.log('✅ getCurrentUserPermissions():', permissions.length, 'permissions found');
        
        // Test specific permission
        const hasDashboard = await sellerAuthService.hasPermission('Dashboard access');
        console.log('✅ hasPermission("Dashboard access"):', hasDashboard ? '✅ TRUE' : '❌ FALSE');
        
        // For team members, test token refresh
        const { secureStorage } = await import('./src/utils/secureStorage.js');
        const userType = await secureStorage.getItem('user_type');
        
        if (userType === 'team_member') {
            console.log('\n🔄 Testing Team Member Token Refresh:');
            const refreshResult = await sellerAuthService.refreshTeamMemberToken();
            console.log('✅ refreshTeamMemberToken():', refreshResult ? '✅ SUCCESS' : '❌ FAILED');
        }
        
    } catch (error) {
        console.error('❌ Authentication service test failed:', error);
    }
};

// Add new function to test token persistence
window.testTokenPersistence = async () => {
    console.log('🔄 Testing Token Persistence...');
    
    try {
        const { secureStorage } = await import('./src/utils/secureStorage.js');
        
        console.log('\n📋 Before Persistence Test:');
        const beforeToken = await secureStorage.getItem('auth_token');
        const beforeUserType = await secureStorage.getItem('user_type');
        console.log('Auth Token:', beforeToken ? 'Present' : 'Missing');
        console.log('User Type:', beforeUserType || 'Missing');
        
        // Simulate page reload by re-checking authentication
        const { sellerAuthService } = await import('./src/services/seller-auth.service.js');
        
        console.log('\n🔄 Simulating Page Reload...');
        const isAuth = await sellerAuthService.isAuthenticated();
        const sessionValid = await sellerAuthService.validateAndRestoreSession();
        
        console.log('\n📋 After Persistence Test:');
        const afterToken = await secureStorage.getItem('auth_token');
        const afterUserType = await secureStorage.getItem('user_type');
        console.log('Auth Token:', afterToken ? 'Present' : 'Missing');
        console.log('User Type:', afterUserType || 'Missing');
        console.log('Authentication Status:', isAuth ? 'Valid' : 'Invalid');
        console.log('Session Validation:', sessionValid ? 'Success' : 'Failed');
        
        // Check if tokens are the same
        const tokensMatch = beforeToken === afterToken;
        console.log('Token Consistency:', tokensMatch ? '✅ Stable' : '❌ Changed');
        
    } catch (error) {
        console.error('❌ Token persistence test failed:', error);
    }
};

console.log('\n📝 Available Commands:');
console.log('- checkSellerAuth() - Complete authentication analysis');
console.log('- clearSellerAuth() - Clear all authentication data');
console.log('- testSellerAuth() - Test authentication service methods');
console.log('- testTokenPersistence() - Test token persistence');
console.log('\n💡 Type any command in the console to run it!'); 