/**
 * API functions for support ticket management.
 * This file defines the interface for managing support tickets between sellers and admin.
 */

import { toast } from "sonner";

// Types
export interface SupportTicket {
  id: string;
  subject: string;
  category: 'shipping' | 'billing' | 'technical' | 'account' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  description: string;
  status: "New" | "In Progress" | "Resolved";
  email: string;
  sellerId: string;
  sellerName: string;
  createdAt: string;
  updatedAt: string;
  message: string; // For admin table compatibility
}

export interface CreateTicketData {
  subject: string;
  category: SupportTicket['category'];
  priority: SupportTicket['priority'];
  description: string;
  email: string;
  sellerId: string;
  sellerName: string;
}

// Storage key for localStorage
const STORAGE_KEY = 'support_tickets';

// Helper functions for localStorage persistence
const getStoredTickets = (): SupportTicket[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error reading support tickets from localStorage:', error);
    return [];
  }
};

const saveTickets = (tickets: SupportTicket[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets));
  } catch (error) {
    console.error('Error saving support tickets to localStorage:', error);
  }
};

/**
 * Create a new support ticket
 */
export const createSupportTicket = async (ticketData: CreateTicketData): Promise<SupportTicket> => {
  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));

    // In production, this would be an API call:
    // const response = await fetch('/api/support/tickets', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(ticketData)
    // });
    // if (!response.ok) throw new Error('Failed to create support ticket');
    // return await response.json();

    // Create new ticket with unique ID
    const timestamp = new Date().toISOString();
    const newTicket: SupportTicket = {
      id: `ticket_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...ticketData,
      status: "New",
      createdAt: timestamp,
      updatedAt: timestamp,
      message: ticketData.description // For admin table compatibility
    };

    // Get current tickets, add new one, and save back to localStorage
    const currentTickets = getStoredTickets();
    const updatedTickets = [...currentTickets, newTicket];
    saveTickets(updatedTickets);

    return newTicket;
  } catch (error) {
    console.error("Error creating support ticket:", error);
    toast.error("Failed to create support ticket. Please try again.");
    throw error;
  }
};

/**
 * Get all support tickets (for admin)
 */
export const getAllTickets = async (page: number = 1, pageSize: number = 10): Promise<{
  tickets: SupportTicket[];
  totalCount: number;
}> => {
  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));

    // In production, this would be an API call:
    // const response = await fetch(`/api/support/tickets?page=${page}&pageSize=${pageSize}`);
    // if (!response.ok) throw new Error('Failed to fetch support tickets');
    // return await response.json();

    // Get all tickets from localStorage
    const allTickets = getStoredTickets();
    
    // Sort by creation date (newest first)
    const sortedTickets = allTickets.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // Apply pagination
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedTickets = sortedTickets.slice(startIndex, endIndex);

    return {
      tickets: paginatedTickets,
      totalCount: allTickets.length
    };
  } catch (error) {
    console.error("Error fetching support tickets:", error);
    throw error;
  }
};

/**
 * Get tickets for a specific seller
 */
export const getSellerTickets = async (sellerId: string): Promise<SupportTicket[]> => {
  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));

    // Get all tickets and filter by seller
    const allTickets = getStoredTickets();
    console.log('All tickets in storage:', allTickets.length);
    console.log('Looking for seller ID:', sellerId);
    
    const sellerTickets = allTickets.filter(ticket => {
      console.log(`Comparing ticket seller ID "${ticket.sellerId}" with "${sellerId}"`);
      return ticket.sellerId === sellerId;
    });
    
    console.log('Found seller tickets:', sellerTickets.length);
    console.log('Seller tickets:', sellerTickets);
    
    // Sort by creation date (newest first)
    const sortedTickets = sellerTickets.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    
    return sortedTickets;
  } catch (error) {
    console.error("Error fetching seller tickets:", error);
    throw error;
  }
};

/**
 * Update ticket status (for admin)
 */
export const updateTicketStatus = async (ticketId: string, status: SupportTicket['status']): Promise<SupportTicket> => {
  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));

    // In production, this would be an API call:
    // const response = await fetch(`/api/support/tickets/${ticketId}/status`, {
    //   method: 'PATCH',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ status })
    // });
    // if (!response.ok) throw new Error('Failed to update ticket status');
    // return await response.json();

    // Get current tickets from localStorage
    const currentTickets = getStoredTickets();
    const ticketIndex = currentTickets.findIndex(ticket => ticket.id === ticketId);
    
    if (ticketIndex === -1) {
      throw new Error(`Ticket with ID ${ticketId} not found`);
    }

    // Update the ticket status and timestamp
    const updatedTicket = {
      ...currentTickets[ticketIndex],
      status,
      updatedAt: new Date().toISOString()
    };

    // Update the tickets array and save back to localStorage
    const updatedTickets = [...currentTickets];
    updatedTickets[ticketIndex] = updatedTicket;
    saveTickets(updatedTickets);

    return updatedTicket;
  } catch (error) {
    console.error(`Error updating ticket status ${ticketId}:`, error);
    throw error;
  }
};

/**
 * Get ticket statistics (for admin dashboard)
 */
export const getTicketStatistics = async (): Promise<{
  total: number;
  new: number;
  inProgress: number;
  resolved: number;
}> => {
  try {
    const allTickets = getStoredTickets();
    
    return {
      total: allTickets.length,
      new: allTickets.filter(t => t.status === "New").length,
      inProgress: allTickets.filter(t => t.status === "In Progress").length,
      resolved: allTickets.filter(t => t.status === "Resolved").length
    };
  } catch (error) {
    console.error("Error getting ticket statistics:", error);
    throw error;
  }
}; 