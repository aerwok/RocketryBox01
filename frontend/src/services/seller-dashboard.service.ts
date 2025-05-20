import { ApiService } from './api.service';
import { ApiResponse } from '@/types/api';
import { DashboardStats, DashboardChartData, CourierData, ProductData } from './types/dashboard';

class SellerDashboardService extends ApiService {
    private static instance: SellerDashboardService;

    private constructor() {
        super();
    }

    static getInstance(): SellerDashboardService {
        if (!SellerDashboardService.instance) {
            SellerDashboardService.instance = new SellerDashboardService();
        }
        return SellerDashboardService.instance;
    }

    async getDashboardStats(): Promise<ApiResponse<DashboardStats>> {
        return this.get<DashboardStats>('/seller/dashboard/stats');
    }

    async getChartData(timeframe: string): Promise<ApiResponse<DashboardChartData>> {
        return this.get<DashboardChartData>('/seller/dashboard/charts', {
            params: { timeframe }
        });
    }

    async getCourierPerformance(): Promise<ApiResponse<CourierData[]>> {
        return this.get<CourierData[]>('/seller/dashboard/couriers');
    }

    async getProductPerformance(): Promise<ApiResponse<ProductData[]>> {
        return this.get<ProductData[]>('/seller/dashboard/products');
    }

    async downloadReport(format: 'csv' | 'pdf'): Promise<Blob> {
        const response = await this.get<Blob>('/seller/dashboard/report', {
            params: { format },
            responseType: 'blob'
        });
        return response.data as Blob;
    }
}

export const sellerDashboardService = SellerDashboardService.getInstance();

export default sellerDashboardService; 