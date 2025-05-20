export const PAYMENT_METHODS = {
    UPI: 'upi',
    CARD: 'card',
    NETBANKING: 'netbanking'
} as const;

export type PaymentMethod = typeof PAYMENT_METHODS[keyof typeof PAYMENT_METHODS];

export const GST_RATE = 0.18;
export const PLATFORM_FEE = 25;

export const RAZORPAY_CONFIG = {
    name: "RocketryBox",
    theme: {
        color: "#0070BA"
    }
} as const; 