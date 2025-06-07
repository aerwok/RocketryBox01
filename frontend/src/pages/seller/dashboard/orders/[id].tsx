import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ServiceFactory } from "@/services/service-factory";
import {
  ArrowLeftIcon,
  CheckCircle,
  Clock,
  Copy,
  Edit,
  Package,
  Printer,
  RefreshCw,
  Truck,
  X
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

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
  status: "not-booked" | "processing" | "booked" | "cancelled" | "shipment-cancelled" | "error" | "delivered";
  // Package details for shipping
  package?: {
    weight: number;
    dimensions: {
      length: number;
      width: number;
      height: number;
    };
    volumetricWeight?: number;
    actualWeight?: number;
    chargeableWeight?: number;
  };
  // Shipping details
  shipping?: {
    mode: string;
    warehouse: string;
    fromPincode: string;
    toPincode: string;
    estimatedWeight: number;
  };
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
  tracking?: {
    awb: string;
    courier: string;
    expectedDelivery: string;
  };
  timeline?: {
    status: string;
    timestamp: string;
    comment?: string;
    location?: string;
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

      {/* Package and Shipping Information */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-4">
            <h3 className="text-lg font-semibold mb-4">Package Details</h3>
            <div className="space-y-4">
              <div>
                <Label className="text-sm text-gray-500">Total Weight</Label>
                <p className="font-medium">{orderDetails.weight || orderDetails.package?.weight + ' kg' || 'Not specified'}</p>
              </div>
              {orderDetails.package?.dimensions && (
                <div>
                  <Label className="text-sm text-gray-500">Dimensions (L×W×H)</Label>
                  <p className="font-medium">
                    {orderDetails.package.dimensions.length} × {orderDetails.package.dimensions.width} × {orderDetails.package.dimensions.height} cm
                  </p>
                </div>
              )}
              {orderDetails.package?.volumetricWeight && (
                <div>
                  <Label className="text-sm text-gray-500">Volumetric Weight</Label>
                  <p className="font-medium">{orderDetails.package.volumetricWeight.toFixed(2)} kg</p>
                </div>
              )}
              {orderDetails.package?.chargeableWeight && (
                <div>
                  <Label className="text-sm text-gray-500">Chargeable Weight</Label>
                  <p className="font-medium text-purple-600">{orderDetails.package.chargeableWeight.toFixed(2)} kg</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <h3 className="text-lg font-semibold mb-4">Shipping Information</h3>
            <div className="space-y-4">
              <div>
                <Label className="text-sm text-gray-500">Payment Method</Label>
                <Badge variant={orderDetails.payment === 'COD' ? 'destructive' : 'default'}>
                  {orderDetails.payment}
                </Badge>
              </div>
              <div>
                <Label className="text-sm text-gray-500">Channel</Label>
                <Badge variant="outline">{orderDetails.channel}</Badge>
              </div>
              <div>
                <Label className="text-sm text-gray-500">Shipment Type</Label>
                <p className="font-medium">{orderDetails.shipmentType}</p>
              </div>
              {orderDetails.shipping?.mode && (
                <div>
                  <Label className="text-sm text-gray-500">Shipping Mode</Label>
                  <p className="font-medium">{orderDetails.shipping.mode}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <h3 className="text-lg font-semibold mb-4">Shipping Routes</h3>
            <div className="space-y-4">
              {orderDetails.shipping?.fromPincode && (
                <div>
                  <Label className="text-sm text-gray-500">From Pincode</Label>
                  <p className="font-medium">{orderDetails.shipping.fromPincode}</p>
                </div>
              )}
              {orderDetails.shipping?.toPincode && (
                <div>
                  <Label className="text-sm text-gray-500">To Pincode</Label>
                  <p className="font-medium">{orderDetails.shipping.toPincode}</p>
                </div>
              )}
              {orderDetails.shipping?.warehouse && (
                <div>
                  <Label className="text-sm text-gray-500">Warehouse</Label>
                  <p className="font-medium">{orderDetails.shipping.warehouse}</p>
                </div>
              )}
              {orderDetails.shipping?.estimatedWeight && (
                <div>
                  <Label className="text-sm text-gray-500">Estimated Weight</Label>
                  <p className="font-medium">{orderDetails.shipping.estimatedWeight.toFixed(2)} kg</p>
                </div>
              )}
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

      {/* Tracking System */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-6">Order Tracking</h3>

          {/* Tracking Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-gray-50 p-4 rounded-lg">
              <Label className="text-sm text-gray-500">AWB Number</Label>
              <div className="flex items-center gap-2 mt-1">
                <p className="font-medium">{orderDetails.tracking?.awb || 'Not assigned'}</p>
                {orderDetails.tracking?.awb && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleCopy(orderDetails.tracking?.awb || '')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <Label className="text-sm text-gray-500">Courier Partner</Label>
              <p className="font-medium mt-1">{orderDetails.tracking?.courier || 'Not assigned'}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <Label className="text-sm text-gray-500">Expected Delivery</Label>
              <p className="font-medium mt-1">{orderDetails.tracking?.expectedDelivery || 'TBD'}</p>
            </div>
          </div>

          {/* Tracking Timeline */}
          <div className="space-y-6">
            <h4 className="font-semibold text-gray-800">Order Timeline</h4>

            {/* Visual Timeline */}
            <div className="relative">
              <div className="flex items-center justify-between mb-8">
                {/* Order Placed */}
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${orderDetails.status !== 'cancelled' ? 'bg-green-500 border-green-500 text-white' : 'bg-gray-300 border-gray-300 text-gray-600'
                    }`}>
                    <Package className="w-5 h-5" />
                  </div>
                  <p className="text-sm font-medium mt-2">Order Placed</p>
                  <p className="text-xs text-gray-500">{new Date(orderDetails.date).toLocaleDateString()}</p>
                </div>

                {/* Processing */}
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${['processing', 'booked'].includes(orderDetails.status) ? 'bg-blue-500 border-blue-500 text-white' :
                    orderDetails.status === 'cancelled' ? 'bg-gray-300 border-gray-300 text-gray-600' :
                      'bg-gray-100 border-gray-300 text-gray-600'
                    }`}>
                    <Clock className="w-5 h-5" />
                  </div>
                  <p className="text-sm font-medium mt-2">Processing</p>
                  <p className="text-xs text-gray-500">
                    {orderDetails.status === 'processing' ? 'In Progress' :
                      orderDetails.status === 'cancelled' ? 'Cancelled' : 'Pending'}
                  </p>
                </div>

                {/* Shipped */}
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${orderDetails.status === 'booked' ? 'bg-blue-500 border-blue-500 text-white' :
                    orderDetails.status === 'cancelled' ? 'bg-gray-300 border-gray-300 text-gray-600' :
                      'bg-gray-100 border-gray-300 text-gray-600'
                    }`}>
                    <Truck className="w-5 h-5" />
                  </div>
                  <p className="text-sm font-medium mt-2">Shipped</p>
                  <p className="text-xs text-gray-500">
                    {orderDetails.status === 'booked' ? 'In Transit' :
                      orderDetails.status === 'cancelled' ? 'Cancelled' : 'Pending'}
                  </p>
                </div>

                {/* Delivered */}
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${orderDetails.status === 'delivered' ? 'bg-green-500 border-green-500 text-white' :
                    orderDetails.status === 'cancelled' ? 'bg-gray-300 border-gray-300 text-gray-600' :
                      'bg-gray-100 border-gray-300 text-gray-600'
                    }`}>
                    <CheckCircle className="w-5 h-5" />
                  </div>
                  <p className="text-sm font-medium mt-2">Delivered</p>
                  <p className="text-xs text-gray-500">
                    {orderDetails.status === 'delivered' ? 'Completed' :
                      orderDetails.status === 'cancelled' ? 'Cancelled' : 'Pending'}
                  </p>
                </div>
              </div>

              {/* Connecting Line */}
              <div className="absolute top-5 left-5 right-5 h-0.5 bg-gray-200 -z-10">
                <div className={`h-full transition-all duration-500 ${orderDetails.status === 'not-booked' ? 'w-0 bg-green-500' :
                  orderDetails.status === 'processing' ? 'w-1/3 bg-blue-500' :
                    orderDetails.status === 'booked' ? 'w-2/3 bg-blue-500' :
                      orderDetails.status === 'delivered' ? 'w-full bg-green-500' :
                        'w-1/4 bg-red-500'
                  }`}></div>
              </div>
            </div>

            {/* Detailed Timeline */}
            <div className="border-t pt-6">
              <h5 className="font-medium text-gray-800 mb-4">Detailed Timeline</h5>
              <div className="space-y-4">
                {orderDetails.timeline && orderDetails.timeline.length > 0 ? (
                  orderDetails.timeline.map((event, index) => (
                    <div key={index} className="flex items-start gap-4 p-3 bg-gray-50 rounded-lg">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-medium">{event.status}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(event.timestamp).toLocaleString()}
                          </p>
                        </div>
                        {event.comment && (
                          <p className="text-gray-600 mt-1">{event.comment}</p>
                        )}
                        {event.location && (
                          <p className="text-sm text-gray-500 mt-1">📍 {event.location}</p>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex items-start gap-4 p-3 bg-gray-50 rounded-lg">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">Order Created</p>
                        <p className="text-sm text-gray-500">
                          {new Date(orderDetails.date).toLocaleString()}
                        </p>
                      </div>
                      <p className="text-gray-600 mt-1">Your order has been successfully placed and is being processed.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Current Status Alert */}
            {orderDetails.status === 'cancelled' && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <X className="w-5 h-5 text-red-600" />
                  <p className="font-medium text-red-800">Order Cancelled</p>
                </div>
                <p className="text-red-700 mt-1">This order has been cancelled and will not be processed.</p>
              </div>
            )}

            {orderDetails.status === 'booked' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <Truck className="w-5 h-5 text-blue-600" />
                  <p className="font-medium text-blue-800">Order Shipped</p>
                </div>
                <p className="text-blue-700 mt-1">Your order is on its way to the customer.</p>
                {orderDetails.tracking?.awb && (
                  <p className="text-blue-700 mt-1">Track with AWB: <strong>{orderDetails.tracking?.awb}</strong></p>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

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
              {orderDetails.products.map((product, index) => {
                // Since product.price represents total amount, calculate unit price
                const unitPrice = product.price / product.quantity;
                const totalAmount = product.price; // This is the actual total, not price × quantity

                return (
                  <TableRow key={index}>
                    <TableCell>{product.name}</TableCell>
                    <TableCell>{product.sku}</TableCell>
                    <TableCell>{product.quantity}</TableCell>
                    <TableCell>₹{unitPrice.toFixed(2)}</TableCell>
                    <TableCell>₹{totalAmount.toFixed(2)}</TableCell>
                  </TableRow>
                );
              })}
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
