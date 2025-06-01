import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { OrderData, PriceDetail, RazorpayResponse } from '../types/order';
import { PaymentMethod, GST_RATE, PLATFORM_FEE, RAZORPAY_CONFIG } from '../constants/payment';
import { customerApi } from '../services/api';

export const usePayment = (orderData: OrderData | null) => {
    const [selectedPayment, setSelectedPayment] = useState<PaymentMethod | ''>('');
    const [isProcessing, setIsProcessing] = useState(false);
    const navigate = useNavigate();

    const calculatePriceDetails = (data: OrderData): PriceDetail[] => {
        const shippingCost = data.shippingPartner.rate;
        const gstAmount = Math.round(shippingCost * GST_RATE);
        
        return [
            { label: "Shipping Cost", value: shippingCost },
            { label: "GST", value: gstAmount },
            { label: "Insurance", value: 0 },
            { label: "Platform Fee", value: PLATFORM_FEE }
        ];
    };

    const priceDetails = orderData ? calculatePriceDetails(orderData) : [];
    const total = priceDetails.reduce((acc, item) => acc + item.value, 0);

    const handlePaymentSuccess = async (response: RazorpayResponse) => {
        try {
            await customerApi.payments.verifyPayment({
                orderId: orderData!._id,
                ...response
            });

            toast.success("Payment successful!");
            navigate("/customer/orders");
        } catch (error) {
            toast.error("Payment verification failed. Please contact support.");
        }
    };

    const initializePayment = async () => {
        if (!selectedPayment || !orderData) return;

        setIsProcessing(true);
        try {
            const { orderId, keyId } = await customerApi.payments.createOrder({
                orderId: orderData._id,
                amount: total,
                currency: 'INR'
            });

            const options = {
                key: keyId,
                amount: total * 100,
                currency: "INR",
                name: RAZORPAY_CONFIG.name,
                description: `Order Payment - ${orderData.orderNumber}`,
                order_id: orderId,
                handler: handlePaymentSuccess,
                prefill: {
                    name: orderData.receiverName,
                    contact: orderData.receiverMobile,
                },
                theme: RAZORPAY_CONFIG.theme,
                modal: {
                    ondismiss: () => setIsProcessing(false)
                }
            };

            const razorpay = new (window as any).Razorpay(options);
            razorpay.open();
        } catch (error) {
            setIsProcessing(false);
            const errorMessage = error instanceof Error 
                ? error.message 
                : "Payment initialization failed. Please try again.";
            toast.error(errorMessage);
        }
    };

    return {
        selectedPayment,
        setSelectedPayment,
        isProcessing,
        priceDetails,
        total,
        initializePayment
    };
}; 