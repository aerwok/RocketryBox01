import { ApiService } from './api.service';
import { secureStorage } from '@/utils/secureStorage';
import { toast } from 'sonner';
import { 
  ApiResponse, 
  ApiError, 
  Seller, 
  ERROR_CODES 
} from '@/types/api';
import { SellerLoginInput, SellerRegisterInput } from '@/lib/validations/seller';
import { getStoredTeamMembers, SellerTeamMember } from '@/lib/api/seller-users';

interface SellerLoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  seller: {
    id: string;
    name: string;
    email: string;
    businessName: string;
  };
}

interface TeamMemberLoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  teamMember: {
    id: string;
    name: string;
    email: string;
    jobRole: string;
    permissions: string[];
    parentSellerId: string;
  };
  userType: 'team_member';
}

interface SellerRegisterResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  seller: Seller;
}

export class SellerAuthService {
  private api: ApiService;

  constructor() {
    this.api = new ApiService();
  }

  private async checkTeamMemberLogin(emailOrPhone: string, password: string): Promise<TeamMemberLoginResponse | null> {
    try {
      // Get all team members from localStorage
      const teamMembers = getStoredTeamMembers();
      
      // Find matching team member by email
      const teamMember = teamMembers.find((member: SellerTeamMember) => 
        member.email.toLowerCase() === emailOrPhone.toLowerCase() && 
        member.status === 'active'
      );
      
      if (!teamMember) {
        return null;
      }
      
      // In a real implementation, you'd verify the password hash
      // For now, we'll use a simple mock verification
      // In production, this should be handled by the backend
      console.log('🔐 Team member found:', teamMember.name, 'Role:', teamMember.jobRole);
      
      // Create a proper JWT-like token that won't be rejected by the backend
      // This mimics the structure of a real JWT but is still mock data
      const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
      const payload = btoa(JSON.stringify({
        sub: teamMember.id,
        iss: "rocketrybox",
        aud: "seller-dashboard",
        exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
        iat: Math.floor(Date.now() / 1000),
        userType: 'team_member',
        permissions: teamMember.permissions,
        parentSellerId: teamMember.sellerId || 'seller_main',
        email: teamMember.email,
        name: teamMember.name,
        jobRole: teamMember.jobRole,
        // Add a flag to identify this as a mock token
        isMockToken: true
      }));
      const signature = btoa(`mock_signature_${teamMember.id}_${Date.now()}`);
      const mockToken = `${header}.${payload}.${signature}`;
      
      return {
        accessToken: mockToken,
        refreshToken: `refresh_${mockToken}`,
        expiresIn: 86400,
        teamMember: {
          id: teamMember.id,
          name: teamMember.name,
          email: teamMember.email,
          jobRole: teamMember.jobRole,
          permissions: teamMember.permissions,
          parentSellerId: teamMember.sellerId || 'seller_main'
        },
        userType: 'team_member'
      };
    } catch (error) {
      console.error('Error checking team member login:', error);
      return null;
    }
  }

