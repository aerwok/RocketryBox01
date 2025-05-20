import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
    ArrowLeftIcon,
    Copy,
    Edit,
    Printer,
    X,
    RefreshCw,
    Truck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ServiceFactory } from "@/services/service-factory";

// Order details interface
interface OrderDetails {
    orderId: string;
    date: string;
    totalAmount: string;
    payment: "COD" | "Prepaid";
    channel: "MANUAL" | "EXCEL" | "SHOPIFY" | "WOOCOMMERCE" | "AMAZON" | "FLIPKART" | "OPENCART" | "API";
    shipmentType: "Forward" | "Reverse";
    weight: string;
    category: string;
    status: "not-booked" | "processing" | "booked" | "cancelled" | "shipment-cancelled" | "error";
    customerDetails: {
        name: string;
        address: string;
        phone: string;
    };
    warehouseDetails: {
        name: string;
        address: string;
        phone: string;
    };
    products: {
        name: string;
        sku: string;
        quantity: number;
        price: number;
        total: number;
        image: string;
    }[];
}

const SellerOrderDetailsPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [isUpdateTrackingOpen, setIsUpdateTrackingOpen] = useState(false);
    const [trackingNumber, setTrackingNumber] = useState("");
    const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
    const [cancelReason, setCancelReason] = useState("");
    const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchOrderDetails();
    }, [id]);

    const fetchOrderDetails = async () => {
        if (!id) return;

        try {
            setIsLoading(true);
            const response = await ServiceFactory.seller.order.getDetails(id);

            if (!response.success) {
                throw new Error(response.message || 'Failed to fetch order details');
            }

            setOrderDetails(response.data);
        } catch (error) {
            console.error('Error fetching order details:', error);
            toast.error('Failed to fetch order details');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success("Copied to clipboard");
    };

    const handleEdit = () => {
        navigate(`/seller/dashboard/orders/edit/${id}`);
        toast.success("Navigating to edit order");
    };

    const handleDuplicate = () => {
        if (!orderDetails) return;
        
        navigate('/seller/dashboard/new-order', {
            state: { duplicateFrom: orderDetails }
        });
        toast.success("Order duplicated. Create a new order with the same details.");
    };

    const handlePrintLabel = async () => {
        if (!id) return;

        try {
            setIsLoading(true);
            const response = await ServiceFactory.shipping.printLabel(id);
            
            if (!response.success) {
                throw new Error(response.message || 'Failed to generate shipping label');
            }

            const blob = response.data;
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `shipping-label-${id}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            toast.success('Shipping label downloaded successfully');
        } catch (error) {
            console.error('Error downloading shipping label:', error);
            toast.error('Failed to download shipping label');
        } finally {
            setIsLoading(false);
        }
    };

    const handlePrintInvoice = async () => {
        if (!id) return;

        try {
            setIsLoading(true);
            const response = await ServiceFactory.shipping.printInvoice(id);
            
            if (!response.success) {
                throw new Error(response.message || 'Failed to generate invoice');
            }

            const blob = response.data;
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `invoice-${id}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            toast.success('Invoice downloaded successfully');
        } catch (error) {
            console.error('Error downloading invoice:', error);
            toast.error('Failed to download invoice');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancelOrder = () => {
        setIsCancelDialogOpen(true);
    };

    const confirmCancelOrder = async () => {
        if (!id || !cancelReason.trim()) {
            toast.error("Please provide a reason for cancellation");
            return;
        }

        try {
            setIsLoading(true);
            const response = await ServiceFactory.seller.order.cancel(id, cancelReason);
            
            if (!response.success) {
                throw new Error(response.message || 'Failed to cancel order');
            }

            toast.success('Order cancelled successfully');
            setIsCancelDialogOpen(false);
            fetchOrderDetails();
        } catch (error) {
            console.error('Error cancelling order:', error);
            toast.error('Failed to cancel order');
        } finally {
            setIsLoading(false);
        }
    };

    const handleMarkAsShipped = async () => {
        if (!id) return;

        try {
            setIsLoading(true);
            const response = await ServiceFactory.seller.order.updateStatus(id, 'booked');
            
            if (!response.success) {
                throw new Error(response.message || 'Failed to mark order as shipped');
            }

            toast.success('Order marked as shipped successfully');
            fetchOrderDetails();
        } catch (error) {
            console.error('Error marking order as shipped:', error);
            toast.error('Failed to mark order as shipped');
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateTracking = () => {
        setIsUpdateTrackingOpen(true);
    };

    const confirmUpdateTracking = async () => {
        if (!id || !trackingNumber.trim()) {
            toast.error("Please enter a tracking number");
            return;
        }

        try {
            setIsLoading(true);
            const response = await ServiceFactory.seller.order.updateTracking(id, trackingNumber);
            
            if (!response.success) {
                throw new Error(response.message || 'Failed to update tracking number');
            }

            toast.success('Tracking number updated successfully');
            setIsUpdateTrackingOpen(false);
            fetchOrderDetails();
        } catch (error) {
            console.error('Error updating tracking number:', error);
            toast.error('Failed to update tracking number');
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading && !orderDetails) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
        );
    }

    if (!orderDetails) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen">
                <h2 className="text-2xl font-semibold mb-4">Order not found</h2>
                <Button onClick={() => navigate('/seller/dashboard/orders')}>
                    Back to Orders
                </Button>
            </div>
        );
    }

    return (
        <div className="w-full flex flex-col gap-y-6">
            {/* Header Section */}
            <div className="flex items-center justify-between w-full bg-white p-4 rounded-lg shadow-sm">
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate('/seller/dashboard/orders')}
                    >
                        <ArrowLeftIcon className="h-4 w-4" />
                    </Button>
                    <h1 className="text-xl lg:text-2xl font-semibold text-gray-800">
                        Order Details
                    </h1>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        onClick={handleEdit}
                        disabled={isLoading}
                    >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                    </Button>
                    <Button
                        variant="outline"
                        onClick={handleDuplicate}
                        disabled={isLoading}
                    >
                        <Copy className="w-4 h-4 mr-2" />
                        Duplicate
                    </Button>
                    <Button
                        variant="outline"
                        onClick={handlePrintInvoice}
                        disabled={isLoading}
                    >
                        <Printer className="w-4 h-4 mr-2" />
                        Print Invoice
                    </Button>
                    <Button
                        variant="outline"
                        onClick={handlePrintLabel}
                        disabled={isLoading}
                    >
                        <Printer className="w-4 h-4 mr-2" />
                        Print Label
                    </Button>
                </div>
            </div>

            {/* Order Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex flex-col gap-2">
                            <Label className="text-sm text-gray-500">Order ID</Label>
                            <div className="flex items-center gap-2">
                                <span className="font-medium">{orderDetails.orderId}</span>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleCopy(orderDetails.orderId)}
                                >
                                    <Copy className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex flex-col gap-2">
                            <Label className="text-sm text-gray-500">Date</Label>
                            <span className="font-medium">{new Date(orderDetails.date).toLocaleDateString()}</span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex flex-col gap-2">
                            <Label className="text-sm text-gray-500">Total Amount</Label>
                            <span className="font-medium">{orderDetails.totalAmount}</span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex flex-col gap-2">
                            <Label className="text-sm text-gray-500">Status</Label>
                            <Badge
                                variant={
                                    orderDetails.status === 'booked' ? 'default' :
                                    orderDetails.status === 'processing' ? 'secondary' :
                                    orderDetails.status === 'cancelled' || orderDetails.status === 'shipment-cancelled' ? 'destructive' :
                                    'outline'
                                }
                            >
                                {orderDetails.status.charAt(0).toUpperCase() + orderDetails.status.slice(1).replace('-', ' ')}
                            </Badge>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Customer and Warehouse Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardContent className="p-4">
                        <h3 className="text-lg font-semibold mb-4">Customer Information</h3>
                        <div className="space-y-4">
                            <div>
                                <Label className="text-sm text-gray-500">Name</Label>
                                <p className="font-medium">{orderDetails.customerDetails.name}</p>
                            </div>
                            <div>
                                <Label className="text-sm text-gray-500">Address</Label>
                                <p className="font-medium whitespace-pre-line">{orderDetails.customerDetails.address}</p>
                            </div>
                            <div>
                                <Label className="text-sm text-gray-500">Phone</Label>
                                <div className="flex items-center gap-2">
                                    <p className="font-medium">{orderDetails.customerDetails.phone}</p>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleCopy(orderDetails.customerDetails.phone)}
                                    >
                                        <Copy className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <h3 className="text-lg font-semibold mb-4">Warehouse Information</h3>
                        <div className="space-y-4">
                            <div>
                                <Label className="text-sm text-gray-500">Name</Label>
                                <p className="font-medium">{orderDetails.warehouseDetails.name}</p>
                            </div>
                            <div>
                                <Label className="text-sm text-gray-500">Address</Label>
                                <p className="font-medium whitespace-pre-line">{orderDetails.warehouseDetails.address}</p>
                            </div>
                            <div>
                                <Label className="text-sm text-gray-500">Phone</Label>
                                <div className="flex items-center gap-2">
                                    <p className="font-medium">{orderDetails.warehouseDetails.phone}</p>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleCopy(orderDetails.warehouseDetails.phone)}
                                    >
                                        <Copy className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Products Table */}
            <Card>
                <CardContent className="p-4">
                    <h3 className="text-lg font-semibold mb-4">Products</h3>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Product</TableHead>
                                <TableHead>SKU</TableHead>
                                <TableHead>Quantity</TableHead>
                                <TableHead>Price</TableHead>
                                <TableHead>Total</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {orderDetails.products.map((product, index) => (
                                <TableRow key={index}>
                                    <TableCell>{product.name}</TableCell>
                                    <TableCell>{product.sku}</TableCell>
                                    <TableCell>{product.quantity}</TableCell>
                                    <TableCell>₹{product.price.toFixed(2)}</TableCell>
                                    <TableCell>₹{product.total.toFixed(2)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex justify-end gap-4">
                {orderDetails.status === 'not-booked' && (
                    <Button
                        variant="default"
                        onClick={handleMarkAsShipped}
                        disabled={isLoading}
                    >
                        <Truck className="w-4 h-4 mr-2" />
                        Mark as Shipped
                    </Button>
                )}
                {orderDetails.status === 'booked' && (
                    <Button
                        variant="outline"
                        onClick={handleUpdateTracking}
                        disabled={isLoading}
                    >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Update Tracking
                    </Button>
                )}
                {orderDetails.status !== 'cancelled' && orderDetails.status !== 'shipment-cancelled' && (
                    <Button
                        variant="destructive"
                        onClick={handleCancelOrder}
                        disabled={isLoading}
                    >
                        <X className="w-4 h-4 mr-2" />
                        Cancel Order
                    </Button>
                )}
            </div>

            {/* Update Tracking Dialog */}
            <Dialog open={isUpdateTrackingOpen} onOpenChange={setIsUpdateTrackingOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Update Tracking Number</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="tracking">Tracking Number</Label>
                            <Input
                                id="tracking"
                                value={trackingNumber}
                                onChange={(e) => setTrackingNumber(e.target.value)}
                                placeholder="Enter tracking number"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsUpdateTrackingOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={confirmUpdateTracking} disabled={isLoading}>
                            Update
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Cancel Order Dialog */}
            <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Cancel Order</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="reason">Reason for Cancellation</Label>
                            <Input
                                id="reason"
                                value={cancelReason}
                                onChange={(e) => setCancelReason(e.target.value)}
                                placeholder="Enter reason for cancellation"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCancelDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={confirmCancelOrder} disabled={isLoading}>
                            Confirm Cancellation
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default SellerOrderDetailsPage; 