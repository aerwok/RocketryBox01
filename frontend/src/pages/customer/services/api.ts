import apiClient from '../../../config/api.config';

const API_BASE_URL = '/api/v2/customer';

// Backend response wrapper type
interface ApiResponse<T> {
  success: boolean;
  data: T;
}

// OrderDetails type to match backend getOrderById response
interface OrderDetails {
  _id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  totalAmount: number;
  shippingRate: number;
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
    name: string;
    serviceType: string;
    estimatedDays: string;
    totalRate: number;
  };
  awb?: string;
  trackingUrl?: string;
  createdAt: string;
}

export const customerApi = {
  orders: {
    getByAwb: async (awbNumber: string): Promise<OrderDetails> => {
      const response = await apiClient.get<ApiResponse<OrderDetails>>(`${API_BASE_URL}/orders/awb/${awbNumber}`);
      return response.data.data; // Extract the actual order data from the wrapped response
    },
    getById: async (orderId: string): Promise<OrderDetails> => {
      const response = await apiClient.get<ApiResponse<OrderDetails>>(`${API_BASE_URL}/orders/${orderId}`);
      return response.data.data; // Extract the actual order data from the wrapped response
    }
  },

  payments: {
    createOrder: async (params: { orderId: string; amount: number; currency: string }) => {
      const response = await apiClient.post<{ orderId: string; keyId: string }>(
        `${API_BASE_URL}/payments/create-order`,
        params
      );
      return response.data;
    },

    verifyPayment: async (params: {
      orderId: string;
      razorpay_payment_id: string;
      razorpay_order_id: string;
      razorpay_signature: string;
    }) => {
      const response = await apiClient.post(`${API_BASE_URL}/payments/verify`, params);
      return response.data;
    }
  }
};
