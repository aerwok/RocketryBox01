import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeftIcon, Copy, Edit, Printer, X, RefreshCw } from "lucide-react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface OrderDetails {
    orderNo: string;
    orderDate: string;
    totalAmount: string;
    paymentType: string;
    orderCreationType: string;
    shipmentType: string;
    weight: string;
    status: string;
    category: string;
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
        image: string;
        name: string;
        sku: string;
        quantity: number;
        price: number;
        total: number;
    }[];
}

const AdminOrderDetailsPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [isUpdateTrackingOpen, setIsUpdateTrackingOpen] = useState(false);
    const [trackingNumber, setTrackingNumber] = useState("");
    const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
    const [cancelReason, setCancelReason] = useState("");
    
    const [orderDetails] = useState<OrderDetails>({
        orderNo: id || "ORD-2025-002",
        orderDate: "2024-02-20",
        totalAmount: "₹74937.00",
        paymentType: "COD",
        orderCreationType: "Single (Manual) Order",
        shipmentType: "Forward Shipment",
        weight: "2.5 kg",
        status: "not-booked",
        category: "Gaming",
        customerDetails: {
            name: "Rahul Sharma",
            address: "Flat 303, Tower B, Green Valley Apartments\nSector 62, Noida\nNOIDA, UTTAR PRADESH 201309\nIndia",
            phone: "9876543210"
        },
        warehouseDetails: {
            name: "RocketryBox Warehouse",
            address: "Plot No. 123, Industrial Area\nPUNE, MAHARASHTRA 411014\nIndia",
            phone: "020-12345678"
        },
        products: [
            {
                image: "/images/gaming-laptop.jpg",
                name: "Gaming Laptop",
                sku: "LAP-GAM-001",
                quantity: 1,
                price: 69999.00,
                total: 69999.00
            },
            {
                image: "/images/gaming-mouse.jpg",
                name: "Gaming Mouse",
                sku: "MOU-GAM-001",
                quantity: 2,
                price: 2499.00,
                total: 4998.00
            },
            {
                image: "/images/gaming-headset.jpg",
                name: "Gaming Headset",
                sku: "HEA-GAM-001",
                quantity: 1,
                price: 4999.00,
                total: 4999.00
            }
        ]
    });

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success("Copied to clipboard");
    };

    const handleEdit = () => {
        navigate(`/admin/dashboard/orders/edit/${id}`);
        toast.success("Navigating to edit order");
    };

    const handleDuplicate = () => {
        navigate('/seller/dashboard/new-order', {
            state: { duplicateFrom: orderDetails }
        });
        toast.success("Redirecting to seller dashboard to create duplicate order");
    };

    const handlePrintLabel = () => {
        toast.promise(
            new Promise((resolve) => setTimeout(resolve, 2000)),
            {
                loading: 'Generating shipping label...',
                success: () => {
                    // Create a simple text content for the PDF (in a real app, this would be actual PDF content)
                    const textContent = `
                    SHIPPING LABEL
                    ------------------
                    Order ID: ${orderDetails.orderNo}
                    Date: ${orderDetails.orderDate}
                    
                    Customer:
                    ${orderDetails.customerDetails.name}
                    ${orderDetails.customerDetails.address}
                    Phone: ${orderDetails.customerDetails.phone}
                    
                    Warehouse:
                    ${orderDetails.warehouseDetails.name}
                    ${orderDetails.warehouseDetails.address}
                    
                    Weight: ${orderDetails.weight}
                    Shipment Type: ${orderDetails.shipmentType}
                    
                    Products:
                    ${orderDetails.products.map(p => `${p.quantity}x ${p.name} (${p.sku})`).join('\n')}
                    `;
                    
                    // Create a blob with the text content
                    const blob = new Blob([textContent], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    
                    // Create a download link and trigger the download
                    const link = document.createElement('a');
                    link.href = url;
                    link.setAttribute('download', `shipping-label-${orderDetails.orderNo}.txt`);
                    document.body.appendChild(link);
                    link.click();
                    
                    // Clean up
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);
                    
                    return 'Shipping label downloaded successfully';
                },
                error: 'Failed to generate shipping label'
            }
        );
    };

    const handlePrintInvoice = () => {
        toast.promise(
            new Promise((resolve) => setTimeout(resolve, 2000)),
            {
                loading: 'Generating invoice...',
                success: () => {
                    // Calculate total
                    const subtotal = orderDetails.products.reduce((sum, product) => sum + product.total, 0);
                    const tax = subtotal * 0.18; // Assuming 18% tax
                    const total = subtotal + tax;
                    
                    // Create a simple text content for the PDF (in a real app, this would be actual PDF content)
                    const textContent = `
                    INVOICE
                    ------------------
                    Invoice #: INV-${orderDetails.orderNo}
                    Date: ${orderDetails.orderDate}
                    
                    Billed To:
                    ${orderDetails.customerDetails.name}
                    ${orderDetails.customerDetails.address}
                    Phone: ${orderDetails.customerDetails.phone}
                    
                    Products:
                    ${orderDetails.products.map(p => 
                        `${p.quantity}x ${p.name} (${p.sku}) - ₹${p.price.toFixed(2)}/item - ₹${p.total.toFixed(2)}`
                    ).join('\n')}
                    
                    Subtotal: ₹${subtotal.toFixed(2)}
                    Tax (18%): ₹${tax.toFixed(2)}
                    Total: ₹${total.toFixed(2)}
                    
                    Payment Method: ${orderDetails.paymentType}
                    
                    Thank you for your business!
                    `;
                    
                    // Create a blob with the text content
                    const blob = new Blob([textContent], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    
                    // Create a download link and trigger the download
                    const link = document.createElement('a');
                    link.href = url;
                    link.setAttribute('download', `invoice-${orderDetails.orderNo}.txt`);
                    document.body.appendChild(link);
                    link.click();
                    
                    // Clean up
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);
                    
                    return 'Invoice downloaded successfully';
                },
                error: 'Failed to generate invoice'
            }
        );
    };

    const handleCancelOrder = () => {
        setIsCancelDialogOpen(true);
    };

    const confirmCancelOrder = () => {
        if (!cancelReason.trim()) {
            toast.error("Please provide a reason for cancellation");
            return;
        }

        toast.promise(
            new Promise((resolve) => setTimeout(resolve, 2000)),
            {
                loading: 'Cancelling order...',
                success: () => {
                    setIsCancelDialogOpen(false);
                    setCancelReason("");
                    navigate("/admin/dashboard/orders");
                    return 'Order cancelled successfully';
                },
                error: 'Failed to cancel order'
            }
        );
    };

    const handleMarkAsShipped = () => {
        toast.promise(
            new Promise((resolve) => setTimeout(resolve, 2000)),
            {
                loading: 'Updating order status...',
                success: 'Order marked as shipped',
                error: 'Failed to update order status'
            }
        );
    };

    const handleUpdateTracking = () => {
        setIsUpdateTrackingOpen(true);
    };

    const confirmUpdateTracking = () => {
        if (!trackingNumber.trim()) {
            toast.error("Please provide a tracking number");
            return;
        }

        toast.promise(
            new Promise((resolve) => setTimeout(resolve, 2000)),
            {
                loading: 'Updating tracking number...',
                success: () => {
                    setIsUpdateTrackingOpen(false);
                    setTrackingNumber("");
                    return 'Tracking number updated successfully';
                },
                error: 'Failed to update tracking number'
            }
        );
    };

    return (
        <div className="container py-4 max-w-7xl mx-auto">
            {/* Header with back button and actions */}
            <div className="flex items-center mb-4">
                <Link to="/admin/dashboard/orders" className="mr-4">
                    <ArrowLeftIcon className="h-5 w-5" />
                </Link>
                <h1 className="text-lg font-semibold">Order Details</h1>

                <div className="flex ml-auto space-x-2">
                    <Button variant="outline" size="sm" onClick={handleEdit}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleDuplicate}>
                        <Copy className="h-4 w-4 mr-2" />
                        Duplicate
                    </Button>
                    <Button variant="outline" size="sm" onClick={handlePrintLabel}>
                        <Printer className="h-4 w-4 mr-2" />
                        Print Label
                    </Button>
                    <Button variant="outline" size="sm" onClick={handlePrintInvoice}>
                        <Printer className="h-4 w-4 mr-2" />
                        Print Invoice
                    </Button>
                    <Button variant="destructive" size="sm" onClick={handleCancelOrder}>
                        <X className="h-4 w-4 mr-2" />
                        Cancel Order
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleMarkAsShipped}>
                        Mark as Shipped
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleUpdateTracking}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Update Tracking
                    </Button>
                </div>
            </div>

            {/* Order information section */}
            <Card className="mb-4">
                <CardContent className="p-6">
                    <h2 className="text-lg font-semibold mb-4">Order Information</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div>
                            <div className="text-sm text-gray-500">Order ID</div>
                            <div className="flex items-center">
                                <span className="font-medium">{orderDetails.orderNo}</span>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 ml-2" onClick={() => handleCopy(orderDetails.orderNo)}>
                                    <Copy className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                        <div>
                            <div className="text-sm text-gray-500">Order Date</div>
                            <div className="font-medium">{orderDetails.orderDate}</div>
                        </div>
                        <div>
                            <div className="text-sm text-gray-500">Total Amount</div>
                            <div className="font-medium">{orderDetails.totalAmount}</div>
                        </div>
                        <div>
                            <div className="text-sm text-gray-500">Payment Type</div>
                            <div className="font-medium">{orderDetails.paymentType}</div>
                        </div>
                        <div>
                            <div className="text-sm text-gray-500">Order Creation Type</div>
                            <div className="font-medium">{orderDetails.orderCreationType}</div>
                        </div>
                        <div>
                            <div className="text-sm text-gray-500">Shipment Type</div>
                            <div className="font-medium">{orderDetails.shipmentType}</div>
                        </div>
                        <div>
                            <div className="text-sm text-gray-500">Weight</div>
                            <div className="font-medium">{orderDetails.weight}</div>
                        </div>
                        <div>
                            <div className="text-sm text-gray-500">Status</div>
                            <Badge variant="outline" className="bg-yellow-50 text-yellow-800 border-yellow-200">
                                {orderDetails.status}
                            </Badge>
                        </div>
                        <div>
                            <div className="text-sm text-gray-500">Category</div>
                            <div className="font-medium">{orderDetails.category}</div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Customer and Warehouse details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {/* Customer details */}
                <Card>
                    <CardContent className="p-6">
                        <h2 className="text-lg font-semibold mb-4">Customer Details</h2>
                        <div className="space-y-3">
                            <div>
                                <div className="text-sm text-gray-500">Name</div>
                                <div className="font-medium">{orderDetails.customerDetails.name}</div>
                            </div>
                            <div>
                                <div className="text-sm text-gray-500">Address</div>
                                <div className="whitespace-pre-line">{orderDetails.customerDetails.address}</div>
                            </div>
                            <div>
                                <div className="text-sm text-gray-500">Phone</div>
                                <div className="font-medium">{orderDetails.customerDetails.phone}</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Warehouse details */}
                <Card>
                    <CardContent className="p-6">
                        <h2 className="text-lg font-semibold mb-4">Warehouse Details</h2>
                        <div className="space-y-3">
                            <div>
                                <div className="text-sm text-gray-500">Name</div>
                                <div className="font-medium">{orderDetails.warehouseDetails.name}</div>
                            </div>
                            <div>
                                <div className="text-sm text-gray-500">Address</div>
                                <div className="whitespace-pre-line">{orderDetails.warehouseDetails.address}</div>
                            </div>
                            <div>
                                <div className="text-sm text-gray-500">Phone</div>
                                <div className="font-medium">{orderDetails.warehouseDetails.phone}</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Products table */}
            <Card>
                <CardContent className="p-6">
                    <h2 className="text-lg font-semibold mb-4">Products</h2>
                    <Table>
                        <TableHeader className="bg-gray-50">
                            <TableRow>
                                <TableHead className="w-12">PRODUCT</TableHead>
                                <TableHead>SKU</TableHead>
                                <TableHead className="text-center">QUANTITY</TableHead>
                                <TableHead className="text-right">PRICE</TableHead>
                                <TableHead className="text-right">TOTAL</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {orderDetails.products.map((product, index) => (
                                <TableRow key={index}>
                                    <TableCell className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center overflow-hidden">
                                            <img src={product.image} alt={product.name} className="h-8 w-8 object-contain" />
                                        </div>
                                        <span className="font-medium">{product.name}</span>
                                    </TableCell>
                                    <TableCell>{product.sku}</TableCell>
                                    <TableCell className="text-center">{product.quantity}</TableCell>
                                    <TableCell className="text-right">₹{product.price.toFixed(2)}</TableCell>
                                    <TableCell className="text-right">₹{product.total.toFixed(2)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    <div className="flex justify-end mt-6">
                        <div className="w-64">
                            <div className="flex justify-between font-medium text-lg">
                                <span>Total Amount:</span>
                                <span>{orderDetails.totalAmount}</span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Update Tracking Dialog */}
            <Dialog open={isUpdateTrackingOpen} onOpenChange={setIsUpdateTrackingOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Update Tracking Number</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <Label htmlFor="tracking-number">Tracking Number</Label>
                        <Input
                            id="tracking-number"
                            value={trackingNumber}
                            onChange={(e) => setTrackingNumber(e.target.value)}
                            placeholder="Enter tracking number"
                            className="mt-2"
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsUpdateTrackingOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={confirmUpdateTracking}>
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
                    <div className="py-4">
                        <Label htmlFor="cancel-reason">Reason for Cancellation</Label>
                        <Input
                            id="cancel-reason"
                            value={cancelReason}
                            onChange={(e) => setCancelReason(e.target.value)}
                            placeholder="Enter reason for cancellation"
                            className="mt-2"
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCancelDialogOpen(false)}>
                            Go Back
                        </Button>
                        <Button variant="destructive" onClick={confirmCancelOrder}>
                            Cancel Order
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default AdminOrderDetailsPage; 