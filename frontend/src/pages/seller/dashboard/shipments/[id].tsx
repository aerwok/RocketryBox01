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
    const [trackingInfo, setTrackingInfo] = useState<TrackingInfo | null>(null);
    const [trackingError, setTrackingError] = useState<string | null>(null);
    const [showFullTracking, setShowFullTracking] = useState(false);

    // Mock order details data
    const orderDetails: OrderDetails = {
        orderNo: id || "1740047589959",
        orderPlaced: "20-02-2025",
        paymentType: "COD",
        status: "IN TRANSIT",
        estimatedDelivery: "Tuesday, February 25",
        awbNumber: "1234567890",
        currentLocation: {
            lat: 19.0760,
            lng: 72.8777
        },
        trackingEvents: [
            {
                date: "22 FEB",
                time: "09:39 AM",
                activity: "SHIPMENT OUTSCANNED TO NETWORK",
                location: "BIAL HUB",
                status: "completed"
            },
            {
                date: "21 FEB",
                time: "02:00 AM",
                activity: "COMM FLIGHT,VEH/TRAIN; DELAYED/CANCELLED",
                location: "BIAL HUB",
                status: "completed"
            },
            {
                date: "20 FEB",
                time: "11:30 PM",
                activity: "SHIPMENT RECEIVED AT FACILITY",
                location: "MUMBAI HUB",
                status: "completed"
            },
            {
                date: "20 FEB",
                time: "09:15 PM",
                activity: "SHIPMENT PICKED UP",
                location: "PUNE WAREHOUSE",
                status: "completed"
            },
            {
                date: "20 FEB",
                time: "03:45 PM",
                activity: "SHIPMENT CREATED",
                location: "PUNE WAREHOUSE",
                status: "completed"
            }
        ],
        weight: "324.00 Kg",
        dimensions: {
            length: 50,
            width: 43,
            height: 34
        },
        volumetricWeight: "0 Kg",
        chargedWeight: "0 Kg",
        customerDetails: {
            name: "John Doe",
            address1: "123 Main Street",
            address2: "Apartment 4B",
            city: "PUNE",
            state: "MAHARASHTRA",
            pincode: "412105",
            country: "India",
            phone: "9348543598"
        },
        warehouseDetails: {
            name: "Main Warehouse",
            address1: "456 Storage Lane",
            city: "Noida",
            state: "UTTAR PRADESH",
            pincode: "201307",
            country: "India",
            phone: "9000000000"
        },
        products: [
            {
                name: "Premium Laptop",
                sku: "LAP001",
                quantity: 1,
                price: 50.00,
                image: "/product-image.jpg"
            },
            {
                name: "Wireless Mouse",
                sku: "MOU001",
                quantity: 1,
                price: 15.00,
                image: "/mouse-image.jpg"
            }
        ]
    };

    useEffect(() => {
        if (orderDetails.awbNumber) {
            fetchShipmentTracking(orderDetails.awbNumber);
        }
    }, [orderDetails.awbNumber]);

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

                            {/* Modified existing sections continue below... */}
                        </CardContent>
                    </Card>
                    
                    {/* Rest of the existing components... */}
                    
                </div>
            </div>
        </div>
    );
};

export default SellerShipmentDetailsPage; 