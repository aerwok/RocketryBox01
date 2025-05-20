import { ApiService } from '@/services/api.service';
import { ApiResponse } from '@/types/api';
import { ReportChartData, ReportFilters } from '../../../types/reports';

export class ReportsService {
    private apiService: ApiService;

    constructor() {
        this.apiService = new ApiService();
    }

    async getRevenueData(filters: ReportFilters): Promise<ApiResponse<ReportChartData[]>> {
        try {
            const response = await this.apiService.get<ReportChartData[]>('/admin/reports/revenue', {
                params: filters
            });
            return response;
        } catch (error) {
            throw new Error('Failed to fetch revenue data');
        }
    }

    async getShipmentData(filters: ReportFilters): Promise<ApiResponse<ReportChartData[]>> {
        try {
            const response = await this.apiService.get<ReportChartData[]>('/admin/reports/shipments', {
                params: filters
            });
            return response;
        } catch (error) {
            throw new Error('Failed to fetch shipment data');
        }
    }

    async getCourierData(filters: ReportFilters): Promise<ApiResponse<ReportChartData[]>> {
        try {
            const response = await this.apiService.get<ReportChartData[]>('/admin/reports/couriers', {
                params: filters
            });
            return response;
        } catch (error) {
            throw new Error('Failed to fetch courier data');
        }
    }

    async downloadReport(filters: ReportFilters, format: 'csv' | 'pdf'): Promise<Blob> {
        try {
            const response = await this.apiService.get<Blob>('/admin/reports/download', {
                params: { ...filters, format },
                responseType: 'blob'
            });
            return response.data as Blob;
        } catch (error) {
            throw new Error('Failed to download report');
        }
    }
}

export const reportsService = new ReportsService(); 