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

  async login(data: SellerLoginInput): Promise<ApiResponse<SellerLoginResponse>> {
    try {
      console.log('SellerAuthService.login called with:', {
        emailOrPhone: data.emailOrPhone,
        hasPassword: !!data.password,
        rememberMe: data.rememberMe
      });
      
      const credentials = {
        emailOrPhone: data.emailOrPhone.includes('@') ? data.emailOrPhone.toLowerCase() : data.emailOrPhone,
        password: data.password,
        rememberMe: data.rememberMe || false
      };
      
      console.log('Making login request to API...');
      const response = await this.api.post<SellerLoginResponse>('/seller/auth/login', credentials);
      console.log('API response received:', {
        success: response.success,
        hasData: !!response.data,
        hasToken: !!(response.data?.accessToken)
      });
      
      // Store the token in secure storage
      if (response.data?.accessToken) {
        console.log('Storing auth tokens...');
        await secureStorage.setItem('auth_token', response.data.accessToken);
        if (response.data.refreshToken) {
          await secureStorage.setItem('refresh_token', response.data.refreshToken);
        }
        console.log('Auth tokens stored successfully');
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
          message: 'Account not found with the provided email/phone',
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
      // Always clear tokens on logout attempt
      await secureStorage.removeItem('auth_token');
      await secureStorage.removeItem('refresh_token');
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