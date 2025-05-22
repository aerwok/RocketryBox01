import { useState, useEffect } from 'react';
import { AuthService } from '@/services/auth.service';
import { secureStorage } from '@/utils/secureStorage';

interface AuthState {
    token: string | null;
    isAuthenticated: boolean;
}

export const useAuth = () => {
    const [authState, setAuthState] = useState<AuthState>({
        token: null,
        isAuthenticated: false
    });

    useEffect(() => {
        const checkAuth = async () => {
            const token = await secureStorage.getItem('auth_token');
            setAuthState({
                token,
                isAuthenticated: !!token
            });
        };
        checkAuth();
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
            
            if (response.data?.accessToken) {
                await secureStorage.setItem('auth_token', response.data.accessToken);
                setAuthState({
                    token: response.data.accessToken,
                    isAuthenticated: true
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
            await secureStorage.removeItem('auth_token');
            setAuthState({
                token: null,
                isAuthenticated: false
            });
        } catch (error) {
            console.error('Logout error:', error);
            throw error;
        }
    };

    return {
        token: authState.token,
        isAuthenticated: authState.isAuthenticated,
        login,
        logout
    };
}; 