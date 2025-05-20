import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { LoadScript, GoogleMap, Marker } from "@react-google-maps/api";
import {
    ArrowLeftIcon,
    PackageIcon,
    ShoppingBagIcon,
    PhoneIcon,
    MessageSquareIcon,
    MailIcon,
    Copy,
    Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ServiceFactory } from "@/services/service-factory";

interface NDRDetails {
    awb: string;
    orderNo: string;
    orderDate: string;
    courier: string;
    customer: string;
    attempts: number;
    lastAttemptDate: string;
    status: string;
    reason: string;
    action: string;
    currentLocation: string;
    deliveryAttempts: {
        date: string;
        status: string;
        reason: string;
        location: string;
    }[];
    customerDetails: {
        name: string;
        phone: string;
        email: string;
        address: string;
    };
    products: {
        name: string;
        quantity: number;
        price: number;
    }[];
}

const NDRDetailsPage = () => {
    const { id } = useParams();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [ndrDetails, setNdrDetails] = useState<NDRDetails | null>(null);

    useEffect(() => {
        const fetchNDRDetails = async () => {
            try {
                setLoading(true);
                const response = await ServiceFactory.seller.ndr.getNDRDetails(id || '');
                const data = response.data as unknown as NDRDetails;
                setNdrDetails(data);
            } catch (error) {
                setError('Failed to fetch NDR details');
                toast.error('Failed to fetch NDR details');
                console.error('Error fetching NDR details:', error);
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchNDRDetails();
        }
    }, [id]);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success('Copied to clipboard');
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
            </div>
        );
    }

    if (error || !ndrDetails) {
        return (
            <div className="text-center py-12">
                <h3 className="text-lg font-medium text-gray-900">Error</h3>
                <p className="mt-1 text-sm text-gray-500">{error || 'NDR details not found'}</p>
            </div>
        );
    }

    const [selectedAction, setSelectedAction] = useState<string>("reschedule");
    const [comments, setComments] = useState<string>("");
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    const handleSubmitAction = async () => {
        try {
            setIsSubmitting(true);
            await new Promise(resolve => setTimeout(resolve, 1000));
            console.log("Submitted action:", { action: selectedAction, comments });

            toast.success("Action submitted successfully!");
            setComments("");
        } catch (error) {
            toast.error("Failed to submit action. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
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
                    <Link to="/seller/dashboard/ndr">
                        <Button variant="outline" size="icon">
                            <ArrowLeftIcon className="size-5" />
                        </Button>
                    </Link>
                    <h1 className="text-xl font-medium">
                        NDR Details - AWB #{ndrDetails.awb}
                    </h1>
                </div>

                {/* Top Section */}
                <div className="grid lg:grid-cols-5 gap-6">
                    {/* Status Box */}
                    <div className="lg:col-span-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl shadow-lg shadow-neutral-400/20 p-8">
                        <div className="flex justify-between items-start mb-6">
                            <h2 className="text-lg font-medium">
                                NDR Status
                            </h2>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-white hover:text-white hover:bg-white/10"
                                onClick={() => copyToClipboard(ndrDetails.status)}
                            >
                                <Copy className="size-5" />
                            </Button>
                        </div>
                        <div className="space-y-2">
                            <div className="text-3xl font-bold tracking-tighter">
                                {ndrDetails.status}
                            </div>
                            <div className="text-xl">
                                {ndrDetails.reason}
                            </div>
                            <div className="text-sm opacity-80">
                                Last attempt: {ndrDetails.lastAttemptDate}
                            </div>
                        </div>
                        <div className="mt-8">
                            <div className="text-sm opacity-80">
                                Delivery Attempts:
                            </div>
                            <div className="text-2xl font-medium mt-1">
                                {ndrDetails.attempts}
                            </div>
                        </div>
                    </div>

                    {/* Right Section with Map and Attempts */}
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
                                        center={{ lat: 0, lng: 0 }}
                                        zoom={10}
                                    >
                                        <Marker position={{ lat: 0, lng: 0 }} />
                                    </GoogleMap>
                                </LoadScript>
                            </div>

                            {/* Delivery Attempts Timeline */}
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
                                            {ndrDetails.courier}
                                        </span>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm text-gray-500">
                                            Order ID
                                        </div>
                                        <div className="font-medium text-purple-500 cursor-pointer hover:underline">
                                            {ndrDetails.orderNo}
                                        </div>
                                    </div>
                                </div>

                                {/* Attempts Timeline */}
                                <ScrollArea className="h-[240px]">
                                    <div className="p-2 md:p-4 relative">
                                        {ndrDetails.deliveryAttempts.map((attempt, index) => (
                                            <div key={index} className="relative">
                                                <div className="flex gap-4 mb-6">
                                                    {/* Date/Time Column */}
                                                    <div className="w-12 md:w-24 flex flex-col text-sm">
                                                        <span className="font-medium">
                                                            {attempt.date}
                                                        </span>
                                                    </div>

                                                    {/* Timeline Dot and Line */}
                                                    <div className="flex flex-col items-center relative">
                                                        {index !== ndrDetails.deliveryAttempts.length - 1 && (
                                                            <div className="w-px h-[150%] border border-border border-dashed absolute" />
                                                        )}
                                                        <div className="size-3 rounded-full bg-red-400 z-10 relative">
                                                            <div className="size-5 rounded-full bg-transparent border border-border z-10 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Attempt Details */}
                                                    <div className="flex-1">
                                                        <p className="text-sm">
                                                            <span className="font-medium">
                                                                Status:{" "}
                                                            </span>
                                                            <span className="text-red-500 font-medium">
                                                                {attempt.status}
                                                            </span>
                                                        </p>
                                                        <p className="text-sm mt-1">
                                                            <span className="font-medium">
                                                                Reason:{" "}
                                                            </span>
                                                            <span className="text-muted-foreground">
                                                                {attempt.reason}
                                                            </span>
                                                        </p>
                                                        <div className="text-sm mt-2">
                                                            <span className="font-medium">
                                                                Location:{" "}
                                                            </span>
                                                            <span className="text-muted-foreground">
                                                                {attempt.location}
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

                {/* Customer and Product Details Section */}
                <div className="grid lg:grid-cols-2 gap-6 w-full">
                    <Card className="shadow-lg shadow-neutral-400/20 rounded-xl border border-border/60">
                        <CardHeader className="border-b border-border/60">
                            <CardTitle className="flex items-center gap-2">
                                <PackageIcon className="size-5" />
                                Customer Details
                            </CardTitle>
                        </CardHeader>
                        <div className="max-h-[400px] overflow-y-auto">
                            <CardContent className="p-4 lg:p-6">
                                <div className="space-y-4">
                                    <div className="pb-4 border-b border-border/60">
                                        <p className="text-sm text-muted-foreground mb-2">Customer Name</p>
                                        <p className="font-medium">{ndrDetails.customerDetails.name}</p>
                                    </div>
                                    <div className="pb-4 border-b border-border/60">
                                        <p className="text-sm text-muted-foreground mb-2">
                                            Contact Information
                                        </p>
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <PhoneIcon className="h-4 w-4 text-muted-foreground" />
                                                <p className="font-medium">
                                                    {ndrDetails.customerDetails.phone}
                                                </p>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6"
                                                    onClick={() => copyToClipboard(ndrDetails.customerDetails.phone)}
                                                >
                                                    <Copy className="h-4 w-4" />
                                                </Button>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <MailIcon className="h-4 w-4 text-muted-foreground" />
                                                <p className="font-medium">
                                                    {ndrDetails.customerDetails.email}
                                                </p>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6"
                                                    onClick={() => copyToClipboard(ndrDetails.customerDetails.email)}
                                                >
                                                    <Copy className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="pb-4 border-b border-border/60">
                                        <p className="text-sm text-muted-foreground mb-2">
                                            Shipping Address
                                        </p>
                                        <div className="space-y-1">
                                            <p className="font-medium">
                                                {ndrDetails.customerDetails.address}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="pb-4 border-b border-border/60">
                                        <p className="text-sm text-muted-foreground mb-2">
                                            Order Information
                                        </p>
                                        <div className="space-y-2">
                                            <div className="flex justify-between">
                                                <span>Order ID:</span>
                                                <span className="font-medium">{ndrDetails.orderNo}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Order Date:</span>
                                                <span className="font-medium">{ndrDetails.orderDate}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>AWB Number:</span>
                                                <span className="font-medium">{ndrDetails.awb}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Courier:</span>
                                                <span className="font-medium">{ndrDetails.courier}</span>
                                            </div>
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
                                                            <div className="min-w-0">
                                                                <p className="font-medium line-clamp-1">
                                                                    {product.name}
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

                {/* NDR Actions Card */}
                <Card className="shadow-lg shadow-neutral-400/20 rounded-xl border border-border/60">
                    <CardHeader className="border-b border-border/60">
                        <CardTitle className="flex items-center gap-2">
                            NDR Actions
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="space-y-6">
                            <div className="space-y-4">
                                <h3 className="font-medium">Select Action</h3>
                                <RadioGroup
                                    value={selectedAction}
                                    onValueChange={setSelectedAction}
                                    className="grid grid-cols-1 md:grid-cols-3 gap-4"
                                >
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="reschedule" id="reschedule" />
                                        <Label htmlFor="reschedule">Reschedule Delivery</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="update-address" id="update-address" />
                                        <Label htmlFor="update-address">Update Address</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="update-phone" id="update-phone" />
                                        <Label htmlFor="update-phone">Update Phone</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="cancel" id="cancel" />
                                        <Label htmlFor="cancel">Cancel Order</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="return" id="return" />
                                        <Label htmlFor="return">Return to Origin</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="other" id="other" />
                                        <Label htmlFor="other">Other</Label>
                                    </div>
                                </RadioGroup>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="comments">Comments</Label>
                                <Textarea
                                    id="comments"
                                    placeholder="Add any additional information or instructions here..."
                                    value={comments}
                                    onChange={(e) => setComments(e.target.value)}
                                    className="min-h-[100px]"
                                />
                            </div>

                            <div className="flex flex-wrap gap-4">
                                <Button
                                    className="bg-violet-600 hover:bg-violet-700 text-white"
                                    onClick={handleSubmitAction}
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? "Submitting..." : "Submit Action"}
                                </Button>
                                <Button variant="outline">
                                    <PhoneIcon className="h-4 w-4 mr-2" />
                                    Call Customer
                                </Button>
                                <Button variant="outline">
                                    <MessageSquareIcon className="h-4 w-4 mr-2" />
                                    Send SMS
                                </Button>
                                <Button variant="outline">
                                    <MailIcon className="h-4 w-4 mr-2" />
                                    Send Email
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
};

export default NDRDetailsPage; 