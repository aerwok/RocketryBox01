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
                const awbNumber = new URLSearchParams(location.search).get('awb') || 
                              location.state?.awbNumber;

                if (!awbNumber) {
                    throw new Error("No AWB number found. Please create an order first.");
                }

                const response = await customerApi.orders.getByAwb(awbNumber);
                
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