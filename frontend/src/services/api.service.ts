import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { ApiResponse, ApiError, RateLimitHeaders } from '@/types/api';
import { secureStorage } from '@/utils/secureStorage';

export type { ApiResponse };
export class ApiService {
  private api: AxiosInstance;
  private baseURL: string;

  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v2';
    
    this.api = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.api.interceptors.request.use(
      (config) => {
        const token = secureStorage.getItem('auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.api.interceptors.response.use(
      (response) => {
        // Handle rate limit headers
        const rateLimitHeaders: RateLimitHeaders = {
          'X-RateLimit-Limit': Number(response.headers['x-ratelimit-limit']),
          'X-RateLimit-Remaining': Number(response.headers['x-ratelimit-remaining']),
          'X-RateLimit-Reset': Number(response.headers['x-ratelimit-reset']),
        };

        // Check if rate limit is exceeded
        if (rateLimitHeaders['X-RateLimit-Remaining'] === 0) {
          const resetTime = new Date(rateLimitHeaders['X-RateLimit-Reset'] * 1000);
          throw new Error(`Rate limit exceeded. Please try again after ${resetTime.toLocaleTimeString()}`);
        }

        return response;
      },
      (error) => {
        if (error.response) {
          const apiError: ApiError = {
            message: error.response.data.message || 'An error occurred',
            code: error.response.data.code || 'SERVER_ERROR',
            status: error.response.status,
            details: error.response.data.details,
          };
          return Promise.reject(apiError);
        }
        return Promise.reject(error);
      }
    );
  }

  private async request<T>(config: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<ApiResponse<T>> = await this.api.request(config);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw {
          message: error.response?.data?.message || 'An error occurred',
          code: error.response?.data?.code || 'SERVER_ERROR',
          status: error.response?.status || 500,
          details: error.response?.data?.details,
        } as ApiError;
      }
      throw error;
    }
  }

  async get<T>(endpoint: string, params?: any): Promise<ApiResponse<T>> {
    return this.request<T>({
      method: 'GET',
      url: endpoint,
      params,
    });
  }

  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>({
      method: 'POST',
      url: endpoint,
      data,
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>({
      method: 'PUT',
      url: endpoint,
      data,
    });
  }

  async patch<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>({
      method: 'PATCH',
      url: endpoint,
      data,
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>({
      method: 'DELETE',
      url: endpoint,
    });
  }

  async uploadFile<T>(endpoint: string, file: File, type?: string): Promise<ApiResponse<T>> {
    const formData = new FormData();
    formData.append('file', file);
    if (type) {
      formData.append('type', type);
    }

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