import { ApiService } from './api.service';
import { toast } from 'sonner';
import { 
  Seller, 
  Order, 
  OrderStatus, 
  ApiResponse, 
  PaginatedResponse
} from '@/types/api';

export class SellerService {
  private apiService: ApiService;

  constructor() {
    this.apiService = new ApiService();
  }

  // Profile Management
  async getProfile(): Promise<ApiResponse<Seller>> {
    try {
      const response = await this.apiService.get<ApiResponse<Seller>>('/seller/profile');
      return response.data;
    } catch (error) {
      toast.error('Failed to fetch profile');
      throw error;
    }
  }

  async updateProfile(profile: Partial<Seller>): Promise<ApiResponse<Seller>> {
    try {
      const response = await this.apiService.put<ApiResponse<Seller>>('/seller/profile', profile);
      return response.data;
    } catch (error) {
      toast.error('Failed to update profile');
      throw error;
    }
  }

  async updateProfileImage(file: File): Promise<ApiResponse<{ imageUrl: string }>> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await this.apiService.post<ApiResponse<{ imageUrl: string }>>('/seller/profile/image', formData);
      return response.data;
    } catch (error) {
      toast.error('Failed to update profile image');
      throw error;
    }
  }

  // Orders Management
  async getOrders(params: {
    from?: string;
    to?: string;
    status?: OrderStatus;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Order>> {
    try {
      const queryParams = new URLSearchParams();
      if (params.from) queryParams.append('from', params.from);
      if (params.to) queryParams.append('to', params.to);
      if (params.status) queryParams.append('status', params.status);
      if (params.search) queryParams.append('search', params.search);
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());

      const response = await this.apiService.get<ApiResponse<PaginatedResponse<Order>>>(`/seller/orders?${queryParams.toString()}`);
      return response.data.data;
    } catch (error) {
      toast.error('Failed to fetch orders');
      throw error;
    }
  }

  async getOrderStats(params: {
    from?: string;
    to?: string;
    status?: OrderStatus;
  }): Promise<ApiResponse<{
    total: number;
    notBooked: number;
    processing: number;
    booked: number;
    cancelled: number;
    shipmentCancelled: number;
    error: number;
  }>> {
    try {
      const queryParams = new URLSearchParams();
      if (params.from) queryParams.append('from', params.from);
      if (params.to) queryParams.append('to', params.to);
      if (params.status) queryParams.append('status', params.status);

      const response = await this.apiService.get<ApiResponse<any>>(`/seller/orders/stats?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      toast.error('Failed to fetch order stats');
      throw error;
    }
  }

  async updateOrderStatus(orderId: string, status: OrderStatus): Promise<ApiResponse<void>> {
    try {
      const response = await this.apiService.patch<ApiResponse<void>>(`/seller/orders/${orderId}/status`, { status });
      return response.data;
    } catch (error) {
      toast.error('Failed to update order status');
      throw error;
    }
  }

  async bulkUpdateOrderStatus(orderIds: string[], status: OrderStatus): Promise<ApiResponse<void>> {
    try {
      const response = await this.apiService.patch<ApiResponse<void>>('/seller/orders/bulk-status', { orderIds, status });
      return response.data;
    } catch (error) {
      toast.error('Failed to update order statuses');
      throw error;
    }
  }

  // Dashboard
  async getDashboardStats(): Promise<ApiResponse<{
    orders: {
      total: number;
      pending: number;
      processing: number;
      shipped: number;
      delivered: number;
      cancelled: number;
      todayCount: number;
    };
    shipments: {
      total: number;
      todayCount: number;
    };
    delivery: {
      total: number;
      todayCount: number;
    };
    cod: {
      expected: number;
      totalDue: number;
    };
    revenue: {
      total: number;
      dailyGrowth: number;
    };
    ndr: {
      pending: number;
      actionRequired: number;
    };
    weightDisputes: {
      pending: number;
      total: number;
      resolved: number;
    };
  }>> {
    try {
      const response = await this.apiService.get<ApiResponse<any>>('/seller/dashboard/stats');
      return response.data;
    } catch (error) {
      toast.error('Failed to fetch dashboard stats');
      throw error;
    }
  }

  // Rate Card
  async getRateCard(): Promise<ApiResponse<{
    rateBand: string;
    lastUpdated: string;
    couriers: {
      name: string;
      rates: {
        withinCity: number;
        withinState: number;
        metroToMetro: number;
        restOfIndia: number;
        northEastJK: number;
      };
      codCharge: number;
      codPercent: number;
    }[];
  }>> {
    try {
      const response = await this.apiService.get<ApiResponse<any>>('/seller/rate-card');
      return response.data;
    } catch (error) {
      toast.error('Failed to fetch rate card');
      throw error;
    }
  }

  // Billing
  async getInvoices(params: {
    from?: string;
    to?: string;
  }): Promise<ApiResponse<{
    invoices: {
      id: string;
      invoiceNumber: string;
      period: string;
      shipments: number;
      amount: string;
    }[];
  }>> {
    try {
      const queryParams = new URLSearchParams();
      if (params.from) queryParams.append('from', params.from);
      if (params.to) queryParams.append('to', params.to);

      const response = await this.apiService.get<ApiResponse<any>>(`/seller/billing/invoices?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      toast.error('Failed to fetch invoices');
      throw error;
    }
  }

  // COD Remittance
  async getCODRemittanceSummary(): Promise<ApiResponse<{
    totalCOD: string;
    remittedTillDate: string;
    lastRemittance: string;
    totalRemittanceDue: string;
    nextRemittance: string;
  }>> {
    try {
      const response = await this.apiService.get<ApiResponse<any>>('/seller/cod/summary');
      return response.data;
    } catch (error) {
      toast.error('Failed to fetch COD remittance summary');
      throw error;
    }
  }

  async getCODRemittanceHistory(params: {
    status?: 'Pending' | 'Completed' | 'Failed';
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<{
    remittanceId: string;
    status: 'Pending' | 'Completed' | 'Failed';
    paymentDate: string;
    remittanceAmount: string;
    freightDeduction: string;
    convenienceFee: string;
    total: string;
    paymentRef: string;
  }>> {
    try {
      const queryParams = new URLSearchParams();
      if (params.status) queryParams.append('status', params.status);
      if (params.from) queryParams.append('from', params.from);
      if (params.to) queryParams.append('to', params.to);
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());

      const response = await this.apiService.get<ApiResponse<PaginatedResponse<any>>>(`/seller/cod/remittance-history?${queryParams.toString()}`);
      return response.data.data;
    } catch (error) {
      toast.error('Failed to fetch COD remittance history');
      throw error;
    }
  }
} 