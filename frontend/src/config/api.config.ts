import axios from 'axios';
import { toast } from 'sonner';
import { secureStorage } from '../utils/secureStorage';

// API Configuration
export const API_CONFIG = {
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
    timeout: 10000,
    retries: 3,
    retryDelay: 1000,
    headers: {
        'Content-Type': 'application/json'
    }
};

// Create axios instance with default config
const api = axios.create(API_CONFIG);

// Request interceptor
api.interceptors.request.use(
    async (config) => {
        // Get token from secure storage
        const token = await secureStorage.getItem('auth_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        
        // Add CSRF token if available
        const csrfToken = await secureStorage.getItem('csrf_token');
        if (csrfToken) {
            config.headers['X-CSRF-Token'] = csrfToken;
        }
        
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        // Handle 401 Unauthorized
        if (error.response?.status === 401) {
            // Clear auth data from secure storage
            await secureStorage.removeItem('auth_token');
            await secureStorage.removeItem('refresh_token');
            await secureStorage.removeItem('csrf_token');
            // Redirect to login
            window.location.href = '/seller/login';
            return Promise.reject(error);
        }

        // Handle 403 Forbidden
        if (error.response?.status === 403) {
            toast.error('You do not have permission to perform this action');
            return Promise.reject(error);
        }

        // Handle network errors
        if (!error.response) {
            toast.error('Network error. Please check your connection.');
            return Promise.reject(error);
        }

        // Handle other errors
        const errorMessage = error.response?.data?.message || 'An error occurred';
        toast.error(errorMessage);
        return Promise.reject(error);
    }
);

export default api; 