import apiClient from '../config/api.config';

export interface CreatePaymentOrderRequest {
  orderId: string;
  amount: number;
}

export interface CreatePaymentOrderResponse {
  razorpayOrderId: string;
  amount: number;
  currency: string;
  orderId: string;
}

export interface VerifyPaymentRequest {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  orderId: string;
}

export interface VerifyPaymentResponse {
  success: boolean;
  paymentId: string;
  orderId: string;
  awb?: string;
  trackingUrl?: string;
}

export interface RazorpayConfig {
  keyId: string;
  currency: string;
  theme: {
    color: string;
  };
  prefill: {
    name: string;
    email: string;
    contact: string;
  };
}

export const paymentService = {
  // Get Razorpay configuration for frontend
  getRazorpayConfig: async (): Promise<{ data: { config: RazorpayConfig } }> => {
    const response = await apiClient.get('/api/v2/customer/payments/config/razorpay');
    return response;
  },

  // Create Razorpay payment order
  createPaymentOrder: async (data: CreatePaymentOrderRequest): Promise<{ data: CreatePaymentOrderResponse }> => {
    const response = await apiClient.post('/api/v2/customer/payments/create-order', data);
    return response;
  },

  // Verify payment after successful payment
  verifyPayment: async (data: VerifyPaymentRequest): Promise<{ data: VerifyPaymentResponse }> => {
    const response = await apiClient.post('/api/v2/customer/payments/verify', data);
    return response;
  },

  // Get payment history
  getPaymentHistory: async (): Promise<{ data: any[] }> => {
    const response = await apiClient.get('/api/v2/customer/payments');
    return response;
  },

  // Get payment details by ID
  getPaymentById: async (paymentId: string): Promise<{ data: any }> => {
    const response = await apiClient.get(`/api/v2/customer/payments/${paymentId}`);
    return response;
  }
}; 