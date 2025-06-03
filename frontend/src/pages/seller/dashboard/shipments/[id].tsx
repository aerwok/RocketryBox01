import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeftIcon, CopyIcon, ExternalLinkIcon} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";
import TrackingResult from "@/components/shared/tracking-result";
import { TrackingInfo } from "@/components/shared/track-order-form";
import { fetchTrackingInfo } from "@/lib/api/tracking";

interface OrderDetails {
    orderNo: string;
    orderPlaced: string;
    paymentType: string;
    status: string;
    estimatedDelivery: string;
    awbNumber: string;
    currentLocation: {
        lat: number;
        lng: number;
    };
    trackingEvents: {
        date: string;
        time: string;
        activity: string;
        location: string;
        status: string;
    }[];
    weight: string;
    dimensions: {
        length: number;
        width: number;
        height: number;
    };
    volumetricWeight: string;
    chargedWeight: string;
    customerDetails: {
        name: string;
        address1: string;
        address2: string;
        city: string;
        state: string;
        pincode: string;
        country: string;
        phone: string;
    };
    warehouseDetails: {
        name: string;
        address1: string;
        city: string;
        state: string;
        pincode: string;
        country: string;
        phone: string;
    };
    products: {
        name: string;
        sku: string;
        quantity: number;
        price: number;
        image: string;
    }[];
}

