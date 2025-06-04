import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { ApiResponse, ApiError } from '@/types/api';
import { secureStorage } from '@/utils/secureStorage';

export type { ApiResponse };

export class ApiService {
  private static instance: ApiService;
  private api!: AxiosInstance;
  private navigate: ((path: string) => void) | null = null;
  private isInitialized: boolean = false;
  
  // Request throttling to prevent rate limiting
  private requestThrottles: Record<string, number> = {};
  private readonly THROTTLE_INTERVAL = 2000; // 2 seconds between identical requests

  private constructor() {
    this.initializeService();
  }

  /**
   * Get the singleton instance of ApiService
   * This ensures only one instance exists throughout the application
   */
  public static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  /**
   * Initialize the API service with axios configuration
   * Only runs once per application lifecycle
   */
  private initializeService(): void {
    if (this.isInitialized) {
      return;
    }

    // Get base domain without any path
    const baseDomain = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    const baseURL = `${baseDomain}/api/v2`;
    
    // Log initialization only once and more concisely
    if (process.env.NODE_ENV === 'development') {
      console.log(`🚀 API Service initialized: ${baseURL}`);
    }
    
    this.api = axios.create({
      baseURL,
      withCredentials: true, // Enable sending cookies with every request
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
    this.isInitialized = true;
  }

  // Method to set the navigation function
  setNavigate(navigate: (path: string) => void) {
    this.navigate = navigate;
  }

  private setupInterceptors() {
    // Request interceptor
    this.api.interceptors.request.use(
      async (config) => {
        try {
          // Get token from secure storage
          const token = await secureStorage.getItem('auth_token');
          
          // Add token to headers if it exists
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }

          // For team members accessing dashboard data, use main seller context
          if (config.url?.includes('/seller/dashboard/')) {
            try {
              const { sellerAuthService } = await import('@/services/seller-auth.service');
              const currentUser = await sellerAuthService.getCurrentUser();
              
              if (currentUser?.userType === 'team_member') {
                // For team members, use a shared seller context for dashboard data
                const sellerData = JSON.parse(localStorage.getItem('current_seller_data') || '{}');
                if (sellerData.sellerId) {
                  config.headers['X-Seller-Context'] = sellerData.sellerId;
                }
              }
            } catch (error) {
              console.warn('Failed to get user context for dashboard request:', error);
            }
          }

          // Reduced logging - only log important requests in development
          if (process.env.NODE_ENV === 'development' && config.url && !config.url.includes('/health')) {
            console.log(`📡 ${config.method?.toUpperCase()} ${config.url}`, {
              hasAuth: !!token,
              baseURL: config.baseURL
            });
          }
          
          return config;
        } catch (error) {
          console.error('❌ Request interceptor error:', error);
          return config;
        }
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.api.interceptors.response.use(
      (response) => {
        // Success logging only for important endpoints
        if (process.env.NODE_ENV === 'development' && 
            response.config.url && 
            !response.config.url.includes('/health') &&
            response.status >= 400) {
          console.log(`✅ ${response.status} ${response.config.url}`);
        }
        return response;
      },
      async (error) => {
        // Enhanced error logging
        console.error('🚨 API Error:', {
          status: error.response?.status,
          url: error.config?.url,
          message: error.response?.data?.message || error.message,
          baseURL: error.config?.baseURL
        });
        
        if (error.response) {
          if (error.response.status === 401) {
            // Check if this is a team member with mock token before clearing auth
            try {
              const userType = await secureStorage.getItem('user_type');
              const authToken = await secureStorage.getItem('auth_token');
              
              // For team members, don't clear tokens on 401 errors since they use mock tokens
              // Only clear tokens for real authentication failures (main sellers)
              if (userType === 'team_member' && authToken) {
                console.log('🔐 Team member API call failed (expected for mock tokens), preserving auth tokens');
                // Don't clear tokens for team members - they have limited API access by design
              } else {
                // Clear tokens only for main sellers with real authentication failures
                console.log('🔐 Main seller authentication failed, clearing tokens');
                await secureStorage.removeItem('auth_token');
                await secureStorage.removeItem('refresh_token');
                await secureStorage.removeItem('user_type');
                await secureStorage.removeItem('user_permissions');
                await secureStorage.removeItem('user_context');
                localStorage.removeItem('seller_token');
                
                // Redirect to appropriate login page based on current URL
                const currentPath = window.location.pathname;
                let redirectPath = '/seller/login';
                
                if (currentPath.includes('/admin')) {
                  redirectPath = '/admin/login';
                } else if (currentPath.includes('/customer')) {
                  redirectPath = '/customer/login';
                }
                
                // Use React Router navigation if available, fallback to window.location
                if (this.navigate) {
                  this.navigate(redirectPath);
                } else {
                  window.location.href = redirectPath;
                }
              }
            } catch (storageError) {
              console.error('Error checking user type during 401 handling:', storageError);
              // If we can't check user type, don't clear tokens to be safe
            }
          }

          // Handle HTML error responses
          let errorMessage = 'An error occurred';
          let errorCode = 'SERVER_ERROR';

          if (typeof error.response.data === 'string' && error.response.data.includes('<!DOCTYPE html>')) {
            // Extract error message from HTML
            const errorMatch = error.response.data.match(/Error: ([^<]+)</);
            if (errorMatch && errorMatch[1]) {
              errorMessage = errorMatch[1].trim();
            }
          } else if (error.response.data && error.response.data.message) {
            errorMessage = error.response.data.message;
            errorCode = error.response.data.code || 'SERVER_ERROR';
          }

          const apiError: ApiError = {
            message: errorMessage,
            code: errorCode,
            status: error.response.status,
            details: error.response.data.details,
            data: error.response.data
          };
          return Promise.reject(apiError);
        }
        return Promise.reject(error);
      }
    );
  }

  private async request<T>(config: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      // Generate a request key for throttling based on the URL and method
      const requestKey = `${config.method}-${config.url}`;
      
      // Check if we need to throttle this request
      const lastRequestTime = this.requestThrottles[requestKey] || 0;
      const currentTime = Date.now();
      
      if (currentTime - lastRequestTime < this.THROTTLE_INTERVAL) {
        console.log(`⏱️ Throttling request to ${config.url}`);
        await new Promise(resolve => 
          setTimeout(resolve, this.THROTTLE_INTERVAL - (currentTime - lastRequestTime))
        );
      }
      
      // Update last request time
      this.requestThrottles[requestKey] = Date.now();

      // Make the request
      const response = await this.api.request({
        ...config,
        withCredentials: true // Ensure cookies are sent with each request
      });

      // Reduced response logging
      if (process.env.NODE_ENV === 'development' && config.responseType === 'blob') {
        console.log(`📄 Blob response: ${config.url} (${response.data?.size || 'unknown'} bytes)`);
      }

      // Handle blob responses differently
      if (config.responseType === 'blob') {
        // For blob responses, wrap the raw blob in our API response format
        return {
          success: true,
          data: response.data as T,
          message: 'Request successful',
          status: response.status
        };
      }

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const apiError: ApiError = {
          message: error.response?.data?.message || 'An error occurred',
          code: error.response?.data?.code || 'SERVER_ERROR',
          status: error.response?.status || 500,
          details: error.response?.data?.details,
          data: error.response?.data
        };
        throw apiError;
      }
      throw error;
    }
  }

  async sendSellerOTP(emailOrPhone: string, purpose: string): Promise<ApiResponse<any>> {
    return this.post('seller/auth/otp/send', {
      emailOrPhone,
      purpose
    });
  }
  
  async verifySellerOTP(emailOrPhone: string, otp: string, purpose: string): Promise<ApiResponse<any>> {
    return this.post('seller/auth/otp/verify', {
      emailOrPhone,
      otp,
      purpose
    });
  }

  async get<T>(endpoint: string, params?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>({
      method: 'GET',
      url: endpoint,
      params,
      ...config
    });
  }

  async post<T>(endpoint: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>({
      method: 'POST',
      url: endpoint,
      data,
      ...config
    });
  }

  async put<T>(endpoint: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>({
      method: 'PUT',
      url: endpoint,
      data,
      ...config
    });
  }

  async patch<T>(endpoint: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>({
      method: 'PATCH',
      url: endpoint,
      data,
      ...config
    });
  }

  async delete<T>(endpoint: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>({
      method: 'DELETE',
      url: endpoint,
      ...config
    });
  }

  async uploadFile<T>(endpoint: string, file: File, fieldName: string = 'file', type?: string): Promise<ApiResponse<T>> {
    const formData = new FormData();
    formData.append(fieldName, file);
    if (type) formData.append('type', type);

    return this.request<T>({
      method: 'POST',
      url: endpoint,
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  /**
   * Reset the singleton instance (for testing purposes only)
   * @internal
   */
  public static resetInstance(): void {
    if (process.env.NODE_ENV === 'test') {
      ApiService.instance = null as any;
    }
  }
}

// Export a default instance for convenience
export const apiService = ApiService.getInstance(); 