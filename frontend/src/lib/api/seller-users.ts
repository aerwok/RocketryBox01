/**
 * API functions for seller to manage users with different access levels.
 * This file defines the interface for managing team members in a seller account.
 */

import { toast } from "sonner";
import { apiService } from '@/services/api.service';
import { ApiResponse } from '@/types/api';
import { User, UserFilters } from '@/types/user';
import { sellerAuthService } from '@/services/seller-auth.service';

// Job role definitions
export type JobRole = 'Manager' | 'Support' | 'Finance';

// Types
export interface SellerTeamMember {
  id: string;
  name: string;
  email: string;
  contactNumber?: string;
  jobRole: JobRole;
  status: "active" | "inactive";
  createdAt: string;
  permissions: string[];
  sellerId?: string; // ID of the parent seller
}

// Role-based permission presets
export const ROLE_PERMISSIONS: Record<JobRole, string[]> = {
  Manager: [
    "Dashboard access",
    "Order",
    "Shipments", 
    "Manifest",
    "Received",
    "New Order",
    "NDR List",
    "Weight Dispute",
    "Support",
    "Warehouse",
    "Service",
    "Items & SKU",
    "Stores",
    "Priority",
    "Label"
  ],
  Support: [
    "Dashboard access",
    "Order",
    "Shipments",
    "NDR List",
    "Weight Dispute", 
    "Support",
    "Warehouse",
    "Service"
  ],
  Finance: [
    "Dashboard access",
    "Order",
    "Fright",
    "Wallet",
    "Invoice",
    "Ledger",
    "COD Remittance"
  ]
};

// Storage key for localStorage
const STORAGE_KEY = 'seller_team_members';

// Helper function to get current seller ID
const getCurrentSellerId = async (): Promise<string> => {
  try {
    const currentUser = await sellerAuthService.getCurrentUser();
    if (currentUser?.userType === 'seller') {
      return currentUser.id;
    } else if (currentUser?.userType === 'team_member') {
      return currentUser.parentSellerId || 'seller_main';
    }
    return 'seller_main'; // Fallback
  } catch (error) {
    console.error('Error getting current seller ID:', error);
    return 'seller_main'; // Fallback
  }
};

// Helper functions for localStorage persistence
export const getStoredTeamMembers = (): SellerTeamMember[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error reading team members from localStorage:', error);
    return [];
  }
};

const saveTeamMembers = (members: SellerTeamMember[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(members));
  } catch (error) {
    console.error('Error saving team members to localStorage:', error);
  }
};

/**
 * Fetch all team members for the current seller
 */
export const fetchTeamMembers = async (): Promise<SellerTeamMember[]> => {
  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));

    // In production, this would be an API call:
    // const response = await fetch('/api/seller/team-members');
    // if (!response.ok) throw new Error('Failed to fetch team members');
    // return await response.json();

    // Return persisted data from localStorage
    return getStoredTeamMembers();
  } catch (error) {
    console.error("Error fetching team members:", error);
    toast.error("Failed to load team members. Please try again.");
    throw error;
  }
};

/**
 * Add a new team member
 */
export const addTeamMember = async (
  member: Omit<SellerTeamMember, "id" | "createdAt"> & { password: string }
): Promise<SellerTeamMember> => {
  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // In production, this would be an API call:
    // const response = await fetch('/api/seller/team-members', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(member)
    // });
    // if (!response.ok) throw new Error('Failed to add team member');
    // return await response.json();

    // Create new member with unique ID
    const { password, ...memberData } = member;
    const newMember: SellerTeamMember = {
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...memberData,
      createdAt: new Date().toISOString(),
      sellerId: await getCurrentSellerId() // Get from current user context
    };

    // Get current members, add new one, and save back to localStorage
    const currentMembers = getStoredTeamMembers();
    const updatedMembers = [...currentMembers, newMember];
    saveTeamMembers(updatedMembers);

    return newMember;
  } catch (error) {
    console.error("Error adding team member:", error);
    toast.error("Failed to add team member. Please try again.");
    throw error;
  }
};

/**
 * Update team member details
 */
