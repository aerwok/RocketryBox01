import { useState, useEffect } from 'react';
import { sellerAuthService } from '@/services/seller-auth.service';
import { secureStorage } from '@/utils/secureStorage';
import { Shield, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';

interface AuthStatus {
  isAuthenticated: boolean;
  userType: string | null;
  userName: string | null;
  jobRole: string | null;
  hasToken: boolean;
  tokenExpiry: string | null;
  sessionValid: boolean;
}

const AuthStatusIndicator = () => {
  const [authStatus, setAuthStatus] = useState<AuthStatus>({
    isAuthenticated: false,
    userType: null,
    userName: null,
    jobRole: null,
    hasToken: false,
    tokenExpiry: null,
    sessionValid: false
  });
  const [isVisible, setIsVisible] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const updateAuthStatus = async () => {
    try {
      const isAuth = await sellerAuthService.isAuthenticated();
      const sessionValid = await sellerAuthService.validateAndRestoreSession();
      const userType = await secureStorage.getItem('user_type');
      const authToken = await secureStorage.getItem('auth_token');
      const userContext = await secureStorage.getItem('user_context');
      
      let userName = null;
      let jobRole = null;
      let tokenExpiry = null;
      
      if (userContext) {
        const context = JSON.parse(userContext);
        userName = context.name;
        jobRole = context.jobRole;
      }
      
      if (authToken) {
        try {
          const parts = authToken.split('.');
          if (parts.length === 3) {
            const payload = JSON.parse(atob(parts[1]));
            if (payload.exp) {
              tokenExpiry = new Date(payload.exp * 1000).toLocaleString();
            }
          }
        } catch (error) {
          console.error('Error parsing token:', error);
        }
      }
      
      setAuthStatus({
        isAuthenticated: isAuth,
        userType,
        userName,
        jobRole,
        hasToken: !!authToken,
        tokenExpiry,
        sessionValid
      });
    } catch (error) {
      console.error('Error updating auth status:', error);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      if (authStatus.userType === 'team_member') {
        await sellerAuthService.refreshTeamMemberToken();
      }
      await updateAuthStatus();
    } catch (error) {
      console.error('Error refreshing token:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    updateAuthStatus();
    
    // Update status every 30 seconds
    const interval = setInterval(updateAuthStatus, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // Only show for team members in development mode
  useEffect(() => {
    const shouldShow = process.env.NODE_ENV === 'development' && authStatus.userType === 'team_member';
    setIsVisible(shouldShow);
  }, [authStatus.userType]);

  if (!isVisible) {
    return null;
  }

  const getStatusIcon = () => {
    if (authStatus.isAuthenticated && authStatus.sessionValid) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    } else if (authStatus.hasToken) {
      return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    } else {
      return <Shield className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusColor = () => {
    if (authStatus.isAuthenticated && authStatus.sessionValid) {
      return 'bg-green-50 border-green-200';
    } else if (authStatus.hasToken) {
      return 'bg-yellow-50 border-yellow-200';
    } else {
      return 'bg-red-50 border-red-200';
    }
  };

  return (
    <div className={`fixed bottom-4 right-4 p-3 rounded-lg border text-xs max-w-xs z-50 ${getStatusColor()}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <span className="font-medium">Auth Status</span>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="p-1 hover:bg-white rounded"
        >
          <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>
      
      <div className="space-y-1 text-xs">
        <div>User: {authStatus.userName || 'Unknown'}</div>
        <div>Role: {authStatus.jobRole || 'N/A'}</div>
        <div>Type: {authStatus.userType || 'None'}</div>
        <div>Token: {authStatus.hasToken ? '✅' : '❌'}</div>
        <div>Auth: {authStatus.isAuthenticated ? '✅' : '❌'}</div>
        <div>Session: {authStatus.sessionValid ? '✅' : '❌'}</div>
        {authStatus.tokenExpiry && (
          <div>Expires: {authStatus.tokenExpiry}</div>
        )}
      </div>
    </div>
  );
};

export default AuthStatusIndicator; 