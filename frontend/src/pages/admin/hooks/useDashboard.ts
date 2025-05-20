import { useState, useEffect, useCallback } from "react";
import { DashboardState, DashboardFilters } from "../types/dashboard";
import { dashboardService } from "../services/dashboard";
import { toast } from "sonner";

const initialState: DashboardState = {
    loading: false,
    statsLoading: false,
    ordersLoading: false,
    shipmentsLoading: false,
    error: null,
    stats: null,
    filters: {
        dateRange: {
            from: new Date(new Date().setDate(new Date().getDate() - 30)),
            to: new Date()
        },
        status: undefined,
        search: undefined
    },
    orders: [],
    shipments: []
};

export const useDashboard = () => {
    const [state, setState] = useState<DashboardState>(initialState);

    const fetchDashboardData = useCallback(async (filters: DashboardFilters) => {
        setState(prev => ({ 
            ...prev, 
            loading: true, 
            statsLoading: true,
            ordersLoading: true,
            shipmentsLoading: true,
            error: null 
        }));

        try {
            // Fetch stats
            dashboardService.getDashboardStats(filters)
                .then(stats => {
                    setState(prev => ({
                        ...prev,
                        statsLoading: false,
                        stats
                    }));
                })
                .catch(error => {
                    setState(prev => ({
                        ...prev,
                        statsLoading: false,
                        error: error instanceof Error ? error.message : "Failed to fetch stats"
                    }));
                    toast.error("Failed to fetch dashboard stats");
                });

            // Fetch orders
            dashboardService.getRecentOrders()
                .then(orders => {
                    setState(prev => ({
                        ...prev,
                        ordersLoading: false,
                        orders
                    }));
                })
                .catch(error => {
                    setState(prev => ({
                        ...prev,
                        ordersLoading: false,
                        error: error instanceof Error ? error.message : "Failed to fetch orders"
                    }));
                    toast.error("Failed to fetch recent orders");
                });

            // Fetch shipments
            dashboardService.getShipments(filters)
                .then(shipments => {
                    setState(prev => ({
                        ...prev,
                        shipmentsLoading: false,
                        shipments,
                        filters
                    }));
                })
                .catch(error => {
                    setState(prev => ({
                        ...prev,
                        shipmentsLoading: false,
                        error: error instanceof Error ? error.message : "Failed to fetch shipments"
                    }));
                    toast.error("Failed to fetch shipments");
                });

            // Set overall loading to false when all data is loaded
            const checkAllLoaded = setInterval(() => {
                setState(prev => {
                    if (!prev.statsLoading && !prev.ordersLoading && !prev.shipmentsLoading) {
                        clearInterval(checkAllLoaded);
                        return { ...prev, loading: false };
                    }
                    return prev;
                });
            }, 100);
            
        } catch (error) {
            setState(prev => ({
                ...prev,
                loading: false,
                statsLoading: false,
                ordersLoading: false,
                shipmentsLoading: false,
                error: error instanceof Error ? error.message : "An error occurred"
            }));
            toast.error("Failed to fetch dashboard data");
        }
    }, []);

    const updateFilters = useCallback((newFilters: Partial<DashboardFilters>) => {
        setState(prev => ({
            ...prev,
            filters: { ...prev.filters, ...newFilters }
        }));
    }, []);

    const downloadReport = useCallback(async (format: "csv" | "pdf") => {
        try {
            setState(prev => ({ ...prev, loading: true }));
            
            const blob = await dashboardService.downloadReport(state.filters, format);
            
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `dashboard-report-${new Date().toISOString().split('T')[0]}.${format}`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
            setState(prev => ({ ...prev, loading: false }));
            toast.success(`Report downloaded as ${format.toUpperCase()}`);
        } catch (error) {
            setState(prev => ({ ...prev, loading: false }));
            toast.error("Failed to download report");
        }
    }, [state.filters]);

    useEffect(() => {
        fetchDashboardData(state.filters);
    }, [fetchDashboardData, state.filters]);

    return {
        ...state,
        updateFilters,
        downloadReport,
        refresh: () => fetchDashboardData(state.filters)
    };
}; 