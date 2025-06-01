import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { orderService } from '../../services/order.service';
import { paymentService } from '../../services/payment.service';

interface OrderDetails {
  _id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  totalAmount: number;
  shippingRate: number;
  packageDetails: {
    weight: number;
    dimensions: {
      length: number;
      width: number;
      height: number;
    };
    declaredValue: number;
  };
  pickupAddress: {
    name: string;
    phone: string;
    address: {
      line1: string;
      line2?: string;
      city: string;
      state: string;
      pincode: string;
    };
  };
  deliveryAddress: {
    name: string;
    phone: string;
    address: {
      line1: string;
      line2?: string;
      city: string;
      state: string;
      pincode: string;
    };
  };
  selectedProvider: {
    name: string;
    serviceType: string;
    estimatedDays: string;
    totalRate: number;
  };
  awb?: string;
  trackingUrl?: string;
  createdAt: string;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

const OrderDetails: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(false);

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
    }
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      const response = await orderService.getOrderById(orderId!);
      setOrder(response.data.data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to fetch order details');
      navigate('/customer/orders');
    } finally {
      setLoading(false);
    }
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async () => {
    if (!order) return;

    setPaymentLoading(true);
    try {
      // Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        toast.error('Failed to load payment gateway');
        return;
      }

      // Create payment order
      const paymentResponse = await paymentService.createPaymentOrder({
        orderId: order._id,
        amount: order.totalAmount
      });

      const { razorpayOrderId, amount, currency } = paymentResponse.data;

      // Razorpay options
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: amount,
        currency: currency,
        name: 'RocketryBox',
        description: `Payment for Order #${order.orderNumber}`,
        order_id: razorpayOrderId,
        handler: async (response: any) => {
          try {
            // Verify payment
            const verifyResponse = await paymentService.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              orderId: order._id
            });

            if (verifyResponse.data.success) {
              console.log('✅ Payment verification response:', verifyResponse.data);
              
              // Enhanced success notification
              const awbNumber = verifyResponse.data?.awb;
              
              toast.success(
                <div className="flex flex-col gap-1">
                  <div className="font-semibold">🎉 Order Created Successfully!</div>
                  <div className="text-sm text-gray-600">
                    Order #{order.orderNumber} has been confirmed and is being processed.
                  </div>
                  {awbNumber && (
                    <div className="text-sm text-gray-600">
                      AWB: {awbNumber}
                    </div>
                  )}
                </div>,
                {
                  duration: 6000,
                  className: "success-toast"
                }
              );
              
              // Refresh order details to get AWB after a delay
              setTimeout(() => {
                fetchOrderDetails();
              }, 2000);
            }
          } catch (error: any) {
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
          name: order.pickupAddress?.name || '',
          contact: order.pickupAddress?.phone || '',
        },
        theme: {
          color: '#3B82F6'
        },
        modal: {
          ondismiss: () => {
            setPaymentLoading(false);
          }
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to initiate payment');
    } finally {
      setPaymentLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Order Not Found</h2>
          <button
            onClick={() => navigate('/customer/orders')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string | undefined) => {
    if (!status) return 'bg-gray-100 text-gray-800';
    switch (status.toLowerCase()) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'shipped': return 'bg-blue-100 text-blue-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status: string | undefined) => {
    if (!status) return 'bg-gray-100 text-gray-800';
    switch (status.toLowerCase()) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'paid': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Order Details</h1>
              <p className="text-gray-600">Order #{order.orderNumber}</p>
            </div>
            <div className="flex items-center space-x-4">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                {order.status ? order.status.charAt(0).toUpperCase() + order.status.slice(1) : 'Unknown'}
              </span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPaymentStatusColor(order.paymentStatus)}`}>
                Payment: {order.paymentStatus ? order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1) : 'Unknown'}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Order Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Package Details */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Package Details</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Weight</p>
                  <p className="font-medium">{order.packageDetails?.weight || 'N/A'} kg</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Declared Value</p>
                  <p className="font-medium">₹{order.packageDetails?.declaredValue || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Dimensions (L×W×H)</p>
                  <p className="font-medium">
                    {order.packageDetails?.dimensions ? 
                      `${order.packageDetails.dimensions.length} × ${order.packageDetails.dimensions.width} × ${order.packageDetails.dimensions.height} cm` : 
                      'N/A'
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* Addresses */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Shipping Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Pickup Address */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Pickup Address</h3>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p className="font-medium text-gray-900">{order.pickupAddress?.name || 'N/A'}</p>
                    <p>{order.pickupAddress?.phone || 'N/A'}</p>
                    <p>{order.pickupAddress?.address?.line1 || 'N/A'}</p>
                    {order.pickupAddress?.address?.line2 && <p>{order.pickupAddress.address.line2}</p>}
                    <p>{order.pickupAddress?.address?.city || 'N/A'}, {order.pickupAddress?.address?.state || 'N/A'}</p>
                    <p>{order.pickupAddress?.address?.pincode || 'N/A'}</p>
                  </div>
                </div>

                {/* Delivery Address */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Delivery Address</h3>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p className="font-medium text-gray-900">{order.deliveryAddress?.name || 'N/A'}</p>
                    <p>{order.deliveryAddress?.phone || 'N/A'}</p>
                    <p>{order.deliveryAddress?.address?.line1 || 'N/A'}</p>
                    {order.deliveryAddress?.address?.line2 && <p>{order.deliveryAddress.address.line2}</p>}
                    <p>{order.deliveryAddress?.address?.city || 'N/A'}, {order.deliveryAddress?.address?.state || 'N/A'}</p>
                    <p>{order.deliveryAddress?.address?.pincode || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Shipping Provider */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Shipping Provider</h2>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{order.selectedProvider?.name || 'N/A'}</p>
                  <p className="text-sm text-gray-600">
                    {order.selectedProvider?.serviceType || 'N/A'} • Estimated delivery: {order.selectedProvider?.estimatedDays || 'N/A'} days
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">₹{order.selectedProvider?.totalRate || 0}</p>
                  <p className="text-sm text-gray-600">Shipping Rate</p>
                </div>
              </div>
            </div>

            {/* AWB Details */}
            {order.awb && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Tracking Information</h2>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">AWB Number</p>
                    <p className="font-medium text-gray-900 text-lg">{order.awb}</p>
                  </div>
                  {order.trackingUrl && (
                    <a
                      href={order.trackingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Track Package
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Payment Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Summary</h2>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping Rate</span>
                  <span className="font-medium">₹{order.shippingRate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Service Charges</span>
                  <span className="font-medium">₹{(order.totalAmount - order.shippingRate).toFixed(2)}</span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between">
                    <span className="text-lg font-semibold text-gray-900">Total Amount</span>
                    <span className="text-lg font-semibold text-gray-900">₹{order.totalAmount}</span>
                  </div>
                </div>
              </div>

              {/* Payment Button */}
              {order.paymentStatus === 'pending' && (
                <button
                  onClick={handlePayment}
                  disabled={paymentLoading}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {paymentLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Processing...
                    </div>
                  ) : (
                    `Pay ₹${order.totalAmount}`
                  )}
                </button>
              )}

              {order.paymentStatus === 'paid' && (
                <div className="text-center">
                  <div className="bg-green-100 text-green-800 py-3 px-4 rounded-lg">
                    <p className="font-medium">Payment Completed</p>
                    <p className="text-sm">Your order is being processed</p>
                  </div>
                </div>
              )}

              <div className="mt-4 text-center">
                <button
                  onClick={() => navigate('/customer/orders')}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  ← Back to Orders
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetails; 