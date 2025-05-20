/**
 * API functions for seller to manage users with different access levels.
 * This file defines the interface for managing team members in a seller account.
 */

import { toast } from "sonner";
import { ApiService } from '@/services/api.service';
import { ApiResponse } from '@/types/api';
import { User, UserFilters } from '@/types/user';

const apiService = new ApiService();

// Types
export interface SellerTeamMember {
  id: string;
  name: string;
  email: string;
  contactNumber?: string;
  status: "active" | "inactive";
  createdAt: string;
  permissions: string[];
}

// Mock data for development
export const MOCK_TEAM_MEMBERS: SellerTeamMember[] = [
  {
    id: "1",
    name: "John Doe",
    email: "john@example.com",
    contactNumber: "+1234567890",
    status: "active",
    createdAt: "2023-05-15T10:30:00Z",
    permissions: ["Dashboard access", "Order", "Shipments", "Manifest"]
  },
  {
    id: "2",
    name: "Jane Smith",
    email: "jane@example.com",
    status: "active",
    createdAt: "2023-07-22T14:45:00Z",
    permissions: ["Dashboard access", "Order"]
  },
  {
    id: "3",
    name: "Mike Johnson",
    email: "mike@example.com",
    status: "inactive",
    createdAt: "2023-03-10T09:15:00Z",
    permissions: ["Dashboard access"]
  },
  {
    id: "4",
    name: "Sarah Wilson",
    email: "sarah@example.com",
    status: "active",
    createdAt: "2023-08-05T16:20:00Z",
    permissions: ["Dashboard access", "Support", "Warehouse"]
  }
];

/**
 * Fetch all team members for the current seller
 */
export const fetchTeamMembers = async (): Promise<SellerTeamMember[]> => {
  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // In production, this would be an API call:
    // const response = await fetch('/api/seller/team-members');
    // if (!response.ok) throw new Error('Failed to fetch team members');
    // return await response.json();

    // For development, return mock data
    return MOCK_TEAM_MEMBERS;
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
    await new Promise(resolve => setTimeout(resolve, 800));

    // In production, this would be an API call:
    // const response = await fetch('/api/seller/team-members', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(member)
    // });
    // if (!response.ok) throw new Error('Failed to add team member');
    // return await response.json();

    // For development, simulate creating a new member
    const { password, ...memberData } = member; // Extract password from member data
    const newMember: SellerTeamMember = {
      id: String(Math.floor(Math.random() * 1000)),
      ...memberData,
      createdAt: new Date().toISOString()
    };

    // Update mock data (would be handled by the backend in production)
    MOCK_TEAM_MEMBERS.push(newMember);

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
    await new Promise(resolve => setTimeout(resolve, 500));

    // In production, this would be an API call:
    // const response = await fetch(`/api/seller/team-members/${id}`, {
    //   method: 'PATCH',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(updates)
    // });
    // if (!response.ok) throw new Error('Failed to update team member');
    // return await response.json();

    // For development, update the mock data
    const index = MOCK_TEAM_MEMBERS.findIndex(member => member.id === id);
    if (index === -1) {
      throw new Error(`Team member with ID ${id} not found`);
    }

    const updatedMember = {
      ...MOCK_TEAM_MEMBERS[index],
      ...updates
    };

    MOCK_TEAM_MEMBERS[index] = updatedMember;
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
    await new Promise(resolve => setTimeout(resolve, 500));

    // In production, this would be an API call:
    // const response = await fetch(`/api/seller/team-members/${id}`, {
    //   method: 'DELETE'
    // });
    // if (!response.ok) throw new Error('Failed to delete team member');

    // For development, update the mock data
    const index = MOCK_TEAM_MEMBERS.findIndex(member => member.id === id);
    if (index === -1) {
      throw new Error(`Team member with ID ${id} not found`);
    }

    MOCK_TEAM_MEMBERS.splice(index, 1);
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
    await new Promise(resolve => setTimeout(resolve, 500));

    // In production, this would be an API call:
    // const response = await fetch(`/api/seller/team-members/${id}/reset-password`, {
    //   method: 'POST'
    // });
    // if (!response.ok) throw new Error('Failed to reset team member password');

    // For development, no actual action needed
    console.log(`Password reset initiated for team member ${id}`);
  } catch (error) {
    console.error(`Error resetting password for team member ${id}:`, error);
    toast.error("Failed to reset password. Please try again.");
    throw error;
  }
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
            return response;
        } catch (error) {
            throw new Error('Failed to delete user');
        }
    }
}; 