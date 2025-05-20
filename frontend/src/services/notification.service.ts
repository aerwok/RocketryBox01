import { ApiService } from './api.service';
import { toast } from 'sonner';
import { ApiResponse } from '../types/api';

export interface Notification {
  id: string;
  type: 'order' | 'payment' | 'system' | 'promotion';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  data?: Record<string, any>;
}

export class NotificationService {
  private apiService: ApiService;

  constructor() {
    this.apiService = new ApiService();
  }

  async getNotifications(params?: {
    type?: Notification['type'];
    read?: boolean;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<{ data: Notification[]; pagination: any }>> {
    try {
      const queryParams: Record<string, string> = {};
      if (params) {
        if (params.type) queryParams.type = params.type;
        if (params.read !== undefined) queryParams.read = params.read.toString();
        if (params.page) queryParams.page = params.page.toString();
        if (params.limit) queryParams.limit = params.limit.toString();
      }
      const response = await this.apiService.get<ApiResponse<{ data: Notification[]; pagination: any }>>('/notifications', queryParams);
      return response.data;
    } catch (error) {
      toast.error('Failed to fetch notifications');
      throw error;
    }
  }

  async markAsRead(notificationId: string): Promise<ApiResponse<void>> {
    try {
      const response = await this.apiService.patch<ApiResponse<void>>(`/notifications/${notificationId}/read`);
      return response.data;
    } catch (error) {
      toast.error('Failed to mark notification as read');
      throw error;
    }
  }

  async markAllAsRead(): Promise<ApiResponse<void>> {
    try {
      const response = await this.apiService.patch<ApiResponse<void>>('/notifications/read-all');
      return response.data;
    } catch (error) {
      toast.error('Failed to mark all notifications as read');
      throw error;
    }
  }

  async deleteNotification(notificationId: string): Promise<ApiResponse<void>> {
    try {
      const response = await this.apiService.delete<ApiResponse<void>>(`/notifications/${notificationId}`);
      return response.data;
    } catch (error) {
      toast.error('Failed to delete notification');
      throw error;
    }
  }

  async getUnreadCount(): Promise<ApiResponse<{ count: number }>> {
    try {
      const response = await this.apiService.get<ApiResponse<{ count: number }>>('/notifications/unread-count');
      return response.data;
    } catch (error) {
      toast.error('Failed to fetch unread count');
      throw error;
    }
  }
} 