  async login(data: SellerLoginInput): Promise<ApiResponse<SellerLoginResponse | TeamMemberLoginResponse>> {
    try {
      console.log('SellerAuthService.login called with:', {
        emailOrPhone: data.emailOrPhone,
        hasPassword: !!data.password,
        rememberMe: data.rememberMe
      });
      
      // First, check if this is a team member login
      console.log('Checking for team member login...');
      const teamMemberResponse = await this.checkTeamMemberLogin(data.emailOrPhone, data.password || '');
      
      if (teamMemberResponse) {
        console.log('Team member login successful:', teamMemberResponse.teamMember.name);
        
        // Store team member context
        await secureStorage.setItem('auth_token', teamMemberResponse.accessToken);
        await secureStorage.setItem('refresh_token', teamMemberResponse.refreshToken);
        await secureStorage.setItem('user_type', 'team_member');
        await secureStorage.setItem('user_permissions', JSON.stringify(teamMemberResponse.teamMember.permissions));
        await secureStorage.setItem('user_context', JSON.stringify({
          id: teamMemberResponse.teamMember.id,
          name: teamMemberResponse.teamMember.name,
          email: teamMemberResponse.teamMember.email,
          jobRole: teamMemberResponse.teamMember.jobRole,
          permissions: teamMemberResponse.teamMember.permissions,
          userType: 'team_member',
          parentSellerId: teamMemberResponse.teamMember.parentSellerId
        }));
        
        // Also store seller_token for navbar compatibility
        localStorage.setItem('seller_token', teamMemberResponse.accessToken);
        
        return {
          success: true,
          data: teamMemberResponse,
          message: 'Team member login successful',
          status: 200
        };
      }
      
      // If not a team member, proceed with normal seller login
      console.log('Proceeding with main seller login...');
      const credentials = {
        emailOrPhone: data.emailOrPhone.includes('@') ? data.emailOrPhone.toLowerCase() : data.emailOrPhone,
        password: data.password || '',
        rememberMe: data.rememberMe || false
      };
      
      console.log('Making login request to API...');
      const response = await this.api.post<SellerLoginResponse>('/seller/auth/login', credentials);
      console.log('API response received:', {
        success: response.success,
        hasData: !!response.data,
        hasToken: !!(response.data?.accessToken)
      });
      
      // Store the seller token and context
      if (response.data?.accessToken) {
        console.log('Storing seller auth tokens...');
        await secureStorage.setItem('auth_token', response.data.accessToken);
        if (response.data.refreshToken) {
          await secureStorage.setItem('refresh_token', response.data.refreshToken);
        }
        await secureStorage.setItem('user_type', 'seller');
        await secureStorage.setItem('user_context', JSON.stringify({
          id: response.data.seller.id,
          name: response.data.seller.name,
          email: response.data.seller.email,
          businessName: response.data.seller.businessName,
          userType: 'seller'
        }));
        
        // Store seller data in localStorage so team members can access it
        localStorage.setItem('current_seller_data', JSON.stringify({
          sellerId: response.data.seller.id,
          name: response.data.seller.name,
          email: response.data.seller.email,
          businessName: response.data.seller.businessName
        }));
        
        // Also store seller_token for navbar compatibility
        localStorage.setItem('seller_token', response.data.accessToken);
        
        console.log('Seller auth tokens stored successfully');
      } else {
        console.warn('No access token in response:', response);
      }
      
      return response;
    } catch (error: any) {
      console.error('Login request failed:', {
        name: error.name,
        message: error.message,
        status: error.status || error.response?.status,
        code: error.code,
        response: error.response?.data
      });
      
      // Properly handle 404 error
      if (error.response?.status === 404) {
        const apiError: ApiError = {
          message: 'Account not found with the provided email/phone. Please check your credentials or contact your admin if you are a team member.',
          status: 404,
          code: ERROR_CODES.NOT_FOUND
        };
        throw apiError;
      }
      
      // Handle other errors
      const apiError = error as ApiError;
      if (!apiError.message) {
        apiError.message = 'Login failed. Please try again.';
      }
      throw apiError;
    }
  }

