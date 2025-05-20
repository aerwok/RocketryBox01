export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Add a check to ensure the API is accessible
export const checkApiConnection = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/health`);
        if (!response.ok) {
            throw new Error('API is not responding');
        }
        return true;
    } catch (error) {
        console.error('API connection error:', error);
        return false;
    }
}; 