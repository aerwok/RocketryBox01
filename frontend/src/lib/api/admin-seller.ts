/**
 * API functions for admin to interact with seller accounts.
 * This file defines the interface between the admin dashboard and seller data.
 */

import { toast } from "sonner";
import { ApiService } from '@/services/api.service';
import { ApiResponse } from '@/types/api';
import { User, UserFilters } from '@/types/user';

const apiService = new ApiService();

// Types
export interface SellerUser {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  status: "Active" | "Inactive" | "Pending" | "Suspended";
  registrationDate: string;
  lastActive: string;
  companyName: string;
  companyCategory: string;
  paymentType: "wallet" | "credit";
  rateBand: string;
  creditLimit?: number;
  creditPeriod?: number;
  kycStatus: "Pending" | "Verified" | "Rejected";
  documentApprovals: {
    pan: "Pending" | "Verified" | "Rejected";
    gst: "Pending" | "Verified" | "Rejected";
    identity: "Pending" | "Verified" | "Rejected";
    bankDetails: "Pending" | "Verified" | "Rejected";
  };
}

/**
 * Fetch all sellers with optional filtering and pagination
 */
export const fetchSellers = async (
  page: number = 1,
  pageSize: number = 10,
  searchQuery: string = "",
  status?: string,
  sortField: string = "userId",
  sortOrder: "asc" | "desc" = "asc"
): Promise<{ sellers: SellerUser[]; totalCount: number }> => {
  try {
    // Use real API call through ServiceFactory
    const response = await apiService.get('/admin/users/sellers', {
      page: page.toString(),
      limit: pageSize.toString(),
      search: searchQuery,
      status: status || '',
      sortField,
      sortOrder
    });

    if (response.success && response.data) {
      const data = response.data as any;
      // Transform backend data to match SellerUser interface
      const transformedSellers = (data.sellers || data.users || []).map((seller: any) => ({
        id: seller.id || seller._id,
        userId: seller.userId || seller.id || seller._id,
        name: seller.name || '',
        email: seller.email || '',
        phone: seller.phone || seller.mobile || '',
        status: seller.status || 'Active',
        registrationDate: seller.createdAt ? new Date(seller.createdAt).toISOString().split('T')[0] : '',
        lastActive: seller.lastActive ? new Date(seller.lastActive).toISOString().split('T')[0] : '',
        companyName: seller.businessName || seller.companyName || '',
        companyCategory: seller.companyCategory || '',
        paymentType: seller.paymentType || 'wallet',
        rateBand: seller.rateBand || 'Standard',
        creditLimit: seller.creditLimit,
        creditPeriod: seller.creditPeriod,
        kycStatus: seller.kycVerified ? 'Verified' : 'Pending',
        documentApprovals: {
          pan: 'Pending',
          gst: 'Pending', 
          identity: 'Pending',
          bankDetails: 'Pending'
        }
      }));

      return {
        sellers: transformedSellers,
        totalCount: data.pagination?.totalResults || transformedSellers.length
      };
    } else {
      throw new Error('Failed to fetch sellers');
    }
  } catch (error) {
    console.error('Error fetching sellers:', error);
    toast.error('Failed to load sellers');
    
    // Return empty data instead of mock data
    return {
      sellers: [],
      totalCount: 0
    };
  }
};

/**
 * Fetch a single seller by ID
 */
export const fetchSellerById = async (id: string): Promise<SellerUser> => {
  try {
    // Use real API call
    const response = await apiService.get(`/admin/users/${id}`);

    if (response.success && response.data) {
      const seller = response.data as any;
      
      // Transform backend data to match SellerUser interface
      return {
        id: seller.id || seller._id,
        userId: seller.userId || seller.id || seller._id,
        name: seller.name || '',
        email: seller.email || '',
        phone: seller.phone || seller.mobile || '',
        status: seller.status || 'Active',
        registrationDate: seller.createdAt ? new Date(seller.createdAt).toISOString().split('T')[0] : '',
        lastActive: seller.lastActive ? new Date(seller.lastActive).toISOString().split('T')[0] : '',
        companyName: seller.businessName || seller.companyName || '',
        companyCategory: seller.companyCategory || '',
        paymentType: seller.paymentType || 'wallet',
        rateBand: seller.rateBand || 'Standard',
        creditLimit: seller.creditLimit,
        creditPeriod: seller.creditPeriod,
        kycStatus: seller.kycVerified ? 'Verified' : 'Pending',
        documentApprovals: {
          pan: 'Pending',
          gst: 'Pending',
          identity: 'Pending',
          bankDetails: 'Pending'
        }
      };
    } else {
      throw new Error(`Seller with ID ${id} not found`);
    }
  } catch (error) {
    console.error(`Error fetching seller ${id}:`, error);
    throw error;
  }
};

