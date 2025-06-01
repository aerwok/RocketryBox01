import apiClient from '../../../config/api.config';
import { OrderResponse } from '../types/order';

const API_BASE_URL = '/api/v2/customer';

export const customerApi = {
    orders: {
        getByAwb: async (awbNumber: string): Promise<OrderResponse> => {
            const response = await apiClient.get<OrderResponse>(`${API_BASE_URL}/orders/awb/${awbNumber}`);
            return response.data;
        },
        getById: async (orderId: string): Promise<OrderResponse> => {
            const response = await apiClient.get<OrderResponse>(`${API_BASE_URL}/orders/${orderId}`);
            return response.data;
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