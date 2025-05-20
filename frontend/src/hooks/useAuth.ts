import { useState, useEffect } from 'react';

interface AuthState {
    token: string | null;
    isAuthenticated: boolean;
}

export const useAuth = () => {
    const [authState, setAuthState] = useState<AuthState>({
        token: localStorage.getItem('token'),
        isAuthenticated: !!localStorage.getItem('token')
    });

    useEffect(() => {
        const token = localStorage.getItem('token');
        setAuthState({
            token,
            isAuthenticated: !!token
        });
    }, []);

    return {
        token: authState.token,
        isAuthenticated: authState.isAuthenticated
    };
}; 