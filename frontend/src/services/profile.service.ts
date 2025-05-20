import { toast } from 'sonner';
import { Seller, ApiResponse } from '../types/api';
import { ApiService } from './api.service';
import { ApiError } from '@/types/api';

export class ProfileService {
    private apiService: ApiService;

    constructor() {
        this.apiService = new ApiService();
    }

    async getProfile(): Promise<ApiResponse<Seller>> {
        try {
            const response = await this.apiService.get<Seller>('/api/profile');
            return response as ApiResponse<Seller>;
        } catch (error) {
            const apiError = error as ApiError;
            toast.error(apiError.message || 'Failed to fetch profile');
            throw error;
        }
    }

    async updateProfile(profileData: Partial<Seller>): Promise<ApiResponse<Seller>> {
        try {
            const response = await this.apiService.put<Seller>('/api/profile', profileData);
            toast.success('Profile updated successfully');
            return response as ApiResponse<Seller>;
        } catch (error) {
            const apiError = error as ApiError;
            toast.error(apiError.message || 'Failed to update profile');
            throw error;
        }
    }

    async uploadDocument(file: File, type: string): Promise<ApiResponse<any>> {
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('type', type);
            
            const response = await this.apiService.post<any>('/api/profile/documents', formData);
            toast.success('Document uploaded successfully');
            return response;
        } catch (error) {
            const apiError = error as ApiError;
            toast.error(apiError.message || 'Failed to upload document');
            throw error;
        }
    }

    async updateBankDetails(bankDetails: any): Promise<ApiResponse<any>> {
        try {
            const response = await this.apiService.put<any>('/api/profile/bank-details', bankDetails);
            toast.success('Bank details updated successfully');
            return response;
        } catch (error) {
            const apiError = error as ApiError;
            toast.error(apiError.message || 'Failed to update bank details');
            throw error;
        }
    }

    async updateProfileImage(file: File): Promise<ApiResponse<{ imageUrl: string }>> {
        try {
            const formData = new FormData();
            formData.append('image', file);
            
            const response = await this.apiService.post<{ imageUrl: string }>('/api/profile/image', formData);
            toast.success('Profile image updated successfully');
            return response;
        } catch (error) {
            const apiError = error as ApiError;
            toast.error(apiError.message || 'Failed to update profile image');
            throw error;
        }
    }

    async updateStoreLinks(links: Seller['storeLinks']): Promise<ApiResponse<Seller>> {
        try {
            const response = await this.apiService.put<Seller>('/api/profile/store-links', { storeLinks: links });
            toast.success('Store links updated successfully');
            return response as ApiResponse<Seller>;
        } catch (error) {
            const apiError = error as ApiError;
            toast.error(apiError.message || 'Failed to update store links');
            throw error;
        }
    }
}

export const profileService = new ProfileService(); 