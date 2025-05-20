export interface DashboardStats {
    orders: {
        total: number;
        pending: number;
        processing: number;
        shipped: number;
        delivered: number;
        cancelled: number;
        todayCount: number;
    };
    shipments: {
        total: number;
        todayCount: number;
    };
    delivery: {
        total: number;
        todayCount: number;
    };
    cod: {
        expected: number;
        totalDue: number;
    };
    revenue: {
        total: number;
        dailyGrowth: number;
    };
    ndr: {
        pending: number;
        actionRequired: number;
    };
}

export interface OrderStatusDistribution {
    delivered: number;
    inTransit: number;
    pending: number;
}

export interface ShipmentTrend {
    day: string;
    current: number;
    previous: number;
}

export interface RevenueTrend {
    month: string;
    value: number;
}

export interface TopProduct {
    month: string;
    desktop: number;
}

export interface DeliveryPerformance {
    month: string;
    desktop: number;
}

export interface CourierData {
    courier: string;
    total: number;
    notShipped: number;
    pendingPickup: number;
    inTransit: number;
    ofd: number;
    delivered: { count: number; percentage: string };
    cancelled: { count: number; percentage: string };
    exception: { count: number; percentage: string };
    rto: number;
    lostDamage: number;
}

export interface ProductData {
    productName: string;
    quantity: number;
    totalShipments: number;
    notShipped: number;
    cancelled: number;
    pendingPickup: number;
    inTransit: number;
    delivered: number;
    rto: number;
}

export interface DashboardChartData {
    orderStatusDistribution: OrderStatusDistribution;
    shipmentTrends: ShipmentTrend[];
    revenueTrends: RevenueTrend[];
    topProducts: TopProduct[];
    deliveryPerformance: DeliveryPerformance[];
    courierData: CourierData[];
    productData: ProductData[];
}

export interface DateRangeFilter {
    from: Date;
    to: Date;
}

export interface DashboardFilters {
    dateRange?: DateRangeFilter;
    timeFilter?: "1D" | "1W" | "1M" | "3M" | "1Y" | "ALL";
} 