import apiClient from '../config/api.config';

export interface CreateOrderRequest {
  packageDetails: {
    weight: number;
    dimensions: {
      length: number;
      width: number;
      height: number;
    };
    declaredValue: number;
  };
  pickupAddress: {
    name: string;
    phone: string;
    address: {
      line1: string;
      line2?: string;
      city: string;
      state: string;
      pincode: string;
    };
  };
  deliveryAddress: {
    name: string;
    phone: string;
    address: {
      line1: string;
      line2?: string;
      city: string;
      state: string;
      pincode: string;
    };
  };
  selectedProvider: {
    id: string;
    name: string;
    serviceType: string;
    totalRate: number;
    estimatedDays: string;
  };
  instructions?: string;
}

export interface OrderResponse {
  _id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  totalAmount: number;
  shippingRate: number;
  awb?: string;
  trackingUrl?: string;
}

export const orderService = {
  // Create new order
  createOrder: async (data: CreateOrderRequest): Promise<{ data: OrderResponse }> => {
    const response = await apiClient.post('/api/v2/customer/orders', data);
    return response;
  },

  // Get order history
  getOrderHistory: async (): Promise<{ data: any[] }> => {
    const response = await apiClient.get('/api/v2/customer/orders');
    return response;
  },

  // Get order by ID
  getOrderById: async (orderId: string): Promise<{ data: any }> => {
    const response = await apiClient.get(`/api/v2/customer/orders/${orderId}`);
    return response;
  },

  // Calculate shipping rates
  calculateRates: async (data: any): Promise<{ data: any[] }> => {
    const response = await apiClient.post('/api/v2/customer/orders/rates', data);
    return response;
  },

  // Cancel order
  cancelOrder: async (orderId: string): Promise<{ data: any }> => {
    const response = await apiClient.patch(`/api/v2/customer/orders/${orderId}/cancel`);
    return response;
  },

  // Track order
  trackOrder: async (orderId: string): Promise<{ data: any }> => {
    const response = await apiClient.get(`/api/v2/customer/orders/${orderId}/track`);
    return response;
  }
};
