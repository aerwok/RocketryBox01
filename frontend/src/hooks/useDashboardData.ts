import { useState, useEffect, useCallback } from 'react';
import { DateRange } from 'react-day-picker';
import { toast } from 'sonner';
import { 
    sellerDashboardService, 
    DashboardStats, 
    DashboardChartData, 
    DashboardFilters,
    DateRangeFilter,
    CourierData, 
    ProductData 
} from '@/services/seller-dashboard.service';

interface DashboardDataState {
    loading: boolean;
    statsLoading: boolean;
    chartsLoading: boolean;
    courierLoading: boolean;
    productsLoading: boolean;
    error: string | null;
    stats: DashboardStats | null;
    chartData: DashboardChartData | null;
    courierData: CourierData[] | null;
    topProducts: ProductData[] | null;
    filters: DashboardFilters;
}

const today = new Date();
const thirtyDaysAgo = new Date(today);
thirtyDaysAgo.setDate(today.getDate() - 30);

const initialState: DashboardDataState = {
    loading: false,
    statsLoading: false,
    chartsLoading: false,
    courierLoading: false,
    productsLoading: false,
    error: null,
    stats: null,
    chartData: null,
    courierData: null,
    topProducts: null,
    filters: {
        dateRange: {
            from: thirtyDaysAgo,
            to: today
        },
        timeFilter: '1M'
    }
};

export const useDashboardData = () => {
    const [state, setState] = useState<DashboardDataState>(initialState);

    const fetchDashboardData = useCallback(async () => {
        setState(prev => ({ 
            ...prev, 
            loading: true, 
            statsLoading: true,
            chartsLoading: true,
            courierLoading: true,
            productsLoading: true,
            error: null 
        }));

        try {
            // Fetch individual data pieces in parallel but handle them individually
            // for better loading state control
            
            // Fetch dashboard stats
            sellerDashboardService.getDashboardStats()
                .then(response => {
                    setState(prev => ({
                        ...prev,
                        statsLoading: false,
                        stats: response.data
                    }));
                })
                .catch(error => {
                    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch stats';
                    setState(prev => ({
                        ...prev,
                        statsLoading: false,
                        error: prev.error || errorMessage
                    }));
                    toast.error(errorMessage);
                });

            // Fetch chart data
            sellerDashboardService.getDashboardChartData(state.filters)
                .then(response => {
                    setState(prev => ({
                        ...prev,
                        chartsLoading: false,
                        chartData: response.data
                    }));
                })
                .catch(error => {
                    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch chart data';
                    setState(prev => ({
                        ...prev,
                        chartsLoading: false,
                        error: prev.error || errorMessage
                    }));
                    toast.error(errorMessage);
                });

            // Fetch courier data
            sellerDashboardService.getCourierPerformance()
                .then(response => {
                    setState(prev => ({
                        ...prev,
                        courierLoading: false,
                        courierData: response.data
                    }));
                })
                .catch(error => {
                    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch courier data';
                    setState(prev => ({
                        ...prev,
                        courierLoading: false,
                        error: prev.error || errorMessage
                    }));
                    toast.error(errorMessage);
                });

            // Fetch top products
            sellerDashboardService.getTopProducts()
                .then(response => {
                    setState(prev => ({
                        ...prev,
                        productsLoading: false,
                        topProducts: response.data
                    }));
                })
                .catch(error => {
                    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch product data';
                    setState(prev => ({
                        ...prev,
                        productsLoading: false,
                        error: prev.error || errorMessage
                    }));
                    toast.error(errorMessage);
                });

            // Set overall loading to false when all data is loaded
            const checkAllLoaded = setInterval(() => {
                setState(prev => {
                    if (!prev.statsLoading && !prev.chartsLoading && 
                        !prev.courierLoading && !prev.productsLoading) {
                        clearInterval(checkAllLoaded);
                        return { ...prev, loading: false };
                    }
                    return prev;
                });
            }, 100);

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to fetch dashboard data';
            setState(prev => ({
                ...prev,
                loading: false,
                statsLoading: false,
                chartsLoading: false,
                courierLoading: false,
                productsLoading: false,
                error: errorMessage
            }));
            toast.error(errorMessage);
        }
    }, [state.filters]);

    const updateDateRange = useCallback((dateRange: DateRange | undefined) => {
        if (dateRange && dateRange.from && dateRange.to) {
            // Create a new dateRange object with non-nullable from and to
            const newDateRange: DateRangeFilter = {
                from: dateRange.from,
                to: dateRange.to
            };
            
            setState(prev => ({
                ...prev,
                filters: {
                    ...prev.filters,
                    dateRange: newDateRange
                }
            }));
        }
    }, []);

    const updateTimeFilter = useCallback((timeFilter: '1D' | '1W' | '1M' | '3M' | '1Y' | 'ALL') => {
        setState(prev => ({
            ...prev,
            filters: {
                ...prev.filters,
                timeFilter
            }
        }));
    }, []);

    const downloadReport = useCallback(async (format: 'csv' | 'pdf') => {
        try {
            setState(prev => ({ ...prev, loading: true }));
            
            const blob = await sellerDashboardService.downloadDashboardReport(format);
            
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `dashboard-report-${new Date().toISOString().split('T')[0]}.${format}`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
            setState(prev => ({ ...prev, loading: false }));
            toast.success(`Dashboard report downloaded as ${format.toUpperCase()}`);
        } catch (error) {
            setState(prev => ({ ...prev, loading: false }));
            toast.error('Failed to download dashboard report');
        }
    }, []);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    return {
        ...state,
        updateDateRange,
        updateTimeFilter,
        downloadReport,
        refresh: fetchDashboardData
    };
};

export default useDashboardData; 