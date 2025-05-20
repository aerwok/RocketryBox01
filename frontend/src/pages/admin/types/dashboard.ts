import { DateRange } from "react-day-picker";

export interface DashboardCard {
    title: string;
    value: string | number;
    change: string;
    icon?: string;
    color?: string;
}

export interface Order {
    id: string;
    userId: string;
    name: string;
    date: string;
    status: OrderStatus;
    amount: string;
}

export interface Shipment {
    id: string;
    trackingNumber: string;
    status: ShipmentStatus;
    origin: string;
    destination: string;
    date: string;
    courier: string;
}

export type OrderStatus = "Active" | "Inactive" | "Pending" | "Completed" | "Cancelled";
export type ShipmentStatus = "Booked" | "In-transit" | "Pending Pickup" | "Delivered" | "Cancelled";

export interface DashboardFilters {
    dateRange: DateRange | undefined;
    status?: OrderStatus | ShipmentStatus;
    search?: string;
}

export interface DashboardStats {
    totalShipments: number;
    revenue: number;
    pendingOrders: number;
    activeUsers: number;
    newUsers: number;
    monthlyGrowth: {
        shipments: number;
        revenue: number;
        users: number;
    };
}

export interface ChartData {
    date: string;
    value: number;
    category: string;
}

export interface DashboardState {
    loading: boolean;
    statsLoading: boolean;
    ordersLoading: boolean;
    shipmentsLoading: boolean;
    error: string | null;
    stats: DashboardStats | null;
    filters: DashboardFilters;
    orders: Order[];
    shipments: Shipment[];
} 