export const updateTeamMember = async (
  id: string,
  updates: Partial<Omit<SellerTeamMember, "id" | "createdAt">>
): Promise<SellerTeamMember> => {
  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));

    // In production, this would be an API call:
    // const response = await fetch(`/api/seller/team-members/${id}`, {
    //   method: 'PATCH',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(updates)
    // });
    // if (!response.ok) throw new Error('Failed to update team member');
    // return await response.json();

    // Get current members from localStorage
    const currentMembers = getStoredTeamMembers();
    const index = currentMembers.findIndex(member => member.id === id);
    if (index === -1) {
      throw new Error(`Team member with ID ${id} not found`);
    }

    const updatedMember = {
      ...currentMembers[index],
      ...updates
    };

    // Update the member and save back to localStorage
    const updatedMembers = [...currentMembers];
    updatedMembers[index] = updatedMember;
    saveTeamMembers(updatedMembers);

    return updatedMember;
  } catch (error) {
    console.error(`Error updating team member ${id}:`, error);
    toast.error("Failed to update team member. Please try again.");
    throw error;
  }
};

/**
 * Delete a team member
 */
export const deleteTeamMember = async (id: string): Promise<void> => {
  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));

    // In production, this would be an API call:
    // const response = await fetch(`/api/seller/team-members/${id}`, {
    //   method: 'DELETE'
    // });
    // if (!response.ok) throw new Error('Failed to delete team member');

    // Get current members from localStorage
    const currentMembers = getStoredTeamMembers();
    const index = currentMembers.findIndex(member => member.id === id);
    if (index === -1) {
      throw new Error(`Team member with ID ${id} not found`);
    }

    // Remove the member and save back to localStorage
    const updatedMembers = currentMembers.filter(member => member.id !== id);
    saveTeamMembers(updatedMembers);
  } catch (error) {
    console.error(`Error deleting team member ${id}:`, error);
    toast.error("Failed to delete team member. Please try again.");
    throw error;
  }
};

/**
 * Reset team member password
 */
export const resetTeamMemberPassword = async (id: string): Promise<void> => {
  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));

    // In production, this would be an API call:
    // const response = await fetch(`/api/seller/team-members/${id}/reset-password`, {
    //   method: 'POST'
    // });
    // if (!response.ok) throw new Error('Failed to reset team member password');

    console.log(`Password reset initiated for team member ${id}`);
  } catch (error) {
    console.error(`Error resetting password for team member ${id}:`, error);
    toast.error("Failed to reset password. Please try again.");
    throw error;
  }
};

/**
 * Get role-based permission presets
 */
export const getRolePermissions = (role: JobRole): string[] => {
  return ROLE_PERMISSIONS[role] || [];
};

/**
 * Get available job roles
 */
export const getAvailableJobRoles = (): JobRole[] => {
  return Object.keys(ROLE_PERMISSIONS) as JobRole[];
};

export const sellerUsersApi = {
    async getUsers(filters?: UserFilters): Promise<ApiResponse<User[]>> {
        try {
            const response = await apiService.get<User[]>('/seller/users', {
                params: filters
            });
            return response;
        } catch (error) {
            throw new Error('Failed to fetch users');
        }
    },

    async getUserById(id: string): Promise<ApiResponse<User>> {
        try {
            const response = await apiService.get<User>(`/seller/users/${id}`);
            return response;
        } catch (error) {
            throw new Error('Failed to fetch user');
        }
    },

    async createUser(userData: Partial<User>): Promise<ApiResponse<User>> {
        try {
            const response = await apiService.post<User>('/seller/users', userData);
            return response;
        } catch (error) {
            throw new Error('Failed to create user');
        }
    },

    async updateUser(id: string, userData: Partial<User>): Promise<ApiResponse<User>> {
        try {
            const response = await apiService.put<User>(`/seller/users/${id}`, userData);
            return response;
        } catch (error) {
            throw new Error('Failed to update user');
        }
    },

    async deleteUser(id: string): Promise<ApiResponse<void>> {
        try {
            const response = await apiService.delete(`/seller/users/${id}`);
            return response as ApiResponse<void>;
        } catch (error) {
            throw new Error('Failed to delete user');
        }
    }
}; 