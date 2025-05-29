import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { ApiResponse, ApiError } from '@/types/api';
import { secureStorage } from '@/utils/secureStorage';

export type { ApiResponse };
export class ApiService {
  private api: AxiosInstance;
  private navigate: ((path: string) => void) | null = null;
  
  // Request throttling to prevent rate limiting
  private requestThrottles: Record<string, number> = {};
  private readonly THROTTLE_INTERVAL = 2000; // 2 seconds between identical requests

  constructor() {
    // Get base domain without any path
    const baseDomain = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    const baseURL = `${baseDomain}/api/v2`;
    
    console.log('Initializing API service:', {
      baseDomain,
      baseURL
    });
    
    this.api = axios.create({
      baseURL,
      withCredentials: true, // Enable sending cookies with every request
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
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

          // Enhanced logging for debugging
          if (process.env.NODE_ENV === 'development') {
            console.log('Request:', {
              method: config.method?.toUpperCase(),
              baseURL: config.baseURL,
              url: config.url,
              fullUrl: `${config.baseURL}/${config.url}`,
              hasToken: !!token
            });
          }
          
          return config;
        } catch (error) {
          console.error('Error in request interceptor:', error);
          return config;
        }
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        console.error('API Error:', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message,
          url: error.config?.url,
          baseURL: error.config?.baseURL
        });
        
        if (error.response) {
          if (error.response.status === 401) {
            // Clear secure storage on unauthorized
            await secureStorage.removeItem('auth_token');
            await secureStorage.removeItem('user');
            
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
        console.log(`Throttling request to ${config.url} (too frequent)`);
        await new Promise(resolve => 
          setTimeout(resolve, this.THROTTLE_INTERVAL - (currentTime - lastRequestTime))
        );
      }
      
      // Update last request time
      this.requestThrottles[requestKey] = Date.now();
      
      // Make the request
      console.log('Making request:', {
        baseURL: this.api.defaults.baseURL,
        endpoint: config.url,
        method: config.method
      });

      const response = await this.api.request({
        ...config,
        withCredentials: true // Ensure cookies are sent with each request
      });

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Request failed:', {
          url: error.config?.url,
          baseURL: error.config?.baseURL,
          method: error.config?.method,
          status: error.response?.status
        });
        
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
} 