import { useState, useEffect } from 'react';
import { AuthService } from '@/services/auth.service';
import axios from 'axios';

interface AuthState {
    isAuthenticated: boolean;
    user: any | null;
    loading: boolean;
}

export const useAuth = () => {
    const [authState, setAuthState] = useState<AuthState>({
        isAuthenticated: false,
        user: null,
        loading: true
    });

    const checkAuthStatus = async () => {
        try {
            // Make a request to check if user is authenticated
            const response = await axios.get('/api/v2/customer/auth/check', { 
                withCredentials: true 
            });
            
            setAuthState({
                isAuthenticated: response.data.success,
                user: response.data.data?.user || null,
                loading: false
            });
            
            return response.data.success;
        } catch (error) {
            console.error('Auth check error:', error);
            setAuthState({
                isAuthenticated: false,
                user: null,
                loading: false
            });
            return false;
        }
    };

    useEffect(() => {
        checkAuthStatus();
    }, []);

    const login = async (phoneOrEmail: string, password: string, rememberMe: boolean = false) => {
        try {
            console.log('=== useAuth Login ===');
            console.log('Login attempt with:', { phoneOrEmail, rememberMe });
            
            const authService = new AuthService();
            const response = await authService.login({
                phoneOrEmail,
                password,
                rememberMe
            });
            
            console.log('=== useAuth Response ===');
            console.log('Response:', {
                success: response.success,
                hasToken: !!response.data?.accessToken,
                hasUser: !!response.data?.user
            });
            
            if (response.success) {
                setAuthState({
                    isAuthenticated: true,
                    user: response.data?.user || null,
                    loading: false
                });
            }
            
            return response;
        } catch (error) {
            console.error('=== useAuth Error ===');
            console.error('Login error:', error);
            throw error;
        }
    };

    const logout = async () => {
        try {
            const authService = new AuthService();
            await authService.logout();
            setAuthState({
                isAuthenticated: false,
                user: null,
                loading: false
            });
        } catch (error) {
            console.error('Logout error:', error);
            throw error;
        }
    };

    return {
        isAuthenticated: authState.isAuthenticated,
        user: authState.user,
        loading: authState.loading,
        login,
        logout,
        checkAuthStatus
    };
}; 