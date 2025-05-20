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

// Mock data for development
const MOCK_SELLERS: SellerUser[] = [
  {
    id: "1",
    userId: "SELLER001",
    name: "John Smith",
    email: "john.smith@example.com",
    phone: "+91 9876543210",
    status: "Active",
    registrationDate: "2023-05-15",
    lastActive: "2023-10-25",
    companyName: "Smith Enterprises",
    companyCategory: "Electronics",
    paymentType: "wallet",
    rateBand: "Standard",
    kycStatus: "Verified",
    documentApprovals: {
      pan: "Verified",
      gst: "Verified",
      identity: "Verified",
      bankDetails: "Verified"
    }
  },
  {
    id: "2",
    userId: "SELLER002",
    name: "Sarah Johnson",
    email: "sarah.j@example.com",
    phone: "+91 9876543211",
    status: "Active",
    registrationDate: "2023-06-22",
    lastActive: "2023-10-24",
    companyName: "Johnson Retail",
    companyCategory: "Fashion",
    paymentType: "credit",
    rateBand: "Premium",
    creditLimit: 50000,
    creditPeriod: 30,
    kycStatus: "Verified",
    documentApprovals: {
      pan: "Verified",
      gst: "Verified",
      identity: "Verified",
      bankDetails: "Verified"
    }
  },
  {
    id: "3",
    userId: "SELLER003",
    name: "Michael Brown",
    email: "michael.b@example.com",
    phone: "+91 9876543212",
    status: "Inactive",
    registrationDate: "2023-04-10",
    lastActive: "2023-07-30",
    companyName: "Brown Industries",
    companyCategory: "Home & Kitchen",
    paymentType: "wallet",
    rateBand: "Basic",
    kycStatus: "Rejected",
    documentApprovals: {
      pan: "Verified",
      gst: "Rejected",
      identity: "Verified",
      bankDetails: "Verified"
    }
  }
];

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
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // In production, this would be an API call:
    // const params = new URLSearchParams({
    //   page: page.toString(),
    //   pageSize: pageSize.toString(),
    //   query: searchQuery,
    //   status: status || '',
    //   sortField,
    //   sortOrder
    // });
    // const response = await fetch(`/api/admin/sellers?${params}`);
    // if (!response.ok) throw new Error('Failed to fetch sellers');
    // return await response.json();

    // For development, filter and sort mock data
    let filteredSellers = [...MOCK_SELLERS];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filteredSellers = filteredSellers.filter(
        seller =>
          seller.name.toLowerCase().includes(query) ||
          seller.email.toLowerCase().includes(query) ||
          seller.userId.toLowerCase().includes(query) ||
          seller.companyName.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (status && status !== "all") {
      filteredSellers = filteredSellers.filter(
        seller => seller.status.toLowerCase() === status.toLowerCase()
      );
    }

    // Apply sorting
    filteredSellers.sort((a, b) => {
      const aValue = String((a as any)[sortField] || "");
      const bValue = String((b as any)[sortField] || "");
      
      return sortOrder === "asc"
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    });

    // Apply pagination
    const startIndex = (page - 1) * pageSize;
    const paginatedSellers = filteredSellers.slice(
      startIndex,
      startIndex + pageSize
    );

    return {
      sellers: paginatedSellers,
      totalCount: filteredSellers.length
    };
  } catch (error) {
    console.error("Error fetching sellers:", error);
    throw error;
  }
};

/**
 * Fetch a single seller by ID
 */
export const fetchSellerById = async (id: string): Promise<SellerUser> => {
  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // In production, this would be an API call:
    // const response = await fetch(`/api/admin/sellers/${id}`);
    // if (!response.ok) throw new Error('Failed to fetch seller details');
    // return await response.json();

    // For development, use mock data
    const seller = MOCK_SELLERS.find(
      s => s.id === id || s.userId.toLowerCase() === id.toLowerCase()
    );

    if (!seller) {
      throw new Error(`Seller with ID ${id} not found`);
    }

    return seller;
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
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));

    // In production, this would be an API call:
    // const response = await fetch(`/api/admin/sellers/${id}/status`, {
    //   method: 'PATCH',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ status })
    // });
    // if (!response.ok) throw new Error('Failed to update seller status');

    // For development, just log the change
    console.log(`Updated seller ${id} status to ${status}`);
    toast.success(`Seller status updated to ${status}`);

    return;
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