import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import apiClient from "@/config/api.config";
import { formatCurrency, formatDate, formatAddress } from "@/lib/utils";

// Types
interface RazorpayResponse {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
}

interface OrderResponse {
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
    awb?: string;
}

interface OrderData extends Omit<OrderResponse, 'pickupDate'> {
    pickupDate: Date;
    temporaryOrderData?: any; // Store original temporary order data for payment creation
}

interface PriceDetail {
    label: string;
    value: number;
}

// Constants
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
        const loadOrderData = async () => {
            try {
                setError(null);
                
                // Try to get order data from navigation state first
                let tempOrderData = location.state?.orderData;
                
                // If not in state, try session storage
                if (!tempOrderData) {
                    const storedData = sessionStorage.getItem('pendingOrderData');
                    if (storedData) {
                        tempOrderData = JSON.parse(storedData);
                    }
                }

                if (!tempOrderData) {
                    throw new Error("No order data found. Please create an order first.");
                }

                console.log('📦 Loaded temporary order data:', tempOrderData);

                // Transform temporary order data to match OrderData interface
                const transformedData: OrderData = {
                    _id: 'temp_' + Date.now(), // Temporary ID
                    orderNumber: 'PENDING', // Will be generated after payment
                    receiverName: tempOrderData.deliveryAddress.name,
                    receiverAddress1: tempOrderData.deliveryAddress.address1,
                    receiverAddress2: tempOrderData.deliveryAddress.address2 || '',
                    receiverCity: tempOrderData.deliveryAddress.city,
                    receiverState: tempOrderData.deliveryAddress.state,
                    receiverPincode: tempOrderData.deliveryAddress.pincode,
                    receiverMobile: tempOrderData.deliveryAddress.phone,
                    weight: tempOrderData.package.weight,
                    length: tempOrderData.package.dimensions.length,
                    width: tempOrderData.package.dimensions.width,
                    height: tempOrderData.package.dimensions.height,
                    packageType: tempOrderData.selectedProvider?.serviceType || 'standard',
                    pickupDate: new Date(tempOrderData.pickupDate),
                    shippingPartner: {
                        name: tempOrderData.selectedProvider?.name || 'RocketryBox Logistics',
                        rate: tempOrderData.shippingRate || tempOrderData.selectedProvider?.totalRate || 0
                    },
                    status: 'pending',
                    paymentStatus: 'pending',
                    totalAmount: tempOrderData.shippingRate || tempOrderData.selectedProvider?.totalRate || 0,
                    // Store the original temporary data for payment creation
                    temporaryOrderData: tempOrderData
                };

                setOrderData(transformedData);
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

        loadOrderData();
    }, [location, navigate]);

    return { orderData, isLoading, error };
};

