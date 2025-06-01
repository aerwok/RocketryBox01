import { ApiService } from './api.service';
import { ApiResponse } from '@/types/api';
import { DashboardStats, DashboardChartData, CourierData, ProductData } from './types/dashboard';
import { secureStorage } from '@/utils/secureStorage';
import { sellerAuthService } from './seller-auth.service';

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

    // Check if current user has dashboard access permission
    private async hasDashboardAccess(): Promise<boolean> {
        try {
            return await sellerAuthService.hasPermission('Dashboard access');
        } catch (error) {
            console.error('Error checking dashboard permission:', error);
            return false;
        }
    }

    // Get mock dashboard data for team members without permission
    private getMockDashboardStats(): DashboardStats {
        return {
            orders: { total: 0, todayCount: 0, pending: 0, processing: 0, shipped: 0, delivered: 0, cancelled: 0 },
            shipments: { total: 0, todayCount: 0 },
            delivery: { total: 0, todayCount: 0 },
            cod: { expected: 0, totalDue: 0 },
            revenue: { total: 0, dailyGrowth: 0 },
            ndr: { pending: 0, actionRequired: 0 }
        };
    }

    private getMockChartData(): DashboardChartData {
        return {
            shipmentTrends: [],
            revenueTrends: [],
            orderStatusDistribution: { delivered: 0, inTransit: 0, pending: 0 },
            topProducts: [],
            deliveryPerformance: [],
            courierData: [],
            productData: []
        };
    }

    private getMockCourierData(): CourierData[] {
        return [];
    }

    private getMockProductData(): ProductData[] {
        return [];
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
            // Check if user has dashboard access permission
            const hasAccess = await this.hasDashboardAccess();
            if (!hasAccess) {
                console.log('User does not have dashboard access permission, returning mock data');
                return {
                    data: this.getMockDashboardStats(),
                    status: 200,
                    message: 'Access restricted - Mock data returned',
                    success: true
                };
            }

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
            // Return mock data on error for team members
            const hasAccess = await this.hasDashboardAccess();
            if (!hasAccess) {
                return {
                    data: this.getMockDashboardStats(),
                    status: 200,
                    message: 'Error occurred - Mock data returned',
                    success: true
                };
            }
            throw error;
        }
    }

    async getChartData(timeframe: string): Promise<ApiResponse<DashboardChartData>> {
        try {
            // Check if user has dashboard access permission
            const hasAccess = await this.hasDashboardAccess();
            if (!hasAccess) {
                console.log('User does not have dashboard access permission, returning mock chart data');
                return {
                    data: this.getMockChartData(),
                    status: 200,
                    message: 'Access restricted - Mock data returned',
                    success: true
                };
            }

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
            // Return mock data on error for team members
            const hasAccess = await this.hasDashboardAccess();
            if (!hasAccess) {
                return {
                    data: this.getMockChartData(),
                    status: 200,
                    message: 'Error occurred - Mock data returned',
                    success: true
                };
            }
            throw error;
        }
    }

    async getCourierPerformance(): Promise<ApiResponse<CourierData[]>> {
        try {
            // Check if user has dashboard access permission
            const hasAccess = await this.hasDashboardAccess();
            if (!hasAccess) {
                console.log('User does not have dashboard access permission, returning mock courier data');
                return {
                    data: this.getMockCourierData(),
                    status: 200,
                    message: 'Access restricted - Mock data returned',
                    success: true
                };
            }

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
            // Return mock data on error for team members
            const hasAccess = await this.hasDashboardAccess();
            if (!hasAccess) {
                return {
                    data: this.getMockCourierData(),
                    status: 200,
                    message: 'Error occurred - Mock data returned',
                    success: true
                };
            }
            throw error;
        }
    }

    async getProductPerformance(): Promise<ApiResponse<ProductData[]>> {
        try {
            // Check if user has dashboard access permission
            const hasAccess = await this.hasDashboardAccess();
            if (!hasAccess) {
                console.log('User does not have dashboard access permission, returning mock product data');
                return {
                    data: this.getMockProductData(),
                    status: 200,
                    message: 'Access restricted - Mock data returned',
                    success: true
                };
            }

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
            // Return mock data on error for team members
            const hasAccess = await this.hasDashboardAccess();
            if (!hasAccess) {
                return {
                    data: this.getMockProductData(),
                    status: 200,
                    message: 'Error occurred - Mock data returned',
                    success: true
                };
            }
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