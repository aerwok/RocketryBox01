import { ApiService } from './api.service';
import { toast } from 'sonner';
import { ApiResponse, Customer, Order, OrderStatus } from '../types/api';

export class CustomerService {
  private apiService: ApiService;

  constructor() {
    this.apiService = new ApiService();
  }

  async getProfile(): Promise<ApiResponse<Customer>> {
    try {
      const response = await this.apiService.get<ApiResponse<Customer>>('/customer/profile');
      return response.data;
    } catch (error) {
      toast.error('Failed to fetch profile');
      throw error;
    }
  }

  async updateProfile(profileData: Partial<Customer>): Promise<ApiResponse<Customer>> {
    try {
      const response = await this.apiService.put<ApiResponse<Customer>>('/customer/profile', profileData);
      return response.data;
    } catch (error) {
      toast.error('Failed to update profile');
      throw error;
    }
  }

  async createOrder(orderData: any): Promise<ApiResponse<Order>> {
    try {
      const response = await this.apiService.post<ApiResponse<Order>>('/customer/orders', orderData);
      return response.data;
    } catch (error) {
      toast.error('Failed to create order');
      throw error;
    }
  }

  async getOrders(params?: {
    status?: OrderStatus;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<{ data: Order[]; pagination: any }>> {
    try {
      const queryParams: Record<string, string> = {};
      if (params) {
        if (params.status) queryParams.status = params.status;
        if (params.page) queryParams.page = params.page.toString();
        if (params.limit) queryParams.limit = params.limit.toString();
      }
      const response = await this.apiService.get<ApiResponse<{ data: Order[]; pagination: any }>>('/customer/orders', queryParams);
      return response.data;
    } catch (error) {
      toast.error('Failed to fetch orders');
      throw error;
    }
  }

  async getOrderStatusCounts(): Promise<ApiResponse<Record<OrderStatus, number>>> {
    try {
      const response = await this.apiService.get<ApiResponse<Record<OrderStatus, number>>>('/customer/orders/status-counts');
      return response.data;
    } catch (error) {
      toast.error('Failed to fetch order status counts');
      throw error;
    }
  }

  async getOrderDetails(orderId: string): Promise<ApiResponse<Order>> {
    try {
      const response = await this.apiService.get<ApiResponse<Order>>(`/customer/orders/${orderId}`);
      return response.data;
    } catch (error) {
      toast.error('Failed to fetch order details');
      throw error;
    }
  }

  async cancelOrder(orderId: string, reason: string): Promise<ApiResponse<Order>> {
    try {
      const response = await this.apiService.post<ApiResponse<Order>>(`/customer/orders/${orderId}/cancel`, { reason });
      return response.data;
    } catch (error) {
      toast.error('Failed to cancel order');
      throw error;
    }
  }
} 