const usePayment = (orderData: OrderData | null) => {
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
        console.log('🔘 Pay button clicked!');
        console.log('📋 Current state:', {
            orderDataExists: !!orderData,
            orderData: orderData ? { _id: orderData._id, total } : null
        });

        if (!orderData) {
            console.log('❌ No order data available');
            toast.error('Order data not loaded. Please try again.');
            return;
        }

        setIsProcessing(true);
        try {
            console.log('🚀 Initializing payment with data:', {
                temporaryOrderData: orderData.temporaryOrderData,
                amount: total,
                currency: 'INR'
            });

            // Create payment order with temporary order data
            const response = await apiClient.post('/api/v2/customer/payments/create-order', {
                orderData: orderData.temporaryOrderData, // Send temporary order data instead of orderId
                amount: total,
                currency: 'INR'
            });

            console.log('📦 Full response received:', response);
            console.log('📊 Response data:', response.data);

            // Check if response has the expected structure
            if (!response.data || !response.data.success) {
                throw new Error(`Invalid response structure: ${JSON.stringify(response.data)}`);
            }

            const { data: responseData } = response.data;
            console.log('🔍 Extracted response data:', responseData);

            if (!responseData.orderId || !responseData.keyId) {
                throw new Error(`Missing required fields in response. orderId: ${responseData.orderId}, keyId: ${responseData.keyId}`);
            }

            const { orderId: razorpayOrderId, keyId } = responseData;

            console.log('✅ Payment order created successfully:', {
                razorpayOrderId,
                keyId: keyId ? 'Present' : 'Missing',
                amount: total
            });

            // Initialize Razorpay
            const options = {
                key: keyId,
                amount: total * 100, // amount in paisa
                currency: "INR",
                name: "RocketryBox",
                description: `Order Payment - ${orderData.orderNumber}`,
                order_id: razorpayOrderId,
                handler: async (response: RazorpayResponse) => {
                    try {
                        console.log('🎉 Payment completed, verifying...', response);
                        
                        // Verify payment
                        const verificationResponse = await apiClient.post('/api/v2/customer/payments/verify', {
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_signature: response.razorpay_signature
                        });

                        console.log('✅ Payment verification response:', verificationResponse.data);

                        // Enhanced success notification with comprehensive order data
                        const verifiedOrder = verificationResponse.data?.data?.order;
                        const orderNumber = verifiedOrder?.orderNumber || 'PENDING';
                        const awbNumber = verifiedOrder?.awb;
                        const estimatedDelivery = verifiedOrder?.estimatedDelivery;
                        const courierPartner = verifiedOrder?.courierPartner;

                        // Clear temporary order data from session storage
                        sessionStorage.removeItem('pendingOrderData');

                        // Show comprehensive success message with all order details
                        toast.success(
                            <div className="flex flex-col gap-2">
                                <div className="font-semibold text-green-800">🎉 Order Created Successfully!</div>
                                <div className="text-sm text-gray-700">
                                    <strong>Order #{orderNumber}</strong> has been confirmed and is being processed.
                                </div>
                                {awbNumber && (
                                    <div className="text-sm text-gray-700">
                                        <strong>AWB:</strong> {awbNumber}
                                    </div>
                                )}
                                {courierPartner && (
                                    <div className="text-sm text-gray-700">
                                        <strong>Courier:</strong> {courierPartner}
                                    </div>
                                )}
                                {estimatedDelivery && (
                                    <div className="text-sm text-gray-700">
                                        <strong>Estimated Delivery:</strong> {new Date(estimatedDelivery).toLocaleDateString()}
                                    </div>
                                )}
                                <div className="text-xs text-gray-600 mt-1">
                                    You will receive tracking updates via SMS/Email
                                </div>
                            </div>,
                            {
                                duration: 8000,
                                className: "success-toast"
                            }
                        );

                        // Small delay to let user see the success message, then navigate to order details
                        setTimeout(() => {
                            if (verifiedOrder?.id) {
                                navigate(`/customer/orders/${verifiedOrder.id}`);
                            } else {
                                navigate("/customer/orders");
                            }
                        }, 2000);

                    } catch (error) {
                        console.error('❌ Payment verification failed:', error);
                        toast.error(
                            <div className="flex flex-col gap-1">
                                <div className="font-semibold">Payment Verification Failed</div>
                                <div className="text-sm text-gray-600">
                                    Your payment was processed but we couldn't verify it. Please contact support.
                                </div>
                            </div>,
                            {
                                duration: 8000
                            }
                        );
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
                        console.log('💸 Payment modal dismissed');
                        setIsProcessing(false);
                    }
                }
            };

            console.log('🪟 Opening Razorpay modal with options:', {
                key: keyId,
                amount: total * 100,
                order_id: razorpayOrderId
            });

            // Check if Razorpay is loaded
            if (typeof (window as any).Razorpay === 'undefined') {
                throw new Error('Razorpay library is not loaded. Please refresh the page and try again.');
            }

            const razorpay = new (window as any).Razorpay(options);
            razorpay.open();
        } catch (error) {
            setIsProcessing(false);
            console.error('❌ Payment initialization failed:', error);
            
            let errorMessage = "Payment initialization failed. Please try again.";
            
            if (error instanceof Error) {
                errorMessage = error.message;
            } else if (typeof error === 'object' && error !== null) {
                // Handle axios error
                const axiosError = error as any;
                if (axiosError.response) {
                    console.error('Response error:', axiosError.response.data);
                    errorMessage = `Server error: ${axiosError.response.data?.message || axiosError.response.status}`;
                } else if (axiosError.request) {
                    console.error('Request error:', axiosError.request);
                    errorMessage = "Network error. Please check your connection.";
                } else {
                    console.error('Unknown error:', axiosError.message);
                    errorMessage = axiosError.message || errorMessage;
                }
            }
            
            toast.error(errorMessage);
        }
    };

    return {
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
        isProcessing, 
        priceDetails, 
        total, 
        initializePayment 
    } = usePayment(orderData);
    const navigate = useNavigate();

    // Test Razorpay loading on component mount
    useEffect(() => {
        console.log('💳 PaymentPage mounted');
        console.log('🔧 Razorpay loaded:', typeof (window as any).Razorpay !== 'undefined');
        if (typeof (window as any).Razorpay === 'undefined') {
            console.warn('⚠️ Razorpay not loaded! Check if script is included in index.html');
        }
    }, []);

    if (isLoading) return <LoadingSpinner />;
    if (error || !orderData) return <ErrorDisplay error={error || "Failed to load order details"} />;

    const handleChangeAddress = () => {
        // Store current order data back to session storage for editing
        if (orderData?.temporaryOrderData) {
            sessionStorage.setItem('pendingOrderData', JSON.stringify(orderData.temporaryOrderData));
        }
        navigate('/customer/create-order', { 
            state: { 
                editMode: 'address',
                orderData: orderData?.temporaryOrderData 
            } 
        });
    };

    const handleChangeOrder = () => {
        // Store current order data back to session storage for editing
        if (orderData?.temporaryOrderData) {
            sessionStorage.setItem('pendingOrderData', JSON.stringify(orderData.temporaryOrderData));
        }
        navigate('/customer/create-order', { 
            state: { 
                editMode: 'order',
                orderData: orderData?.temporaryOrderData 
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
                    disabled={isProcessing}
                    onClick={initializePayment}
                >
                    {isProcessing ? (
                        <span className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Processing...
                        </span>
                    ) : (
                        `Pay ${formatCurrency(total)}`
                    )}
                </Button>
                
                {/* Debug Info */}
                <div className="text-xs text-gray-500 text-center">
                    Order: {orderData?._id ? 'Loaded' : 'Not loaded'} | 
                    Total: {formatCurrency(total)}
                </div>

                {/* Debug Test Button (only in development) */}
                {process.env.NODE_ENV === 'development' && (
                    <Button 
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            console.log('🧪 Test button clicked');
                            console.log('🔧 Razorpay available:', typeof (window as any).Razorpay !== 'undefined');
                            console.log('�� Payment state:', { orderData: !!orderData, total });
                            if (typeof (window as any).Razorpay !== 'undefined') {
                                console.log('✅ Razorpay is loaded and ready');
                            } else {
                                console.error('❌ Razorpay is not loaded');
                            }
                        }}
                        className="w-full"
                    >
                        🧪 Test Razorpay (Dev Only)
                    </Button>
                )}
            </div>
        </div>
    );
};

export default PaymentPage;
