import { ApiService } from './api.service';
import { secureStorage } from '@/utils/secureStorage';
import { toast } from 'sonner';
import { 
  ApiResponse, 
  ApiError, 
  Customer, 
  Seller, 
  Admin, 
  UserRole,
  ERROR_CODES 
} from '@/types/api';

export class AuthService {
  private apiService: ApiService;

  constructor() {
    this.apiService = new ApiService();
  }

  async login(emailOrPhone: string, password: string, rememberMe: boolean = false): Promise<ApiResponse<{ token: string; user: Customer | Seller | Admin }>> {
    try {
      const response = await this.apiService.post<{ token: string; user: Customer | Seller | Admin }>('/auth/login', {
        emailOrPhone,
        password,
        rememberMe
      });

      if (response.data.token) {
        await secureStorage.setItem('auth_token', response.data.token);
      }

      return response;
    } catch (error) {
      const apiError = error as ApiError;
      toast.error(apiError.message || 'Login failed');
      throw error;
    }
  }

  async register(data: {
    name: string;
    mobile: string;
    mobileOtp: string;
    email: string;
    emailOtp: string;
    password: string;
    confirmPassword: string;
    role: UserRole;
    [key: string]: any;
  }): Promise<ApiResponse<{ token: string; user: Customer | Seller | Admin }>> {
    try {
      const response = await this.apiService.post<{ token: string; user: Customer | Seller | Admin }>('/auth/register', data);

      if (response.data.token) {
        await secureStorage.setItem('auth_token', response.data.token);
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
      await secureStorage.removeItem('auth_token');
      toast.success('Logged out successfully');
    } catch (error) {
      toast.error('Failed to logout');
      throw error;
    }
  }

  async sendMobileOTP(mobile: string): Promise<ApiResponse<{ message: string }>> {
    try {
      return await this.apiService.post<{ message: string }>('/auth/send-mobile-otp', { mobile });
    } catch (error) {
      const apiError = error as ApiError;
      toast.error(apiError.message || 'Failed to send OTP');
      throw error;
    }
  }

  async sendEmailOTP(email: string): Promise<ApiResponse<{ message: string }>> {
    try {
      return await this.apiService.post<{ message: string }>('/auth/send-email-otp', { email });
    } catch (error) {
      const apiError = error as ApiError;
      toast.error(apiError.message || 'Failed to send OTP');
      throw error;
    }
  }

  async verifyMobileOTP(mobile: string, otp: string): Promise<ApiResponse<{ message: string }>> {
    try {
      return await this.apiService.post<{ message: string }>('/auth/verify-otp', {
        phoneOrEmail: mobile,
        otp,
        type: 'mobile'
      });
    } catch (error) {
      const apiError = error as ApiError;
      toast.error(apiError.message || 'OTP verification failed');
      throw error;
    }
  }

  async verifyEmailOTP(email: string, otp: string): Promise<ApiResponse<{ message: string }>> {
    try {
      return await this.apiService.post<{ message: string }>('/auth/verify-otp', {
        phoneOrEmail: email,
        otp,
        type: 'email'
      });
    } catch (error) {
      const apiError = error as ApiError;
      toast.error(apiError.message || 'OTP verification failed');
      throw error;
    }
  }

  async resetPassword(emailOrPhone: string, otp: string, newPassword: string): Promise<ApiResponse<{ message: string }>> {
    try {
      return await this.apiService.post<{ message: string }>('/auth/reset-password', {
        emailOrPhone,
        otp,
        newPassword
      });
    } catch (error) {
      const apiError = error as ApiError;
      toast.error(apiError.message || 'Password reset failed');
      throw error;
    }
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<ApiResponse<{ message: string }>> {
    try {
      return await this.apiService.post<{ message: string }>('/auth/change-password', {
        currentPassword,
        newPassword
      });
    } catch (error) {
      const apiError = error as ApiError;
      toast.error(apiError.message || 'Password change failed');
      throw error;
    }
  }

  async getCurrentUser(): Promise<Customer | Seller | Admin | null> {
    try {
      const token = await secureStorage.getItem('auth_token');
      if (!token) return null;

      const response = await this.apiService.get<Customer | Seller | Admin>('/auth/me');
      return response.data;
    } catch (error) {
      const apiError = error as ApiError;
      if (apiError.code === ERROR_CODES.UNAUTHORIZED) {
        await secureStorage.removeItem('auth_token');
      }
      return null;
    }
  }
} 