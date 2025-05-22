import { ApiService } from './api.service';
import { ApiResponse } from '@/types/api';
import { DashboardStats, DashboardChartData, CourierData, ProductData } from './types/dashboard';
import { secureStorage } from '@/utils/secureStorage';

class SellerDashboardService extends ApiService {
    private static instance: SellerDashboardService;
    private readonly CACHE_KEY_STATS = 'dashboard_stats';
    private readonly CACHE_KEY_CHARTS = 'dashboard_charts';
    private readonly CACHE_KEY_COURIERS = 'dashboard_couriers';
    private readonly CACHE_KEY_PRODUCTS = 'dashboard_products';
    private readonly CACHE_DURATION = 60000; // 60 seconds

    private constructor() {
        super();
    }

    static getInstance(): SellerDashboardService {
        if (!SellerDashboardService.instance) {
            SellerDashboardService.instance = new SellerDashboardService();
        }
        return SellerDashboardService.instance;
    }

    private async getCachedData<T>(cacheKey: string): Promise<T | null> {
        try {
            const cached = await secureStorage.getItem(cacheKey);
            if (!cached) return null;

            const { data, timestamp } = JSON.parse(cached);
            if (Date.now() - timestamp > this.CACHE_DURATION) {
                await secureStorage.removeItem(cacheKey);
                return null;
            }

            return data;
        } catch (error) {
            console.error(`Cache read error for ${cacheKey}:`, error);
            return null;
        }
    }

    private setCachedData<T>(cacheKey: string, data: T): void {
        try {
            const cacheData = {
                data,
                timestamp: Date.now()
            };
            secureStorage.setItem(cacheKey, JSON.stringify(cacheData));
        } catch (error) {
            console.error(`Cache write error for ${cacheKey}:`, error);
        }
    }

    async getDashboardStats(): Promise<ApiResponse<DashboardStats>> {
        try {
            // Check cache first
            const cached = await this.getCachedData<DashboardStats>(this.CACHE_KEY_STATS);
            if (cached) {
                return {
                    data: cached,
                    status: 200,
                    message: 'Request successful (cached)',
                    success: true
                };
            }
            
            // Fetch from API if not cached
            const response = await this.get<DashboardStats>('/seller/dashboard/stats');
            
            // Cache the response
            this.setCachedData(this.CACHE_KEY_STATS, response.data);
            
            return response;
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
            throw error;
        }
    }

    async getChartData(timeframe: string): Promise<ApiResponse<DashboardChartData>> {
        try {
            const cacheKey = `${this.CACHE_KEY_CHARTS}_${timeframe}`;
            
            // Check cache first
            const cached = await this.getCachedData<DashboardChartData>(cacheKey);
            if (cached) {
                return {
                    data: cached,
                    status: 200,
                    message: 'Request successful (cached)',
                    success: true
                };
            }
            
            // Fetch from API if not cached
            const response = await this.get<DashboardChartData>('/seller/dashboard/charts', {
                timeframe // Pass directly without nesting
            });
            
            // Cache the response
            this.setCachedData(cacheKey, response.data);
            
            return response;
        } catch (error) {
            console.error('Error fetching chart data:', error);
            throw error;
        }
    }

    async getCourierPerformance(): Promise<ApiResponse<CourierData[]>> {
        try {
            // Check cache first
            const cached = await this.getCachedData<CourierData[]>(this.CACHE_KEY_COURIERS);
            if (cached) {
                return {
                    data: cached,
                    status: 200,
                    message: 'Request successful (cached)',
                    success: true
                };
            }
            
            // Fetch from API if not cached
            const response = await this.get<CourierData[]>('/seller/dashboard/couriers');
            
            // Cache the response
            this.setCachedData(this.CACHE_KEY_COURIERS, response.data);
            
            return response;
        } catch (error) {
            console.error('Error fetching courier performance:', error);
            throw error;
        }
    }

    async getProductPerformance(): Promise<ApiResponse<ProductData[]>> {
        try {
            // Check cache first
            const cached = await this.getCachedData<ProductData[]>(this.CACHE_KEY_PRODUCTS);
            if (cached) {
                return {
                    data: cached,
                    status: 200,
                    message: 'Request successful (cached)',
                    success: true
                };
            }
            
            // Fetch from API if not cached
            const response = await this.get<ProductData[]>('/seller/dashboard/products');
            
            // Cache the response
            this.setCachedData(this.CACHE_KEY_PRODUCTS, response.data);
            
            return response;
        } catch (error) {
            console.error('Error fetching product performance:', error);
            throw error;
        }
    }

    // For compatibility with useDashboardData hook
    async getTopProducts(): Promise<ApiResponse<ProductData[]>> {
        return this.getProductPerformance();
    }

    async downloadReport(format: 'csv' | 'pdf'): Promise<Blob> {
        const response = await this.get<Blob>('/seller/dashboard/report', {
            format, // Pass directly without nesting
            responseType: 'blob'
        });
        return response.data as Blob;
    }

    // For compatibility with useDashboardData hook
    async downloadDashboardReport(format: 'csv' | 'pdf'): Promise<Blob> {
        return this.downloadReport(format);
    }

    // For compatibility with useDashboardData hook
    async getDashboardChartData(filters: any): Promise<ApiResponse<DashboardChartData>> {
        return this.getChartData(filters.timeFilter || '1M');
    }
}

export const sellerDashboardService = SellerDashboardService.getInstance();

export default sellerDashboardService;
export type { DashboardStats, DashboardChartData, CourierData, ProductData, DashboardFilters, DateRangeFilter } from './types/dashboard'; 