import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import axios from "axios";
import { formatCurrency, formatDate, formatAddress } from "@/lib/utils";

// Types
interface RazorpayResponse {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
}

interface OrderResponse {
    awbNumber: string;
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
}

interface OrderData extends Omit<OrderResponse, 'pickupDate'> {
    pickupDate: Date;
}

interface PriceDetail {
    label: string;
    value: number;
}

// Constants
const PAYMENT_METHODS = {
    UPI: 'upi',
    CARD: 'card',
    NETBANKING: 'netbanking'
} as const;

type PaymentMethod = typeof PAYMENT_METHODS[keyof typeof PAYMENT_METHODS];

const GST_RATE = 0.18;
const PLATFORM_FEE = 25;

// Custom hooks
const useOrderData = () => {
    const [orderData, setOrderData] = useState<OrderData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchOrderData = async () => {
            try {
                setError(null);
                const awbNumber = new URLSearchParams(location.search).get('awb') || 
                              location.state?.awbNumber;

                if (!awbNumber) {
                    throw new Error("No AWB number found. Please create an order first.");
                }

                // Fetch order data from backend
                const response = await axios.get<OrderResponse>(`/api/orders/awb/${awbNumber}`);
                
                if (!response.data) {
                    throw new Error("Order not found");
                }

                // Convert ISO date string to Date object
                setOrderData({
                    ...response.data,
                    pickupDate: new Date(response.data.pickupDate)
                });
            } catch (error) {
                const errorMessage = error instanceof Error 
                    ? error.message 
                    : "Failed to load order details";
                setError(errorMessage);
                toast.error(errorMessage);
                
                // Redirect to create order page after a delay
                setTimeout(() => {
                    navigate('/customer/create-order');
                }, 3000);
            } finally {
                setIsLoading(false);
            }
        };

        fetchOrderData();
    }, [location, navigate]);

    return { orderData, isLoading, error };
};

