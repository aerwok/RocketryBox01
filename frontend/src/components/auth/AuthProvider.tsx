import { ApiService } from '@/services/api.service';
import { sellerAuthService } from '@/services/seller-auth.service';
import { secureStorage } from '@/utils/secureStorage';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

interface AuthContextType {
  isAuthenticated: boolean;
  userType: 'seller' | 'admin' | 'customer' | 'team_member' | null;
  user: any;
  loading: boolean;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userType, setUserType] = useState<'seller' | 'admin' | 'customer' | 'team_member' | null>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  const isAuthPage = (path: string) => {
    return path.includes('/login') || path.includes('/register') || path.includes('/auth');
  };

  const getRedirectPath = (userType: string | null, currentPath: string) => {
    if (userType === 'seller' || userType === 'team_member') {
      return '/seller/login';
    } else if (currentPath.includes('/admin')) {
      return '/admin/login';
    } else if (currentPath.includes('/customer')) {
      return '/customer/auth/login';
    }
    // Default based on current path
    if (currentPath.includes('/admin')) return '/admin/login';
    if (currentPath.includes('/customer')) return '/customer/auth/login';
    return '/seller/login';
  };

  const validateToken = async (token: string): Promise<boolean> => {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return false;

      const payload = JSON.parse(atob(parts[1]));
      const now = Math.floor(Date.now() / 1000);

      // Check if token is expired (with 2 hour buffer for better UX)
      if (payload.exp && payload.exp < (now + 7200)) {
        console.log('🔐 Token expiring soon or expired, attempting refresh');
        return false;
      }

      return true;
    } catch (error) {
      console.error('Token validation error:', error);
      return false;
    }
  };

  const refreshAuth = async () => {
    try {
      setLoading(true);

      const authToken = await secureStorage.getItem('auth_token');
      const storedUserType = await secureStorage.getItem('user_type');
      const userContext = await secureStorage.getItem('user_context');

      if (!authToken || !storedUserType) {
        console.log('🔐 No auth token or user type found');
        setIsAuthenticated(false);
        setUserType(null);
        setUser(null);
        return;
      }

      // Validate token expiry
      const isTokenValid = await validateToken(authToken);
      if (!isTokenValid) {
        console.log('🔐 Token invalid or expiring, attempting refresh');

        // Try to refresh token for sellers
        if (storedUserType === 'seller') {
          try {
            const refreshToken = await secureStorage.getItem('refresh_token');
            if (refreshToken) {
              const apiService = ApiService.getInstance();
              const response = await apiService.post<{
                accessToken: string;
                refreshToken?: string;
                expiresIn: number;
              }>('/seller/auth/refresh-token', {
                refreshToken
              });

              if (response.success && response.data?.accessToken) {
                await secureStorage.setItem('auth_token', response.data.accessToken);
                if (response.data.refreshToken) {
                  await secureStorage.setItem('refresh_token', response.data.refreshToken);
                }
                console.log('🔐 Seller token refreshed successfully');
              } else {
                throw new Error('Token refresh failed');
              }
            } else {
              throw new Error('No refresh token available');
            }
          } catch (refreshError) {
            console.error('🔐 Token refresh failed:', refreshError);
            await clearAuthData();
            return;
          }
        } else if (storedUserType === 'team_member') {
          // Refresh team member token
          const refreshed = await sellerAuthService.refreshTeamMemberToken();
          if (!refreshed) {
            console.log('🔐 Team member token refresh failed');
            await clearAuthData();
            return;
          }
        } else if (storedUserType === 'admin') {
          // Try to refresh admin token
          try {
            const apiService = ApiService.getInstance();
            const response = await apiService.post<{
              accessToken: string;
              expiresIn: number;
            }>('/admin/auth/refresh-token', {}, {
              headers: {
                'Authorization': `Bearer ${authToken}`
              }
            });

            if (response.success && response.data?.accessToken) {
              await secureStorage.setItem('auth_token', response.data.accessToken);
              console.log('🔐 Admin token refreshed successfully');
            } else {
              throw new Error('Admin token refresh failed');
            }
          } catch (refreshError) {
            console.error('🔐 Admin token refresh failed:', refreshError);
            await clearAuthData();
            return;
          }
        } else {
          // For unknown user types, clear and require re-login
          await clearAuthData();
          return;
        }
      }

      // Restore user context
      if (userContext) {
        try {
          const parsedUser = JSON.parse(userContext);
          setUser(parsedUser);
          setUserType(storedUserType as any);
          setIsAuthenticated(true);

          console.log('🔐 Authentication restored successfully:', {
            userType: storedUserType,
            userName: parsedUser.name,
            userId: parsedUser.id
          });
        } catch (parseError) {
          console.error('🔐 Error parsing user context:', parseError);
          await clearAuthData();
        }
      } else {
        console.log('🔐 No user context found');
        await clearAuthData();
      }

    } catch (error) {
      console.error('🔐 Authentication refresh error:', error);
      await clearAuthData();
    } finally {
      setLoading(false);
    }
  };

  const clearAuthData = async () => {
    try {
      await secureStorage.removeItem('auth_token');
      await secureStorage.removeItem('refresh_token');
      await secureStorage.removeItem('user_type');
      await secureStorage.removeItem('user_permissions');
      await secureStorage.removeItem('user_context');

      // Clear seller-specific data
      localStorage.removeItem('seller_token');
      localStorage.removeItem('current_seller_data');

      // Clear admin-specific data
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      setIsAuthenticated(false);
      setUserType(null);
      setUser(null);
    } catch (error) {
      console.error('Error clearing auth data:', error);
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      const currentPath = location.pathname;

      // Skip auth check on auth pages
      if (isAuthPage(currentPath)) {
        setLoading(false);
        return;
      }

      console.log('🔐 Initializing authentication for:', currentPath);
      await refreshAuth();
    };

    initializeAuth();
  }, [location.pathname]);

  // Redirect logic after authentication check
  useEffect(() => {
    if (loading) return;

    const currentPath = location.pathname;

    // If not authenticated and not on auth page, redirect to login
    if (!isAuthenticated && !isAuthPage(currentPath)) {
      const redirectPath = getRedirectPath(userType, currentPath);
      console.log('🔐 Not authenticated, redirecting to:', redirectPath);
      navigate(redirectPath, { replace: true });
    }
  }, [isAuthenticated, loading, location.pathname, userType]);

  // Set up periodic token refresh (every 30 minutes)
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(async () => {
      console.log('🔐 Periodic auth refresh');
      await refreshAuth();
    }, 4 * 60 * 60 * 1000); // 4 hours

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const contextValue: AuthContextType = {
    isAuthenticated,
    userType,
    user,
    loading,
    refreshAuth
  };

  // Show loading screen while authenticating (except on auth pages)
  if (loading && !isAuthPage(location.pathname)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="relative">
            <div className="h-12 w-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
          </div>
          <h2 className="mt-4 text-lg font-semibold text-gray-700">
            Restoring your session...
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            Please wait while we securely restore your authentication
          </p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