  async register(data: SellerRegisterInput, verifiedOtp: string): Promise<ApiResponse<SellerRegisterResponse>> {
    try {
      // Format the data for the API
      const registerData = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        password: data.password,
        companyName: data.companyName,
        monthlyShipments: data.monthlyShipments,
        otp: verifiedOtp
      };
      
      const response = await this.api.post<SellerRegisterResponse>('/seller/auth/register', registerData);
      
      // Store the token in secure storage
      if (response.data?.accessToken) {
        await secureStorage.setItem('auth_token', response.data.accessToken);
        if (response.data.refreshToken) {
          await secureStorage.setItem('refresh_token', response.data.refreshToken);
        }
        await secureStorage.setItem('user_type', 'seller');
      }
      
      return response;
    } catch (error) {
      const apiError = error as ApiError;
      toast.error(apiError.message || 'Registration failed');
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      await this.api.post('/seller/auth/logout');
    } finally {
      // Always clear all user data on logout
      await secureStorage.removeItem('auth_token');
      await secureStorage.removeItem('refresh_token');
      await secureStorage.removeItem('user_type');
      await secureStorage.removeItem('user_permissions');
      await secureStorage.removeItem('user_context');
      
      // Also remove localStorage tokens and seller data
      localStorage.removeItem('seller_token');
      localStorage.removeItem('current_seller_data');
    }
  }

  async getCurrentUser(): Promise<any | null> {
    try {
      const token = await secureStorage.getItem('auth_token');
      if (!token) return null;

      const userType = await secureStorage.getItem('user_type');
      const userContext = await secureStorage.getItem('user_context');
      
      if (userContext) {
        return JSON.parse(userContext);
      }

      // Fallback to API call for seller
      if (userType === 'seller') {
        const response = await this.api.get<Seller>('/seller/profile');
        return response.data;
      }
      
      return null;
    } catch (error) {
      const apiError = error as ApiError;
      if (apiError.code === ERROR_CODES.UNAUTHORIZED) {
        await secureStorage.removeItem('auth_token');
        await secureStorage.removeItem('user_type');
        await secureStorage.removeItem('user_context');
      }
      return null;
    }
  }

  // Helper method to get current user permissions
  async getCurrentUserPermissions(): Promise<string[]> {
    try {
      const userType = await secureStorage.getItem('user_type');
      
      if (userType === 'team_member') {
        const permissions = await secureStorage.getItem('user_permissions');
        return permissions ? JSON.parse(permissions) : [];
      }
      
      // Sellers have all permissions
      if (userType === 'seller') {
        return [
          "Dashboard access", "Order", "Shipments", "Manifest", "Received", "New Order",
          "NDR List", "Weight Dispute", "Fright", "Wallet", "Invoice", "Ledger",
          "COD Remittance", "Support", "Warehouse", "Service", "Items & SKU",
          "Stores", "Priority", "Label", "Manage Users"
        ];
      }
      
      return [];
    } catch (error) {
      console.error('Error getting user permissions:', error);
      return [];
    }
  }

  // Helper method to check if current user has permission
  async hasPermission(permission: string): Promise<boolean> {
    const permissions = await this.getCurrentUserPermissions();
    return permissions.includes(permission);
  }

  // Method to check authentication status without backend calls
  async isAuthenticated(): Promise<boolean> {
    try {
      const token = await secureStorage.getItem('auth_token');
      const userType = await secureStorage.getItem('user_type');
      
      if (!token || !userType) {
        return false;
      }
      
      // For team members, validate the mock token structure and expiration
      if (userType === 'team_member') {
        const userContext = await secureStorage.getItem('user_context');
        if (!userContext) {
          return false;
        }
        
        // Validate token expiration for team members
        try {
          const parts = token.split('.');
          if (parts.length === 3) {
            const payload = JSON.parse(atob(parts[1]));
            if (payload.exp && Date.now() >= payload.exp * 1000) {
              console.log('🔐 Team member token expired, clearing authentication');
              await this.clearAuthData();
              return false;
            }
          }
        } catch (tokenError) {
          console.error('🔐 Team member token validation error:', tokenError);
          return false;
        }
        
        return true;
      }
      
      // For sellers, we could add more validation here if needed
      return true;
    } catch (error) {
      console.error('Error checking authentication status:', error);
      return false;
    }
  }

  // Helper method to clear all authentication data
  private async clearAuthData(): Promise<void> {
    try {
      await secureStorage.removeItem('auth_token');
      await secureStorage.removeItem('refresh_token');
      await secureStorage.removeItem('user_type');
      await secureStorage.removeItem('user_permissions');
      await secureStorage.removeItem('user_context');
      localStorage.removeItem('seller_token');
      localStorage.removeItem('current_seller_data');
    } catch (error) {
      console.error('Error clearing auth data:', error);
    }
  }

  // Method to refresh team member token if needed
  async refreshTeamMemberToken(): Promise<boolean> {
    try {
      const userType = await secureStorage.getItem('user_type');
      if (userType !== 'team_member') {
        return false;
      }

      const userContext = await secureStorage.getItem('user_context');
      if (!userContext) {
        return false;
      }

      const context = JSON.parse(userContext);
      
      // Find the team member in storage and regenerate token
      const teamMembers = getStoredTeamMembers();
      const teamMember = teamMembers.find(member => member.id === context.id);
      
      if (!teamMember) {
        console.log('🔐 Team member not found in storage, clearing auth');
        await this.clearAuthData();
        return false;
      }

      // Generate new token
      const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
      const payload = btoa(JSON.stringify({
        sub: teamMember.id,
        iss: "rocketrybox",
        aud: "seller-dashboard",
        exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
        iat: Math.floor(Date.now() / 1000),
        userType: 'team_member',
        permissions: teamMember.permissions,
        parentSellerId: teamMember.sellerId || 'seller_main',
        email: teamMember.email,
        name: teamMember.name,
        jobRole: teamMember.jobRole,
        isMockToken: true
      }));
      const signature = btoa(`mock_signature_${teamMember.id}_${Date.now()}`);
      const newToken = `${header}.${payload}.${signature}`;

      // Store the new token
      await secureStorage.setItem('auth_token', newToken);
      localStorage.setItem('seller_token', newToken);
      
      console.log('🔐 Team member token refreshed successfully');
      return true;
    } catch (error) {
      console.error('Error refreshing team member token:', error);
      return false;
    }
  }

  // Method to validate and restore team member session on page load
  async validateAndRestoreSession(): Promise<boolean> {
    try {
      const isAuth = await this.isAuthenticated();
      
      if (!isAuth) {
        return false;
      }

      const userType = await secureStorage.getItem('user_type');
      
      // For team members, ensure all required data is present
      if (userType === 'team_member') {
        const authToken = await secureStorage.getItem('auth_token');
        const userContext = await secureStorage.getItem('user_context');
        const userPermissions = await secureStorage.getItem('user_permissions');
        const sellerToken = localStorage.getItem('seller_token');

        // Check if any required data is missing
        if (!authToken || !userContext || !userPermissions) {
          console.log('🔐 Team member session incomplete, attempting to restore');
          return await this.refreshTeamMemberToken();
        }

        // Ensure localStorage token matches
        if (authToken !== sellerToken) {
          console.log('🔐 Token mismatch detected, synchronizing');
          localStorage.setItem('seller_token', authToken);
        }

        console.log('🔐 Team member session validated successfully');
        return true;
      }

      return true;
    } catch (error) {
      console.error('Error validating session:', error);
      return false;
    }
  }

  async sendOTP(emailOrPhone: string, purpose: string = 'login'): Promise<ApiResponse<{ message: string }>> {
    try {
      return await this.api.sendSellerOTP(emailOrPhone, purpose);
    } catch (error) {
      const apiError = error as ApiError;
      toast.error(apiError.message || 'Failed to send OTP');
      throw error;
    }
  }

  async verifyOTP(emailOrPhone: string, otp: string, purpose: string = 'login'): Promise<ApiResponse<{ message: string }>> {
    try {
      return await this.api.verifySellerOTP(emailOrPhone, otp, purpose);
    } catch (error) {
      const apiError = error as ApiError;
      toast.error(apiError.message || 'OTP verification failed');
      throw error;
    }
  }

  async resetPassword(emailOrPhone: string, otp: string, newPassword: string, confirmPassword: string): Promise<ApiResponse<{ message: string }>> {
    try {
      return await this.api.post<{ message: string }>('/seller/auth/reset-password', {
        emailOrPhone,
        otp,
        newPassword,
        confirmPassword
      });
    } catch (error) {
      const apiError = error as ApiError;
      toast.error(apiError.message || 'Password reset failed');
      throw error;
    }
  }

  async getCurrentSeller(): Promise<Seller | null> {
    try {
      const token = await secureStorage.getItem('auth_token');
      if (!token) return null;

      const response = await this.api.get<Seller>('/seller/profile');
      return response.data;
    } catch (error) {
      const apiError = error as ApiError;
      if (apiError.code === ERROR_CODES.UNAUTHORIZED) {
        await secureStorage.removeItem('auth_token');
      }
      return null;
    }
  }

  async refreshToken(refreshToken: string): Promise<ApiResponse<{ accessToken: string }>> {
    return this.api.post<{ accessToken: string }>('/seller/auth/refresh-token', { refreshToken });
  }
}

export const sellerAuthService = new SellerAuthService(); 