const usePayment = (orderData: OrderData | null) => {
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

    const initializePayment = async () => {
        if (!selectedPayment || !orderData) return;

        setIsProcessing(true);
        try {
            // Create payment order
            const { data: { orderId, keyId } } = await axios.post<{ orderId: string; keyId: string }>('/api/payments/create-order', {
                amount: total,
                currency: 'INR',
                awbNumber: orderData.awbNumber
            });

            // Initialize Razorpay
            const options = {
                key: keyId,
                amount: total * 100, // amount in paisa
                currency: "INR",
                name: "RocketryBox",
                description: `Order Payment - ${orderData.awbNumber}`,
                order_id: orderId,
                handler: async (response: RazorpayResponse) => {
                    try {
                        // Verify payment
                        await axios.post('/api/payments/verify', {
                            awbNumber: orderData.awbNumber,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_signature: response.razorpay_signature
                        });

                        toast.success("Payment successful!");
                        navigate("/customer/orders");
                    } catch (error) {
                        toast.error("Payment verification failed. Please contact support.");
                    }
                },
                prefill: {
                    name: orderData.receiverName,
                    contact: orderData.receiverMobile,
                },
                theme: {
                    color: "#0070BA"
                },
                modal: {
                    ondismiss: () => {
                        setIsProcessing(false);
                    }
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

// Components
const LoadingSpinner = () => (
    <div className="container mx-auto py-6 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#0070BA]" />
        <span className="ml-2 text-gray-600">Loading order details...</span>
    </div>
);

const ErrorDisplay = ({ error }: { error: string }) => (
    <div className="container mx-auto py-6 text-center">
        <p className="text-red-600">{error}</p>
        <Button 
            onClick={() => window.location.href = '/customer/create-order'}
            className="mt-4"
        >
            Return to Create Order
        </Button>
    </div>
);

const PaymentPage = () => {
    const { orderData, isLoading, error } = useOrderData();
    const { 
        selectedPayment, 
        setSelectedPayment, 
        isProcessing, 
        priceDetails, 
        total, 
        initializePayment 
    } = usePayment(orderData);
    const navigate = useNavigate();

    if (isLoading) return <LoadingSpinner />;
    if (error || !orderData) return <ErrorDisplay error={error || "Failed to load order details"} />;

    const handleChangeAddress = () => {
        navigate('/customer/create-order', { 
            state: { 
                editMode: 'address',
                awbNumber: orderData.awbNumber 
            } 
        });
    };

    const handleChangeOrder = () => {
        navigate('/customer/create-order', { 
            state: { 
                editMode: 'order',
                awbNumber: orderData.awbNumber 
            } 
        });
    };

    return (
        <div className="container mx-auto py-6">
            <h1 className="text-xl font-medium mb-4 text-center">PAYMENT</h1>
            <div className="max-w-3xl mx-auto grid grid-cols-1 gap-4">
                <div className="space-y-4">
                    {/* Delivery Address */}
                    <div className="bg-[#0070BA] text-white p-4 rounded flex justify-between items-start">
                        <div>
                            <p className="text-sm mb-2">Delivery Address</p>
                            <p className="text-sm">{orderData.receiverName}</p>
                            <p className="text-sm">{formatAddress([
                                orderData.receiverAddress1,
                                orderData.receiverAddress2,
                                orderData.receiverCity,
                                orderData.receiverState,
                                orderData.receiverPincode
                            ])}</p>
                        </div>
                        <button 
                            className="text-xs bg-transparent border border-white px-2 py-1 rounded"
                            onClick={handleChangeAddress}
                        >
                            Change
                        </button>
                    </div>

                    {/* Order Summary */}
                    <div className="bg-[#0070BA] text-white p-4 rounded flex justify-between items-start">
                        <div>
                            <p className="text-sm mb-2">Order Summary</p>
                            <p className="text-sm">
                                {orderData.length}×{orderData.width}×{orderData.height} cm, {orderData.packageType}, 
                                Pickup: {formatDate(orderData.pickupDate)}
                            </p>
                        </div>
                        <button 
                            className="text-xs bg-transparent border border-white px-2 py-1 rounded"
                            onClick={handleChangeOrder}
                        >
                            Change
                        </button>
                    </div>

                    {/* Payment Options */}
                    <div className="bg-[#0070BA] text-white p-4 rounded">
                        <p className="text-sm mb-3">Payment Options</p>
                        <RadioGroup 
                            value={selectedPayment} 
                            onValueChange={(value: PaymentMethod | '') => setSelectedPayment(value)}
                            className="space-y-3"
                        >
                            {Object.entries(PAYMENT_METHODS).map(([key, value]) => (
                                <div key={value} className="flex items-center space-x-2">
                                    <RadioGroupItem value={value} id={value} className="border-white text-white" />
                                    <Label htmlFor={value} className="text-sm text-white cursor-pointer">
                                        {key === 'UPI' ? 'UPI' : 
                                         key === 'CARD' ? 'Credit / Debit / ATM Card' : 
                                         'Net Banking'}
                                    </Label>
                                </div>
                            ))}
                        </RadioGroup>
                    </div>
                </div>

                {/* Price Details */}
                <div className="bg-[#0070BA] text-white p-4 rounded">
                    <p className="text-sm mb-3">Price Details</p>
                    <div className="space-y-2 text-sm">
                        {priceDetails.map((item) => (
                            <div key={item.label} className="flex justify-between">
                                <span>{item.label}</span>
                                <span>{item.value ? formatCurrency(item.value) : '-'}</span>
                            </div>
                        ))}
                        <div className="flex justify-between pt-2 border-t border-white/20 mt-2">
                            <span>Total</span>
                            <span>{formatCurrency(total)}</span>
                        </div>
                    </div>
                </div>

                {/* Pay Button */}
                <Button 
                    className="w-full bg-[#0070BA] hover:bg-[#0070BA]/90 text-white"
                    size="sm"
                    disabled={!selectedPayment || isProcessing}
                    onClick={initializePayment}
                >
                    {isProcessing ? (
                        <span className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Processing...
                        </span>
                    ) : (
                        'Pay'
                    )}
                </Button>
            </div>
        </div>
    );
};

export default PaymentPage;
