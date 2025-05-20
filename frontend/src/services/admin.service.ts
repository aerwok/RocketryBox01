import { ApiService } from './api.service';
import { toast } from 'sonner';
import { ApiResponse, Admin, Order, UserRole, UserStatus } from '../types/api';

export class AdminService {
  private apiService: ApiService;

  constructor() {
    this.apiService = new ApiService();
  }

  // User Management
  async getUsers(params?: {
    role?: UserRole;
    search?: string;
    status?: UserStatus;
    sortBy?: 'name' | 'email' | 'createdAt' | 'lastLogin';
    sortOrder?: 'asc' | 'desc';
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<{ data: Admin[]; pagination: any }>> {
    try {
      const queryParams: Record<string, string> = {};
      if (params) {
        if (params.role) queryParams.role = params.role;
        if (params.search) queryParams.search = params.search;
        if (params.status) queryParams.status = params.status;
        if (params.sortBy) queryParams.sortBy = params.sortBy;
        if (params.sortOrder) queryParams.sortOrder = params.sortOrder;
        if (params.page) queryParams.page = params.page.toString();
        if (params.limit) queryParams.limit = params.limit.toString();
      }
      const response = await this.apiService.get<ApiResponse<{ data: Admin[]; pagination: any }>>('/admin/users', queryParams);
      return response.data;
    } catch (error) {
      toast.error('Failed to fetch users');
      throw error;
    }
  }

  async getUserDetails(userId: string): Promise<ApiResponse<Admin>> {
    try {
      const response = await this.apiService.get<ApiResponse<Admin>>(`/admin/users/${userId}`);
      return response.data;
    } catch (error) {
      toast.error('Failed to fetch user details');
      throw error;
    }
  }

  async updateUserStatus(userId: string, status: UserStatus, reason?: string): Promise<ApiResponse<Admin>> {
    try {
      const response = await this.apiService.patch<ApiResponse<Admin>>(`/admin/users/${userId}/status`, { status, reason });
      return response.data;
    } catch (error) {
      toast.error('Failed to update user status');
      throw error;
    }
  }

  async updateUserPermissions(userId: string, permissions: string[]): Promise<ApiResponse<Admin>> {
    try {
      const response = await this.apiService.patch<ApiResponse<Admin>>(`/admin/users/${userId}/permissions`, { permissions });
      return response.data;
    } catch (error) {
      toast.error('Failed to update user permissions');
      throw error;
    }
  }

  async addAdminNote(userId: string, note: string): Promise<ApiResponse<Admin>> {
    try {
      const response = await this.apiService.post<ApiResponse<Admin>>(`/admin/users/${userId}/notes`, { note });
      return response.data;
    } catch (error) {
      toast.error('Failed to add admin note');
      throw error;
    }
  }

  // Order Management
  async getOrders(params?: {
    from?: string;
    to?: string;
    status?: string | string[];
    sellerId?: string;
    customerId?: string;
    paymentType?: 'COD' | 'Prepaid';
    priority?: 'High' | 'Medium' | 'Low';
    courier?: string;
    awbNumber?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<{ data: Order[]; pagination: any }>> {
    try {
      const queryParams: Record<string, string> = {};
      if (params) {
        if (params.from) queryParams.from = params.from;
        if (params.to) queryParams.to = params.to;
        if (params.status) queryParams.status = Array.isArray(params.status) ? params.status.join(',') : params.status;
        if (params.sellerId) queryParams.sellerId = params.sellerId;
        if (params.customerId) queryParams.customerId = params.customerId;
        if (params.paymentType) queryParams.paymentType = params.paymentType;
        if (params.priority) queryParams.priority = params.priority;
        if (params.courier) queryParams.courier = params.courier;
        if (params.awbNumber) queryParams.awbNumber = params.awbNumber;
        if (params.search) queryParams.search = params.search;
        if (params.sortBy) queryParams.sortBy = params.sortBy;
        if (params.sortOrder) queryParams.sortOrder = params.sortOrder;
        if (params.page) queryParams.page = params.page.toString();
        if (params.limit) queryParams.limit = params.limit.toString();
      }
      const response = await this.apiService.get<ApiResponse<{ data: Order[]; pagination: any }>>('/admin/orders', queryParams);
      return response.data;
    } catch (error) {
      toast.error('Failed to fetch orders');
      throw error;
    }
  }

  async getOrderDetails(orderId: string): Promise<ApiResponse<Order>> {
    try {
      const response = await this.apiService.get<ApiResponse<Order>>(`/admin/orders/${orderId}`);
      return response.data;
    } catch (error) {
      toast.error('Failed to fetch order details');
      throw error;
    }
  }

  async updateOrder(orderId: string, data: Partial<Order>): Promise<ApiResponse<Order>> {
    try {
      const response = await this.apiService.patch<ApiResponse<Order>>(`/admin/orders/${orderId}`, data);
      return response.data;
    } catch (error) {
      toast.error('Failed to update order');
      throw error;
    }
  }

  async addOrderHistory(orderId: string, action: string, details: string): Promise<ApiResponse<void>> {
    try {
      const response = await this.apiService.post<ApiResponse<void>>(`/admin/orders/${orderId}/history`, { action, details });
      return response.data;
    } catch (error) {
      toast.error('Failed to add order history');
      throw error;
    }
  }

  async getOrderStatusCounts(params?: {
    from?: string;
    to?: string;
    sellerId?: string;
  }): Promise<ApiResponse<Record<string, number>>> {
    try {
      const queryParams: Record<string, string> = {};
      if (params) {
        if (params.from) queryParams.from = params.from;
        if (params.to) queryParams.to = params.to;
        if (params.sellerId) queryParams.sellerId = params.sellerId;
      }
      const response = await this.apiService.get<ApiResponse<Record<string, number>>>('/admin/orders/status-counts', queryParams);
      return response.data;
    } catch (error) {
      toast.error('Failed to fetch order status counts');
      throw error;
    }
  }

  // Dashboard
  async getDashboardStats(period?: 'today' | 'yesterday' | 'week' | 'month' | 'year'): Promise<ApiResponse<any>> {
    try {
      const queryParams: Record<string, string> = {};
      if (period) queryParams.period = period;
      const response = await this.apiService.get<ApiResponse<any>>('/admin/dashboard/stats', queryParams);
      return response.data;
    } catch (error) {
      toast.error('Failed to fetch dashboard stats');
      throw error;
    }
  }

  async getKPIs(params?: {
    from?: string;
    to?: string;
  }): Promise<ApiResponse<any>> {
    try {
      const queryParams: Record<string, string> = {};
      if (params) {
        if (params.from) queryParams.from = params.from;
        if (params.to) queryParams.to = params.to;
      }
      const response = await this.apiService.get<ApiResponse<any>>('/admin/dashboard/kpi', queryParams);
      return response.data;
    } catch (error) {
      toast.error('Failed to fetch KPIs');
      throw error;
    }
  }

  async getOrderTrends(params: {
    granularity: 'daily' | 'weekly' | 'monthly';
    from?: string;
    to?: string;
  }): Promise<ApiResponse<any>> {
    try {
      const queryParams: Record<string, string> = {
        granularity: params.granularity,
      };
      if (params.from) queryParams.from = params.from;
      if (params.to) queryParams.to = params.to;
      const response = await this.apiService.get<ApiResponse<any>>('/admin/dashboard/order-trends', queryParams);
      return response.data;
    } catch (error) {
      toast.error('Failed to fetch order trends');
      throw error;
    }
  }

  async getSystemHealth(): Promise<ApiResponse<any>> {
    try {
      const response = await this.apiService.get<ApiResponse<any>>('/admin/dashboard/system-health');
      return response.data;
    } catch (error) {
      toast.error('Failed to fetch system health');
      throw error;
    }
  }
} 