/**
 * Update seller status
 */
export const updateSellerStatus = async (
  id: string,
  status: "Active" | "Inactive" | "Pending" | "Suspended"
): Promise<void> => {
  try {
    // Use real API call
    const response = await apiService.patch(`/admin/users/${id}/status`, { status });

    if (response.success) {
      toast.success(`Seller status updated to ${status}`);
    } else {
      throw new Error('Failed to update seller status');
    }
  } catch (error) {
    console.error(`Error updating seller ${id} status:`, error);
    toast.error("Failed to update seller status");
    throw error;
  }
};

/**
 * Update seller payment terms
 */
export const updateSellerPaymentTerms = async (
  id: string,
  paymentType: "wallet" | "credit",
  rateBand: string,
  creditLimit?: number,
  creditPeriod?: number
): Promise<void> => {
  try {
    // Validate credit parameters if payment type is credit
    if (paymentType === "credit") {
      if (!creditLimit || creditLimit <= 0) {
        throw new Error("Credit limit must be a positive number");
      }
      if (!creditPeriod || creditPeriod <= 0) {
        throw new Error("Credit period must be a positive number");
      }
    }

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));

    // In production, this would be an API call:
    // const response = await fetch(`/api/admin/sellers/${id}/payment-terms`, {
    //   method: 'PATCH',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ 
    //     paymentType,
    //     rateBand,
    //     creditLimit,
    //     creditPeriod
    //   })
    // });
    // if (!response.ok) throw new Error('Failed to update payment terms');

    // For development, just log the change
    console.log(`Updated seller ${id} payment terms:`, {
      paymentType,
      rateBand,
      creditLimit,
      creditPeriod
    });
    toast.success("Payment terms updated successfully");

    return;
  } catch (error) {
    console.error(`Error updating seller ${id} payment terms:`, error);
    toast.error("Failed to update payment terms");
    throw error;
  }
};

/**
 * Update seller KYC document status
 */
export const updateDocumentStatus = async (
  sellerId: string,
  documentType: "pan" | "gst" | "identity" | "bankDetails",
  status: "Verified" | "Rejected",
): Promise<void> => {
  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));

    // In production, this would be an API call:
    // const response = await fetch(`/api/admin/sellers/${sellerId}/documents/${documentType}`, {
    //   method: 'PATCH',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ status, remarks })
    // });
    // if (!response.ok) throw new Error('Failed to update document status');

    // For development, just log the change
    console.log(`Updated seller ${sellerId} document ${documentType} status to ${status}`);
    toast.success(`Document status updated to ${status}`);

    return;
  } catch (error) {
    console.error(`Error updating document status:`, error);
    toast.error("Failed to update document status");
    throw error;
  }
};

export const adminSellerApi = {
    async getSellers(filters?: UserFilters): Promise<ApiResponse<User[]>> {
        try {
            const response = await apiService.get<User[]>('/admin/sellers', {
                params: filters
            });
            return response;
        } catch (error) {
            throw new Error('Failed to fetch sellers');
        }
    },

    async getSellerById(id: string): Promise<ApiResponse<User>> {
        try {
            const response = await apiService.get<User>(`/admin/sellers/${id}`);
            return response;
        } catch (error) {
            throw new Error('Failed to fetch seller');
        }
    },

    async createSeller(sellerData: Partial<User>): Promise<ApiResponse<User>> {
        try {
            const response = await apiService.post<User>('/admin/sellers', sellerData);
            return response;
        } catch (error) {
            throw new Error('Failed to create seller');
        }
    },

    async updateSeller(id: string, sellerData: Partial<User>): Promise<ApiResponse<User>> {
        try {
            const response = await apiService.put<User>(`/admin/sellers/${id}`, sellerData);
            return response;
        } catch (error) {
            throw new Error('Failed to update seller');
        }
    },

    async deleteSeller(id: string): Promise<ApiResponse<void>> {
        try {
            const response = await apiService.delete<void>(`/admin/sellers/${id}`);
            return response;
        } catch (error) {
            throw new Error('Failed to delete seller');
        }
    },

    async verifySellerDocuments(id: string, documentType: string, status: 'verified' | 'rejected'): Promise<ApiResponse<User>> {
        try {
            const response = await apiService.put<User>(`/admin/sellers/${id}/documents/${documentType}`, { status });
            return response;
        } catch (error) {
            throw new Error('Failed to verify seller documents');
        }
    },

    async verifySellerBankDetails(id: string, bankId: string, status: 'verified' | 'rejected'): Promise<ApiResponse<User>> {
        try {
            const response = await apiService.put<User>(`/admin/sellers/${id}/bank-details/${bankId}`, { status });
            return response;
        } catch (error) {
            throw new Error('Failed to verify seller bank details');
        }
    }
}; 