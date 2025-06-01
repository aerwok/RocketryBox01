import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { OrderData } from '../types/order';
import { customerApi } from '../services/api';

export const useOrderData = () => {
    const [orderData, setOrderData] = useState<OrderData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchOrderData = async () => {
            try {
                setError(null);
                const orderId = new URLSearchParams(location.search).get('orderId') || 
                              location.state?.orderId;

                if (!orderId) {
                    throw new Error("No Order ID found. Please create an order first.");
                }

                const response = await customerApi.orders.getById(orderId);
                
                setOrderData({
                    ...response,
                    pickupDate: new Date(response.pickupDate)
                });
            } catch (error) {
                const errorMessage = error instanceof Error 
                    ? error.message 
                    : "Failed to load order details";
                setError(errorMessage);
                toast.error(errorMessage);
                
                setTimeout(() => {
                    navigate('/customer/create-order');
                }, 3000);
            } finally {
                setIsLoading(false);
            }
        };

        fetchOrderData();
    }, [location, navigate]);

    return { orderData, isLoading, error };
}; 