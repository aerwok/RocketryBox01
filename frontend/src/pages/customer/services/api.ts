import axios from 'axios';
import { OrderResponse } from '../types/order';

const API_BASE_URL = '/api/v2/customer';

export const customerApi = {
    orders: {
        getByAwb: async (awbNumber: string): Promise<OrderResponse> => {
            const response = await axios.get<OrderResponse>(`${API_BASE_URL}/orders/awb/${awbNumber}`);
            return response.data;
        }
    },
    
    payments: {
        createOrder: async (params: { amount: number; currency: string; awbNumber: string }) => {
            const response = await axios.post<{ orderId: string; keyId: string }>(
                `${API_BASE_URL}/payments/create-order`,
                params
            );
            return response.data;
        },

        verifyPayment: async (params: {
            awbNumber: string;
            razorpay_payment_id: string;
            razorpay_order_id: string;
            razorpay_signature: string;
        }) => {
            const response = await axios.post(`${API_BASE_URL}/payments/verify`, params);
            return response.data;
        }
    }
}; 