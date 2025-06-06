import { getStoredTeamMembers } from '@/lib/api/seller-users';
import { ApiError } from '@/types/api';
import { toast } from 'sonner';
import { ApiResponse, Seller } from '../types/api';
import { apiService } from './api.service';
import { sellerAuthService } from './seller-auth.service';

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

// Extended interface for team member profile display
export interface TeamMemberProfile extends Seller {
  isTeamMember: boolean;
  jobRole?: string;
  parentSellerName?: string;
  parentSellerId?: string;
  teamMemberPermissions?: string[];
}

export class ProfileService {
  constructor() {
    // Use singleton instance
  }

  async getProfile(): Promise<ApiResponse<Seller | TeamMemberProfile>> {
    try {
      // Check if current user is a team member
      const currentUser = await sellerAuthService.getCurrentUser();

      if (currentUser?.userType === 'team_member') {
        return await this.getTeamMemberProfile(currentUser);
      } else {
        // For main sellers, use the regular API call
        const response = await apiService.get<Seller>('/seller/profile');
        return response as ApiResponse<Seller>;
      }
    } catch (error) {
      const apiError = error as ApiError;
      toast.error(apiError.message || 'Failed to fetch profile');
      throw error;
    }
  }

  private async getTeamMemberProfile(currentUser: any): Promise<ApiResponse<TeamMemberProfile>> {
    try {
      // Get team member data from localStorage
      const teamMembers = getStoredTeamMembers();
      const teamMember = teamMembers.find(member => member.email === currentUser.email);

      if (!teamMember) {
        throw new Error('Team member profile not found');
      }

      // Get the main seller's name
      let parentSellerName = 'Main Seller Account'; // fallback

      // For team members, read from stored seller data instead of making API calls
      const cachedSellerData = localStorage.getItem('current_seller_data');
      if (cachedSellerData) {
        try {
          const sellerData = JSON.parse(cachedSellerData);
          if (sellerData.name) {
            parentSellerName = sellerData.name;
          } else if (sellerData.businessName) {
            parentSellerName = sellerData.businessName;
          }
          console.log('Using seller name from localStorage:', parentSellerName);
        } catch (parseError) {
          console.log('Error parsing cached seller data:', parseError);
        }
      } else {
        console.log('No seller data found in localStorage');
      }

      // Create a profile-like object for the team member
      const teamMemberProfile: TeamMemberProfile = {
        id: teamMember.id,
        name: teamMember.name,
        email: teamMember.email,
        phone: teamMember.contactNumber || '',
        role: 'seller', // Team members are part of the seller account
        companyName: `${teamMember.name} - ${teamMember.jobRole}`,
        companyCategory: 'Team Member',
        brandName: '',
        website: '',
        supportContact: teamMember.contactNumber || '',
        supportEmail: teamMember.email,
        operationsEmail: '',
        financeEmail: '',
        profileImage: '',
        storeLinks: {},
        address: {
          street: '',
          landmark: '',
          city: '',
          state: '',
          country: '',
          postalCode: ''
        },
        documents: {
          gstin: '',
          pan: '',
          aadhaar: '',
          documents: []
        },
        bankDetails: [],
        createdAt: teamMember.createdAt,
        updatedAt: teamMember.createdAt,
        status: teamMember.status === 'active' ? 'active' : 'inactive',
        // Team member specific fields
        isTeamMember: true,
        jobRole: teamMember.jobRole,
        parentSellerName: parentSellerName, // Now shows actual seller name
        parentSellerId: teamMember.sellerId,
        teamMemberPermissions: teamMember.permissions
      };

      return {
        data: teamMemberProfile,
        status: 200,
        message: 'Team member profile retrieved successfully',
        success: true
      };
    } catch (error) {
      console.error('Error fetching team member profile:', error);
      throw new Error('Failed to fetch team member profile');
    }
  }

  async updateProfile(profileData: Partial<Seller>): Promise<ApiResponse<Seller>> {
    try {
      const response = await apiService.put<Seller>('/seller/profile', profileData);
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

      const response = await apiService.post<UploadResponse>('/seller/profile/documents', formData);
      return response;
    } catch (error) {
      const apiError = error as ApiError;
      toast.error(apiError.message || 'Failed to upload document');
      throw error;
    }
  }

  async updateBankDetails(bankDetails: any): Promise<ApiResponse<any>> {
    try {
      const response = await apiService.patch<any>('/seller/profile/bank-details', bankDetails);
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

      const response = await apiService.post<{ imageUrl: string }>('/seller/profile/image', formData);
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
      const response = await apiService.put<Seller>('/seller/profile/store-links', { storeLinks: links });
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
      const response = await apiService.patch<ApiResponse<any>>('/seller/profile/company-details', data);
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
