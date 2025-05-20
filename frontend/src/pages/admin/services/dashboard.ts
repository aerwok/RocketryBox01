import axios from "axios";
import { DashboardStats, Order, Shipment, DashboardFilters } from "../types/dashboard";
import { API_BASE_URL } from '@/config';

export const dashboardService = {
    async getDashboardStats(filters: DashboardFilters): Promise<DashboardStats> {
        try {
            const response = await axios.get(`${API_BASE_URL}/admin/dashboard/stats`, {
                params: filters
            });
            return response.data;
        } catch (error) {
            throw new Error("Failed to fetch dashboard stats");
        }
    },

    async getRecentOrders(): Promise<Order[]> {
        // This method is no longer provided in the new implementation
        throw new Error("Method not implemented");
    },

    async getShipments(filters: DashboardFilters): Promise<Shipment[]> {
        try {
            const response = await axios.get(`${API_BASE_URL}/admin/dashboard/shipments`, {
                params: filters
            });
            return response.data;
        } catch (error) {
            throw new Error("Failed to fetch shipments");
        }
    },

    async downloadReport(filters: DashboardFilters, format: "csv" | "pdf"): Promise<Blob> {
        try {
            const response = await axios.get(`${API_BASE_URL}/admin/dashboard/report`, {
                params: { ...filters, format },
                responseType: "blob"
            });
            return response.data;
        } catch (error) {
            throw new Error("Failed to download report");
        }
    }
}; 