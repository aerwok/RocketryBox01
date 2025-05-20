import { DateRange } from 'react-day-picker';

export interface ReportChartData {
    time: string;
    revenue: number;
}

export interface ReportFilters {
    dateRange?: DateRange;
    timeFilter?: "1D" | "1W" | "1M" | "3M" | "1Y" | "ALL";
}

export interface ReportStats {
    totalRevenue: number;
    totalOrders: number;
    totalShipments: number;
    averageOrderValue: number;
    conversionRate: number;
}

export interface DeliveryPartnerShare {
    name: string;
    value: number;
    fill: string;
} 