import axios from 'axios';

const API_BASE_URL = '/api/v2/customer';

export interface RateCalculationRequest {
  weight: number;
  pickupPincode: string;
  deliveryPincode: string;
  serviceType: 'standard' | 'express' | 'cod';
}

export interface RateCalculationResponse {
  success: boolean;
  data: {
    rates: Array<{
      courier: string;
      mode: string;
      service: string;
      rate: number;
      estimatedDelivery: string;
      codCharge: number;
      available: boolean;
    }>;
    summary: {
      totalCouriers: number;
      cheapestRate: number;
      fastestDelivery: string;
    };
  };
}

export interface CreateOrderRequest {
  pickupAddress: {
    name: string;
    phone: string;
    address1: string;
    address2?: string;
    city: string;
    state: string;
    pincode: string;
    country?: string;
  };
  deliveryAddress: {
    name: string;
    phone: string;
    address1: string;
    address2?: string;
    city: string;
    state: string;
    pincode: string;
    country?: string;
  };
  package: {
    weight: number;
    dimensions: {
      length: number;
      width: number;
      height: number;
    };
    items: Array<{
      name: string;
      quantity: number;
      value: number;
    }>;
  };
  serviceType: string;
  paymentMethod: string;
  instructions?: string;
  pickupDate: string;
}

export interface CreateOrderResponse {
  success: boolean;
  data: {
    orderId: string;
    awb: string;
    amount: number;
    estimatedDelivery: string;
  };
}

export class CustomerApiService {
  private static instance: CustomerApiService;
  
  // Create axios instance with credentials enabled
  private api = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true, // This enables sending cookies with requests
    headers: {
      'Content-Type': 'application/json'
    }
  });

  private constructor() {
    // Setup request interceptor to add authorization if needed
    this.api.interceptors.request.use(
      async (config) => {
        // The withCredentials option will ensure cookies are sent
        // No need to manually set the token as it will be in the cookie
        return config;
      },
      (error) => Promise.reject(error)
    );
  }

  static getInstance(): CustomerApiService {
    if (!CustomerApiService.instance) {
      CustomerApiService.instance = new CustomerApiService();
    }
    return CustomerApiService.instance;
  }

  async calculateRates(request: RateCalculationRequest): Promise<RateCalculationResponse> {
    try {
      console.log('Sending rate calculation request:', request);
      const response = await this.api.post<RateCalculationResponse>(
        `/orders/rates`,
        request
      );
      return response.data;
    } catch (error) {
      console.error('Rate calculation error details:', error);
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.message || error.message;
        throw new Error(`Failed to calculate shipping rates: ${errorMessage}`);
      }
      throw new Error('Failed to calculate shipping rates');
    }
  }

  async createOrder(request: CreateOrderRequest): Promise<CreateOrderResponse> {
    try {
      const response = await this.api.post<CreateOrderResponse>(
        `/orders`,
        request
      );
      return response.data;
    } catch (error) {
      console.error('Order creation error:', error);
      throw new Error('Failed to create order');
    }
  }

  async getOrderByAwb(awb: string) {
    try {
      const response = await this.api.get(`/orders/awb/${awb}`);
      return response.data;
    } catch (error) {
      console.error('Order fetch error:', error);
      throw new Error('Failed to fetch order details');
    }
  }

  async listOrders(params?: { page?: number; limit?: number; status?: string }) {
    try {
      const response = await this.api.get(`/orders`, { params });
      return response.data;
    } catch (error) {
      console.error('Orders list error:', error);
      throw new Error('Failed to fetch orders');
    }
  }

  async checkServiceAvailability(data: {
    pickupPincode: string;
    deliveryPincode: string;
    package: {
      weight: number;
      dimensions: {
        length: number;
        width: number;
        height: number;
      };
    };
  }) {
    try {
      const response = await this.api.post(`/services/check`, data);
      return response.data;
    } catch (error) {
      console.error('Service availability error:', error);
      throw new Error('Failed to check service availability');
    }
  }
}

export const customerApiService = CustomerApiService.getInstance(); 