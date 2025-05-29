import { toast } from 'sonner';
import { Seller, ApiResponse } from '../types/api';
import { ApiService } from './api.service';
import { ApiError } from '@/types/api';

export type DocumentType = string;

export interface UploadResponse {
    url: string;
    filename: string;
    mimeType: string;
    size: number;
    uploadedAt: string;
}

export interface CompanyDetails {
    companyCategory: string;
    address: {
        address1: string;
        address2?: string;
        city: string;
        state: string;
        pincode: string;
        country: string;
    };
    documents: {
        gstin: {
            number: string;
            url: string;
        };
        pan: {
            number: string;
            url: string;
        };
        aadhaar: {
            number: string;
            url: string;
        };
    };
}

export class ProfileService {
    private apiService: ApiService;

    constructor() {
        this.apiService = new ApiService();
    }

    async getProfile(): Promise<ApiResponse<Seller>> {
        try {
            const response = await this.apiService.get<Seller>('/seller/profile');
            return response as ApiResponse<Seller>;
        } catch (error) {
            const apiError = error as ApiError;
            toast.error(apiError.message || 'Failed to fetch profile');
            throw error;
        }
    }

    async updateProfile(profileData: Partial<Seller>): Promise<ApiResponse<Seller>> {
        try {
            const response = await this.apiService.put<Seller>('/seller/profile', profileData);
            toast.success('Profile updated successfully');
            return response as ApiResponse<Seller>;
        } catch (error) {
            const apiError = error as ApiError;
            toast.error(apiError.message || 'Failed to update profile');
            throw error;
        }
    }

    async uploadDocument(file: File, type: DocumentType): Promise<ApiResponse<UploadResponse>> {
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('type', type);
            
            const response = await this.apiService.post<UploadResponse>('/seller/profile/documents', formData);
            return response;
        } catch (error) {
            const apiError = error as ApiError;
            toast.error(apiError.message || 'Failed to upload document');
            throw error;
        }
    }

    async updateBankDetails(bankDetails: any): Promise<ApiResponse<any>> {
        try {
            const response = await this.apiService.put<any>('/seller/profile/bank-details', bankDetails);
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
            
            const response = await this.apiService.post<{ imageUrl: string }>('/seller/profile/image', formData);
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
            const response = await this.apiService.put<Seller>('/seller/profile/store-links', { storeLinks: links });
            toast.success('Store links updated successfully');
            return response as ApiResponse<Seller>;
        } catch (error) {
            const apiError = error as ApiError;
            toast.error(apiError.message || 'Failed to update store links');
            throw error;
        }
    }

    async updateCompanyDetails(data: CompanyDetails): Promise<ApiResponse<any>> {
        try {
            console.log("Sending data to API:", data);
            const response = await this.apiService.patch<ApiResponse<any>>('/seller/profile/company-details', data);
            console.log("API response received:", response);
            return response;
        } catch (error) {
            const apiError = error as ApiError;
            console.error("API error:", apiError);
            toast.error(apiError.message || 'Failed to update company details');
            throw error;
        }
    }
}

export const profileService = new ProfileService(); 