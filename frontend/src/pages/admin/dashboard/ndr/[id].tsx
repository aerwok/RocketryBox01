import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { ArrowLeftIcon, CopyIcon, PackageIcon, ShoppingBagIcon, Truck, Tag } from "lucide-react";
import { motion } from "framer-motion";
import { Link, useParams } from "react-router-dom";
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';
import { toast } from "sonner";

interface NDRDetails {
    orderNo: string;
    orderPlaced: string;
    paymentType: string;
    status: string;
    estimatedDelivery: string;
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

const AdminNDRDetailsPage = () => {

    const { id } = useParams();

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success("The text has been copied to your clipboard.");
    };

    const handlePrintLabel = () => {
        toast.success("Printing label...");
        // Implementation would go here
    };

    const handlePrintInvoice = () => {
        toast.success("Printing invoice...");
        // Implementation would go here
    };

    const handleCancelOrder = () => {
        toast.success("Order cancelled successfully");
        // Implementation would go here
    };

    const handleAddTag = () => {
        toast.success("Tag added successfully");
        // Implementation would go here
    };

    const handleBookShipment = () => {
        toast.success("Shipment booked successfully");
        // Implementation would go here
    };

    const ndrDetails: NDRDetails = {
        orderNo: id || "",
        orderPlaced: "",
        paymentType: "",
        status: "",
        estimatedDelivery: "",
        currentLocation: {
            lat: 0,
            lng: 0
        },
        trackingEvents: [],
        weight: "",
        dimensions: {
            length: 0,
            width: 0,
            height: 0
        },
        volumetricWeight: "",
        chargedWeight: "",
        customerDetails: {
            name: "",
            address1: "",
            address2: "",
            city: "",
            state: "",
            pincode: "",
            country: "",
            phone: ""
        },
        warehouseDetails: {
            name: "",
            address1: "",
            city: "",
            state: "",
            pincode: "",
            country: "",
            phone: ""
        },
        products: []
    };