const SellerShipmentDetailsPage = () => {

    const { id } = useParams();
    const [isLoadingTracking, setIsLoadingTracking] = useState(false);
    const [isLoadingOrder, setIsLoadingOrder] = useState(false);
    const [trackingInfo, setTrackingInfo] = useState<TrackingInfo | null>(null);
    const [trackingError, setTrackingError] = useState<string | null>(null);
    const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
    const [orderError, setOrderError] = useState<string | null>(null);
    const [showFullTracking, setShowFullTracking] = useState(false);

    // Fetch order details from API
    const fetchOrderDetails = async (orderId: string) => {
        try {
            setIsLoadingOrder(true);
            setOrderError(null);
            
            const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
            const response = await fetch(`${baseUrl}/api/v2/seller/shipments/${orderId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('seller_token')}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch shipment details: ${response.status}`);
            }

            const data = await response.json();
            setOrderDetails(data);
        } catch (error) {
            console.error("Error fetching order details:", error);
            setOrderError("Unable to fetch shipment details. Please try again later.");
            toast.error("Failed to load shipment details");
        } finally {
            setIsLoadingOrder(false);
        }
    };

    useEffect(() => {
        if (id) {
            fetchOrderDetails(id);
        }
    }, [id]);

    useEffect(() => {
        if (orderDetails?.awbNumber) {
            fetchShipmentTracking(orderDetails.awbNumber);
        }
    }, [orderDetails?.awbNumber]);

    const fetchShipmentTracking = async (awbNumber: string) => {
        try {
            setIsLoadingTracking(true);
            setTrackingError(null);
            const data = await fetchTrackingInfo(awbNumber);
            setTrackingInfo(data);
        } catch (error) {
            console.error("Error fetching tracking info:", error);
            setTrackingError("Unable to fetch tracking information. Please try again later.");
        } finally {
            setIsLoadingTracking(false);
        }
    };

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success("The text has been copied to your clipboard.");
    };

    if (isLoadingOrder) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin h-8 w-8 border-2 border-blue-500 rounded-full border-t-transparent"></div>
                    <p className="text-gray-600">Loading shipment details...</p>
                </div>
            </div>
        );
    }

    if (orderError || !orderDetails) {
        return (
            <div className="space-y-6">
                <Link 
                    to="/seller/dashboard/shipments" 
                    className="inline-flex items-center gap-1 text-blue-500 hover:text-blue-600 transition-colors"
                >
                    <ArrowLeftIcon className="h-4 w-4" />
                    <span>Back to Shipments</span>
                </Link>
                
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="text-center">
                        <p className="text-red-600 text-lg font-medium">Failed to load shipment details</p>
                        <p className="text-gray-600 mt-2">{orderError}</p>
                        <Button 
                            onClick={() => id && fetchOrderDetails(id)} 
                            className="mt-4"
                            variant="outline"
                        >
                            Try Again
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <Link 
                to="/seller/dashboard/shipments" 
                className="inline-flex items-center gap-1 text-blue-500 hover:text-blue-600 transition-colors"
            >
                <ArrowLeftIcon className="h-4 w-4" />
                <span>Back to Shipments</span>
            </Link>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="col-span-1 xl:col-span-2 space-y-6">
                    {/* Shipment Info */}
                    <Card>
                        <CardHeader className="bg-gray-50 rounded-t-lg">
                            <div className="flex justify-between items-center">
                                <CardTitle className="text-lg">Shipment Information</CardTitle>
                                <div className="flex gap-2">
                                    <Button size="sm" variant="outline" className="h-8">
                                        Print
                                    </Button>
                                    <Button size="sm" variant="outline" className="h-8">
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className="pt-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-3">
                                    <div>
                                        <span className="text-sm text-gray-500 block">Order No.</span>
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium">{orderDetails.orderNo}</span>
                                            <button 
                                                onClick={() => handleCopy(orderDetails.orderNo)} 
                                                className="text-blue-500 hover:text-blue-600"
                                            >
                                                <CopyIcon className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                    <div>
                                        <span className="text-sm text-gray-500 block">AWB Number</span>
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium">{orderDetails.awbNumber}</span>
                                            <button 
                                                onClick={() => handleCopy(orderDetails.awbNumber)} 
                                                className="text-blue-500 hover:text-blue-600"
                                            >
                                                <CopyIcon className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                    <div>
                                        <span className="text-sm text-gray-500 block">Order Placed</span>
                                        <span className="font-medium">{orderDetails.orderPlaced}</span>
                                    </div>
                                    <div>
                                        <span className="text-sm text-gray-500 block">Payment Type</span>
                                        <span className="font-medium">{orderDetails.paymentType}</span>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <div>
                                        <span className="text-sm text-gray-500 block">Status</span>
                                        <span className="inline-flex px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm font-medium">
                                            {orderDetails.status}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-sm text-gray-500 block">Estimated Delivery</span>
                                        <span className="font-medium">{orderDetails.estimatedDelivery}</span>
                                    </div>
                                    <div>
                                        <span className="text-sm text-gray-500 block">Weight</span>
                                        <span className="font-medium">{orderDetails.weight}</span>
                                    </div>
                                    <div>
                                        <span className="text-sm text-gray-500 block">Dimensions</span>
                                        <span className="font-medium">
                                            {orderDetails.dimensions.length} x {orderDetails.dimensions.width} x {orderDetails.dimensions.height} cm
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Enhanced tracking section using the shared component */}
                            <div className="mt-6 border-t pt-4">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-medium text-lg">Enhanced Tracking</h3>
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        onClick={() => setShowFullTracking(!showFullTracking)}
                                    >
                                        {showFullTracking ? "Simple View" : "Full Details"}
                                    </Button>
                                </div>
                                
                                {isLoadingTracking ? (
                                    <div className="flex justify-center items-center h-40 bg-gray-50 rounded-lg">
                                        <div className="animate-spin h-6 w-6 border-2 border-blue-500 rounded-full border-t-transparent"></div>
                                    </div>
                                ) : trackingError ? (
                                    <div className="p-4 border border-red-200 bg-red-50 text-red-700 rounded-lg">
                                        {trackingError}
                                    </div>
                                ) : trackingInfo ? (
                                    showFullTracking ? (
                                        <TrackingResult data={trackingInfo} className="border" />
                                    ) : (
                                        <div className="border rounded-lg p-4">
                                            <div className="flex justify-between items-center mb-3">
                                                <div>
                                                    <span className="font-medium">{trackingInfo.currentStatus}</span>
                                                    <span className="text-sm text-gray-500 ml-2">
                                                        - Expected delivery: {trackingInfo.expectedDelivery}
                                                    </span>
                                                </div>
                                                <Link 
                                                    to={`/customer/track-order?awb=${trackingInfo.awbNumber}`}
                                                    className="text-blue-500 text-sm flex items-center gap-1 hover:text-blue-600"
                                                    target="_blank"
                                                >
                                                    Track in detail
                                                    <ExternalLinkIcon className="h-3 w-3" />
                                                </Link>
                                            </div>
                                            <div className="space-y-3 mt-3">
                                                {trackingInfo.events.slice(0, 3).map((event, index) => (
                                                    <div key={index} className="flex gap-3">
                                                        <div className="relative flex flex-col items-center">
                                                            <div className="size-3 rounded-full bg-blue-500"></div>
                                                            {index !== 2 && <div className="w-0.5 h-full bg-gray-200 absolute top-3"></div>}
                                                        </div>
                                                        <div>
                                                            <p className="font-medium">{event.status}</p>
                                                            <p className="text-sm text-gray-500">{event.location} - {event.timestamp}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )
                                ) : (
                                    <div className="p-4 border border-gray-200 bg-gray-50 text-gray-700 rounded-lg">
                                        No tracking information available
                                    </div>
                                )}
                            </div>

                            {/* Original tracking timeline */}
                            <div className="mt-6 border-t pt-4">
                                <h3 className="font-medium text-lg mb-4">Tracking Timeline</h3>
                                <div className="relative">
                                    <div className="absolute left-3 top-0 h-full w-0.5 bg-gray-200"></div>
                                    <div className="space-y-6">
                                        {orderDetails.trackingEvents.map((event, index) => (
                                            <div key={index} className="relative pl-8">
                                                <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-white border-2 border-blue-500 flex items-center justify-center">
                                                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                                </div>
                                                <div className="flex gap-4 bg-white p-2">
                                                    <div className="w-32">
                                                        <div className="font-medium">{event.date}</div>
                                                        <div className="text-sm text-gray-500">{event.time}</div>
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="font-medium">{event.activity}</div>
                                                        <div className="text-sm text-gray-500">{event.location}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Customer Details */}
                            <div className="mt-6 border-t pt-4">
                                <h3 className="font-medium text-lg mb-4">Customer Details</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <div>
                                            <span className="text-sm text-gray-500 block">Name</span>
                                            <span className="font-medium">{orderDetails.customerDetails.name}</span>
                                        </div>
                                        <div>
                                            <span className="text-sm text-gray-500 block">Phone</span>
                                            <span className="font-medium">{orderDetails.customerDetails.phone}</span>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div>
                                            <span className="text-sm text-gray-500 block">Address</span>
                                            <div className="font-medium">
                                                <div>{orderDetails.customerDetails.address1}</div>
                                                {orderDetails.customerDetails.address2 && (
                                                    <div>{orderDetails.customerDetails.address2}</div>
                                                )}
                                                <div>
                                                    {orderDetails.customerDetails.city}, {orderDetails.customerDetails.state} - {orderDetails.customerDetails.pincode}
                                                </div>
                                                <div>{orderDetails.customerDetails.country}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Products */}
                            <div className="mt-6 border-t pt-4">
                                <h3 className="font-medium text-lg mb-4">Products</h3>
                                <div className="space-y-3">
                                    {orderDetails.products.map((product, index) => (
                                        <div key={index} className="flex items-center gap-4 p-3 border rounded-lg">
                                            <img 
                                                src={product.image} 
                                                alt={product.name}
                                                className="w-16 h-16 object-cover rounded-md"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).src = '/placeholder-product.png';
                                                }}
                                            />
                                            <div className="flex-1">
                                                <div className="font-medium">{product.name}</div>
                                                <div className="text-sm text-gray-500">SKU: {product.sku}</div>
                                                <div className="text-sm text-gray-500">Quantity: {product.quantity}</div>
                                            </div>
                                            <div className="font-medium">₹{product.price.toFixed(2)}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar with warehouse details and other info */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Warehouse Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div>
                                <span className="text-sm text-gray-500 block">Name</span>
                                <span className="font-medium">{orderDetails.warehouseDetails.name}</span>
                            </div>
                            <div>
                                <span className="text-sm text-gray-500 block">Address</span>
                                <div className="font-medium">
                                    <div>{orderDetails.warehouseDetails.address1}</div>
                                    <div>
                                        {orderDetails.warehouseDetails.city}, {orderDetails.warehouseDetails.state} - {orderDetails.warehouseDetails.pincode}
                                    </div>
                                    <div>{orderDetails.warehouseDetails.country}</div>
                                </div>
                            </div>
                            <div>
                                <span className="text-sm text-gray-500 block">Phone</span>
                                <span className="font-medium">{orderDetails.warehouseDetails.phone}</span>
                            </div>
                        </CardContent>
                    </Card>
                    
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Weight Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div>
                                <span className="text-sm text-gray-500 block">Actual Weight</span>
                                <span className="font-medium">{orderDetails.weight}</span>
                            </div>
                            <div>
                                <span className="text-sm text-gray-500 block">Volumetric Weight</span>
                                <span className="font-medium">{orderDetails.volumetricWeight}</span>
                            </div>
                            <div>
                                <span className="text-sm text-gray-500 block">Charged Weight</span>
                                <span className="font-medium">{orderDetails.chargedWeight}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default SellerShipmentDetailsPage; 