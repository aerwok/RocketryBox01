import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { ApiService } from '@/services/api.service';
import { 
    OrderData, 
    OrderFilters, 
    OrderStats 
} from '@/services/seller-order.service';

const apiService = new ApiService();

interface OrderDataState {
    loading: boolean;
    error: string | null;
    orders: OrderData[] | null;
    stats: OrderStats | null;
    filters: OrderFilters;
    selectedOrders: string[];
}

export const useOrderData = () => {
    const [state, setState] = useState<OrderDataState>({
        loading: false,
        error: null,
        orders: null,
        stats: null,
        filters: {
            status: 'all',
            dateRange: { from: new Date(), to: new Date() },
            search: ''
        },
        selectedOrders: []
    });

    const fetchOrders = useCallback(async () => {
        setState(prev => ({ ...prev, loading: true, error: null }));
        try {
            const response = await apiService.get<OrderData[]>('/orders', {
                params: state.filters
            });
            setState(prev => ({
                ...prev,
                orders: response.data,
                stats: {
                    total: response.data.length,
                    notBooked: response.data.filter(o => o.status === "not-booked").length,
                    processing: response.data.filter(o => o.status === "processing").length,
                    booked: response.data.filter(o => o.status === "booked").length,
                    cancelled: response.data.filter(o => o.status === "cancelled").length,
                    shipmentCancelled: response.data.filter(o => o.status === "shipment-cancelled").length,
                    error: response.data.filter(o => o.status === "error").length
                },
                loading: false
            }));
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'An error occurred while fetching orders';
            setState(prev => ({
                ...prev,
                error: errorMessage,
                loading: false
            }));
            toast.error(errorMessage);
        }
    }, [state.filters]);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    const updateFilters = useCallback((newFilters: Partial<OrderFilters>) => {
        setState(prev => ({
            ...prev,
            filters: { ...prev.filters, ...newFilters }
        }));
    }, []);

    const getActionFromStatus = (status: OrderData['status']): OrderData['action'] => {
        switch (status) {
            case 'not-booked':
                return 'Ship';
            case 'processing':
                return 'Processing';
            case 'booked':
                return 'In Transit';
            case 'cancelled':
                return 'Cancelled';
            case 'shipment-cancelled':
                return 'Cancelled';
            case 'error':
                return 'Error';
            default:
                return 'Pending';
        }
    };

    const updateOrderStatus = useCallback(async (orderId: string, status: OrderData['status']) => {
        try {
            await apiService.put(`/orders/${orderId}/status`, { status });
            toast.success('Order status updated successfully');
            fetchOrders();
        } catch (error) {
            toast.error('Failed to update order status');
        }
    }, [fetchOrders]);

    const bulkUpdateOrderStatus = useCallback(async (orderIds: string[], status: OrderData['status']) => {
        try {
            const response = await apiService.put('/orders/bulk-update-status', { orderIds, status });
            if (response.status === 200) {
                toast.success('Orders status updated successfully');
                fetchOrders();
            } else {
                throw new Error('Failed to update orders status');
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to update orders status';
            toast.error(errorMessage);
        }
    }, [fetchOrders]);

    const getFilteredOrders = useCallback((status: OrderData['status']) => {
        if (!state.orders) return [];
        return state.orders.filter(order => order.status === status);
    }, [state.orders]);

    // Add selection handlers
    const toggleOrderSelection = useCallback((orderId: string) => {
        setState(prev => ({
            ...prev,
            selectedOrders: prev.selectedOrders.includes(orderId)
                ? prev.selectedOrders.filter(id => id !== orderId)
                : [...prev.selectedOrders, orderId]
        }));
    }, []);

    const clearSelection = useCallback(() => {
        setState(prev => ({
            ...prev,
            selectedOrders: []
        }));
    }, []);

    const updateOrderDetails = useCallback(async (orderId: string, details: Partial<OrderData>) => {
        try {
            await apiService.put(`/orders/${orderId}`, details);
            toast.success('Order details updated successfully');
            fetchOrders();
        } catch (error) {
            toast.error('Failed to update order details');
        }
    }, [fetchOrders]);

    return {
        ...state,
        updateFilters,
        updateOrderStatus,
        bulkUpdateOrderStatus,
        getFilteredOrders,
        updateOrderDetails,
        refresh: fetchOrders,
        toggleOrderSelection,
        clearSelection
    };
}; 