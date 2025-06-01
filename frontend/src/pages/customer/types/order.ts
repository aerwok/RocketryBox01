export interface OrderResponse {
    _id: string;
    orderNumber: string;
    receiverName: string;
    receiverAddress1: string;
    receiverAddress2?: string;
    receiverCity: string;
    receiverState: string;
    receiverPincode: string;
    receiverMobile: string;
    weight: number;
    length: number;
    width: number;
    height: number;
    packageType: string;
    pickupDate: string; // ISO date string from backend
    shippingPartner: {
        name: string;
        rate: number;
    };
    status: string;
    paymentStatus: string;
    totalAmount: number;
    awb?: string; // AWB is generated only after payment
}

export interface OrderData extends Omit<OrderResponse, 'pickupDate'> {
    pickupDate: Date;
}

export interface PriceDetail {
    label: string;
    value: number;
}

export interface RazorpayResponse {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
} 