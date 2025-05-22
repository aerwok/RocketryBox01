import { ApiService } from './api.service';
import { secureStorage } from '@/utils/secureStorage';
import { toast } from 'sonner';
import { 
  ApiResponse, 
  ApiError, 
  Customer, 
  Seller, 
  Admin, 
  ERROR_CODES 
} from '@/types/api';
import { CustomerRegisterInput } from '@/lib/validations/customer';

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export class AuthService {
  private api: ApiService;

  constructor() {
    this.api = new ApiService();
  }

  async login(credentials: { phoneOrEmail: string; password: string; otp?: string; rememberMe?: boolean }): Promise<ApiResponse<LoginResponse>> {
    return this.api.post<LoginResponse>('/customer/auth/login', credentials);
  }

  async register(data: CustomerRegisterInput): Promise<ApiResponse<LoginResponse>> {
    return this.api.post<LoginResponse>('/customer/auth/register', data);
  }

  async logout(): Promise<void> {
    await this.api.post('/customer/auth/logout');
  }

  async refreshToken(refreshToken: string): Promise<ApiResponse<{ accessToken: string }>> {
    return this.api.post<{ accessToken: string }>('/customer/auth/refresh-token', { refreshToken });
  }

  async sendMobileOTP(mobile: string): Promise<ApiResponse<{ message: string }>> {
    try {
      return await this.api.post<{ message: string }>('/customer/auth/otp/send', { mobile });
    } catch (error) {
      const apiError = error as ApiError;
      toast.error(apiError.message || 'Failed to send OTP');
      throw error;
    }
  }

  async sendEmailOTP(email: string): Promise<ApiResponse<{ message: string }>> {
    try {
      return await this.api.post<{ message: string }>('/customer/auth/otp/send', { email });
    } catch (error) {
      const apiError = error as ApiError;
      toast.error(apiError.message || 'Failed to send OTP');
      throw error;
    }
  }

  async verifyMobileOTP(mobile: string, otp: string): Promise<ApiResponse<{ message: string }>> {
    try {
      return await this.api.post<{ message: string }>('/customer/auth/otp/verify', {
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
      return await this.api.post<{ message: string }>('/customer/auth/otp/verify', {
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
      return await this.api.post<{ message: string }>('/customer/auth/reset-password', {
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
      return await this.api.post<{ message: string }>('/customer/auth/change-password', {
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

      const response = await this.api.get<Customer | Seller | Admin>('/customer/profile');
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

export const authService = new AuthService(); 