    return (
        <div className="container mx-auto py-4 w-full">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="space-y-6"
            >
                {/* Header with Back Button */}
                <div className="flex items-center gap-4 mb-6">
                    <Link to="/admin/dashboard/orders">
                        <Button variant="outline" size="icon">
                            <ArrowLeftIcon className="size-5" />
                        </Button>
                    </Link>
                    <h1 className="text-xl font-medium">
                        NDR #{ndrDetails.orderNo}
                    </h1>
                </div>

                {/* Top Section */}
                <div className="grid lg:grid-cols-5 gap-6">
                    {/* Delivery Status Box */}
                    <div className="lg:col-span-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl shadow-lg shadow-neutral-400/20 p-8">
                        <div className="flex justify-between items-start mb-6">
                            <h2 className="text-lg font-medium">
                                Estimated Delivery Date
                            </h2>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-white hover:text-white hover:bg-white/10"
                                onClick={() => handleCopy(ndrDetails.estimatedDelivery)}
                            >
                                <CopyIcon className="size-5" />
                            </Button>
                        </div>
                        <div className="space-y-2">
                            <div className="text-7xl font-bold tracking-tighter">
                                25
                            </div>
                            <div className="text-xl">
                                {ndrDetails.estimatedDelivery}
                            </div>
                            <div className="text-sm opacity-80">
                                On Time
                            </div>
                        </div>
                        <div className="mt-8">
                            <div className="text-sm opacity-80">
                                Status:
                            </div>
                            <div className="text-2xl font-medium mt-1">
                                {ndrDetails.status}
                            </div>
                        </div>
                    </div>

                    {/* Right Section with Map and Timeline */}
                    <div className="lg:col-span-3">
                        <div className="grid lg:grid-cols-5 gap-6 h-full rounded-xl shadow-md shadow-neutral-400/20 p-4 border border-border/60">
                            {/* Map */}
                            <div className="lg:col-span-2 overflow-hidden">
                                <LoadScript googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
                                    <GoogleMap
                                        mapContainerStyle={{
                                            width: '100%',
                                            height: '100%',
                                            minHeight: '250px',
                                            maxHeight: '300px',
                                            borderRadius: 10,
                                        }}
                                        center={ndrDetails.currentLocation}
                                        zoom={10}
                                    >
                                        <Marker position={ndrDetails.currentLocation} />
                                    </GoogleMap>
                                </LoadScript>
                            </div>

                            {/* Tracking Timeline */}
                            <div className="lg:col-span-3">
                                {/* Courier Header */}
                                <div className="px-4 pb-4 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="size-10 rounded-full flex items-center justify-center bg-neutral-100 border border-border">
                                            <img
                                                src="/images/company3.png"
                                                alt="Blue Dart"
                                                className="w-8 h-8 object-contain"
                                            />
                                        </div>
                                        <span className="text-lg font-semibold">
                                            Blue Dart
                                        </span>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm text-gray-500">
                                            Tracking ID
                                        </div>
                                        <div className="font-medium text-purple-500 cursor-pointer hover:underline">
                                            81983530123
                                        </div>
                                    </div>
                                </div>

                                {/* Timeline */}
                                <ScrollArea className="h-[240px]">
                                    <div className="p-2 md:p-4 relative">
                                        {ndrDetails.trackingEvents.map((event, index) => (
                                            <div key={index} className="relative">
                                                <div className="flex gap-4 mb-6">
                                                    {/* Date/Time Column */}
                                                    <div className="w-12 md:w-24 flex flex-col text-sm">
                                                        <span className="font-medium">
                                                            {event.date}
                                                        </span>
                                                        <span className="text-sm">
                                                            {event.time}
                                                        </span>
                                                    </div>

                                                    {/* Timeline Dot and Line */}
                                                    <div className="flex flex-col items-center relative">
                                                        {index !== ndrDetails.trackingEvents.length - 1 && (
                                                            <div className="w-px h-[150%] border border-border border-dashed absolute" />
                                                        )}
                                                        <div className="size-3 rounded-full bg-neutral-400 z-10 relative">
                                                            <div className="size-5 rounded-full bg-transparent border border-border z-10 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Activity Details */}
                                                    <div className="flex-1">
                                                        <p className="text-sm">
                                                            <span className="font-medium">
                                                                Activity:{" "}
                                                            </span>
                                                            <span className="text-muted-foreground">
                                                                {event.activity}
                                                            </span>
                                                        </p>
                                                        <div className="text-sm mt-2">
                                                            <span className="font-medium">
                                                                Location:{" "}
                                                            </span>
                                                            <span className="text-muted-foreground">
                                                                {event.location}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="absolute bottom-0 inset-x-0 h-8 bg-gradient-to-t from-background via-background w-full"></div>
                                </ScrollArea>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Order and Product Details Section */}
                <div className="grid lg:grid-cols-2 gap-6 w-full">
                    <Card className="shadow-lg shadow-neutral-400/20 rounded-xl border border-border/60">
                        <CardHeader className="border-b border-border/60">
                            <CardTitle className="flex items-center gap-2">
                                <PackageIcon className="size-5" />
                                Order Details
                            </CardTitle>
                        </CardHeader>
                        <div className="max-h-[400px] overflow-y-auto">
                            <CardContent className="p-4 lg:p-6">
                                <div className="space-y-4">
                                    <div className="pb-4 border-b border-border/60">
                                        <p className="text-sm text-muted-foreground mb-2">Order ID</p>
                                        <div className="flex items-center gap-2">
                                            <p className="font-medium">#{ndrDetails.orderNo}</p>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6"
                                                onClick={() => handleCopy(ndrDetails.orderNo)}
                                            >
                                                <CopyIcon className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="pb-4 border-b border-border/60">
                                        <p className="text-sm text-muted-foreground mb-2">
                                            Order Placed On
                                        </p>
                                        <p className="font-medium">
                                            {ndrDetails.orderPlaced}
                                        </p>
                                    </div>
                                    <div className="pb-4 border-b border-border/60">
                                        <p className="text-sm text-muted-foreground mb-2">
                                            Order Total
                                        </p>
                                        <p className="text-xl font-semibold">
                                            ₹1579.15
                                        </p>
                                    </div>
                                    <div className="pb-4 border-b border-border/60">
                                        <p className="text-sm text-muted-foreground mb-2">
                                            Payment Method
                                        </p>
                                        <p className="font-medium">
                                            {ndrDetails.paymentType}
                                        </p>
                                    </div>
                                    <div className="pb-4 border-b border-border/60">
                                        <p className="text-sm text-muted-foreground mb-2">
                                            Customer Name
                                        </p>
                                        <p className="font-medium">
                                            {ndrDetails.customerDetails.name}
                                        </p>
                                    </div>
                                    <div className="pb-4">
                                        <p className="text-sm text-muted-foreground mb-2">
                                            Customer Phone
                                        </p>
                                        <p className="font-medium">
                                            {ndrDetails.customerDetails.phone}
                                        </p>
                                    </div>
                                    <div className="pb-4 border-b border-border/60">
                                        <p className="text-sm text-muted-foreground mb-2">
                                            Shipping Address
                                        </p>
                                        <div className="space-y-1">
                                            <p className="font-medium">
                                                {ndrDetails.customerDetails.address1}
                                            </p>
                                            <p>
                                                {ndrDetails.customerDetails.address2}
                                            </p>
                                            <p>
                                                {ndrDetails.customerDetails.city}, {ndrDetails.customerDetails.state} {ndrDetails.customerDetails.pincode}
                                            </p>
                                            <p>
                                                {ndrDetails.customerDetails.country}
                                            </p>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground mb-2">
                                            Warehouse Details
                                        </p>
                                        <div className="space-y-1">
                                            <p className="font-medium">
                                                {ndrDetails.warehouseDetails.name}
                                            </p>
                                            <p>
                                                {ndrDetails.warehouseDetails.address1}
                                            </p>
                                            <p>
                                                {ndrDetails.warehouseDetails.city}, {ndrDetails.warehouseDetails.state} {ndrDetails.warehouseDetails.pincode}
                                            </p>
                                            <p>
                                                {ndrDetails.warehouseDetails.country}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </div>
                    </Card>

                    {/* Product Details Card */}
                    <Card className="shadow-lg shadow-neutral-400/20 rounded-xl border border-border/60">
                        <CardHeader className="border-b border-border/60">
                            <CardTitle className="flex items-center gap-2">
                                <ShoppingBagIcon className="size-5" />
                                Product Details
                            </CardTitle>
                        </CardHeader>
                        <div className="max-h-[400px] max-w-[calc(100dvw-2rem)]">
                            <CardContent className="p-4 lg:p-6 overflow-hidden">
                                <div className="relative overflow-auto w-full">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-border/60">
                                                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground whitespace-nowrap">
                                                    Product Name
                                                </th>
                                                <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground whitespace-nowrap">
                                                    Qty
                                                </th>
                                                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground whitespace-nowrap">
                                                    Unit Price
                                                </th>
                                                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground whitespace-nowrap">
                                                    Sub Total
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {ndrDetails.products.map((product, index) => (
                                                <tr key={index} className={cn(
                                                    "border-b border-border/60",
                                                    index === ndrDetails.products.length - 1 ? "border-b-0" : ""
                                                )}>
                                                    <td className="py-3 px-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="size-10 lg:size-16 flex-shrink-0 rounded-lg border border-border/60 p-2">
                                                                <img
                                                                    src={product.image}
                                                                    alt={product.name}
                                                                    className="w-full h-full object-contain"
                                                                />
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="font-medium line-clamp-1">
                                                                    {product.name}
                                                                </p>
                                                                <p className="text-sm text-muted-foreground line-clamp-1">
                                                                    {product.sku}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-4 text-center whitespace-nowrap">
                                                        {product.quantity}
                                                    </td>
                                                    <td className="py-3 px-4 text-right whitespace-nowrap">
                                                        ₹{product.price.toFixed(2)}
                                                    </td>
                                                    <td className="py-3 px-4 text-right whitespace-nowrap">
                                                        ₹{(product.price * product.quantity).toFixed(2)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </div>
                    </Card>
                </div>

                {/* Admin Actions Card */}
                <Card className="shadow-lg shadow-neutral-400/20 rounded-xl border border-border/60">
                    <CardHeader className="border-b border-border/60">
                        <CardTitle className="flex items-center gap-2">
                            Order Actions
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="flex flex-wrap gap-4">
                            <Button variant="outline" onClick={handlePrintLabel}>
                                Print Label
                            </Button>
                            <Button variant="outline" onClick={handlePrintInvoice}>
                                Print Invoice
                            </Button>
                            <Button
                                variant="outline"
                                className="gap-2 bg-red-500 hover:bg-red-600 text-white hover:text-white"
                                onClick={handleCancelOrder}
                            >
                                Cancel Order
                            </Button>
                            <Button
                                variant="outline"
                                className="gap-2 bg-green-500 hover:bg-green-600 text-white hover:text-white"
                                onClick={handleAddTag}
                            >
                                <Tag className="size-4" />
                                Add Tag
                            </Button>
                            <Button
                                className="bg-violet-600 hover:bg-violet-700 text-white gap-2"
                                onClick={handleBookShipment}
                            >
                                <Truck className="size-4" />
                                Book Shipment
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
};

export default AdminNDRDetailsPage;
