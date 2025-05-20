export type OrderStatus = 'not-booked' | 'processing' | 'booked' | 'cancelled' | 'shipment-cancelled' | 'error';

export interface OrderItem {
    name: string;
    sku: string;
    quantity: number;
    price: number;
}

export interface OrderData {
    orderId: string;
    date: string;
    customer: string;
    contact: string;
    items: OrderItem[];
    amount: string;
    payment: 'COD' | 'Prepaid';
    chanel: 'MANUAL' | 'EXCEL' | 'SHOPIFY' | 'WOOCOMMERCE' | 'AMAZON' | 'FLIPKART' | 'OPENCART' | 'API';
    weight: string;
    tags: string;
    action: string;
    whatsapp: string;
    status: OrderStatus;
    awbNumber?: string;
    pincode: string;
}

export interface OrderStats {
    total: number;
    notBooked: number;
    processing: number;
    booked: number;
    cancelled: number;
    shipmentCancelled: number;
    error: number;
}

export interface OrderFilters {
    status?: OrderStatus | 'all';
    dateRange?: {
        from: Date;
        to: Date;
    };
    search?: string;
} 