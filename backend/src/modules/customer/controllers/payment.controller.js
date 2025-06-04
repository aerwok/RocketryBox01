import Razorpay from 'razorpay';
import { AppError } from '../../../middleware/errorHandler.js';
import { razorpayService } from '../../../services/razorpay.service.js';
import CustomerOrder from '../models/customerOrder.model.js';
import Payment from '../models/payment.model.js';

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/**
 * Payment Controller
 * Handles all payment-related operations for customer orders
 */

class PaymentController {

  /**
   * Create payment order
   */
  static async createPaymentOrder(req, res, next) {
    try {
      const { amount, currency = 'INR', orderData } = req.body;
      const customerId = req.user.id;

      // Validate that we have order data for creating the order
      if (!orderData) {
        return next(new AppError('Order data is required to create payment', 400));
      }

      // Validate essential order data fields
      if (!orderData.pickupAddress || !orderData.deliveryAddress || !orderData.package) {
        return next(new AppError('Incomplete order data provided', 400));
      }

      // Generate temporary receipt for payment
      const tempReceipt = `temp_${Date.now().toString().slice(-8)}_${Math.floor(Math.random() * 1000)}`;

      // Create Razorpay order with temporary data
      const razorpayResult = await razorpayService.createOrder({
        amount: amount,
        currency,
        receipt: tempReceipt,
        notes: {
          customerId: customerId.toString(),
          customerEmail: req.user.email,
          pickupPincode: orderData.pickupAddress.pincode,
          deliveryPincode: orderData.deliveryAddress.pincode,
          weight: orderData.package.weight,
          temporaryOrder: 'true'
        }
      });

      if (!razorpayResult.success) {
        console.error('❌ Razorpay order creation failed:', {
          error: razorpayResult.error,
          details: razorpayResult.details,
          amount
        });
        return next(new AppError(`Failed to create payment order: ${razorpayResult.error}`, 500));
      }

      // Create payment record in database (without order reference initially)
      const payment = new Payment({
        customerId,
        razorpayOrderId: razorpayResult.order.id,
        amount,
        currency,
        status: 'created',
        metadata: {
          createdAt: new Date(),
          temporaryOrderData: orderData, // Store order data in payment metadata
          razorpayOrderData: razorpayResult.order
        }
      });

      await payment.save();

      console.log('💳 Payment order created for temporary order:', {
        paymentId: payment._id,
        razorpayOrderId: razorpayResult.order.id,
        amount,
        customerId
      });

      res.status(201).json({
        success: true,
        data: {
          paymentId: payment._id,
          razorpayOrder: razorpayResult.order,
          orderId: razorpayResult.order.id, // This is the Razorpay order ID
          keyId: process.env.RAZORPAY_KEY_ID, // Send key ID for frontend
          amount,
          currency,
          prefill: {
            name: req.user.name,
            email: req.user.email,
            contact: req.user.phone || req.user.mobile
          }
        }
      });

    } catch (error) {
      console.error('❌ Error creating payment order:', error);
      next(new AppError(error.message, 500));
    }
  }

  /**
   * Verify payment
   */
  static async verifyPayment(req, res, next) {
    try {
      const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;
      const customerId = req.user.id;

      console.log('🔍 Payment verification started:', {
        razorpay_payment_id: razorpay_payment_id?.substring(0, 10) + '...',
        razorpay_order_id: razorpay_order_id?.substring(0, 10) + '...',
        customerId
      });

      // Verify the payment signature
      const isSignatureValid = verifyRazorpaySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);

      if (!isSignatureValid) {
        console.log('❌ Invalid payment signature');
        return next(new AppError('Invalid payment signature', 400));
      }

      console.log('✅ Payment signature verified successfully');

      // Find the payment record
      const payment = await Payment.findOne({ razorpayOrderId: razorpay_order_id });

      if (!payment) {
        console.log('❌ Payment record not found for order:', razorpay_order_id);
        return next(new AppError('Payment record not found', 404));
      }

      if (payment.status === 'completed') {
        console.log('⚠️ Payment already processed');
        return next(new AppError('Payment already processed', 400));
      }

      // Get order data from payment metadata
      const orderData = payment.orderData;
      if (!orderData) {
        console.log('❌ Order data not found in payment');
        return next(new AppError('Order data not found', 400));
      }

      console.log('📦 Order data retrieved:', {
        orderId: orderData.orderId,
        provider: orderData.selectedProvider?.name,
        pickup: orderData.pickupAddress?.address?.pincode,
        delivery: orderData.deliveryAddress?.address?.pincode
      });

      // Create the actual order in database now that payment is verified
      const newOrder = await CustomerOrder.create({
        customerId: customerId,
        packageDetails: {
          weight: orderData.package.weight,
          dimensions: orderData.package.dimensions || { length: 10, width: 10, height: 10 },
          declaredValue: orderData.package.declaredValue || 100
        },
        pickupAddress: {
          name: orderData.pickupAddress.name,
          phone: orderData.pickupAddress.phone,
          email: orderData.pickupAddress.email,
          address: {
            line1: orderData.pickupAddress.address1 || orderData.pickupAddress.line1,
            line2: orderData.pickupAddress.address2 || orderData.pickupAddress.line2,
            city: orderData.pickupAddress.city,
            state: orderData.pickupAddress.state,
            pincode: orderData.pickupAddress.pincode,
            country: orderData.pickupAddress.country || 'India'
          }
        },
        deliveryAddress: {
          name: orderData.deliveryAddress.name,
          phone: orderData.deliveryAddress.phone,
          email: orderData.deliveryAddress.email,
          address: {
            line1: orderData.deliveryAddress.address1 || orderData.deliveryAddress.line1,
            line2: orderData.deliveryAddress.address2 || orderData.deliveryAddress.line2,
            city: orderData.deliveryAddress.city,
            state: orderData.deliveryAddress.state,
            pincode: orderData.deliveryAddress.pincode,
            country: orderData.deliveryAddress.country || 'India'
          }
        },
        selectedProvider: orderData.selectedProvider || {
          id: 'generic',
          name: 'RocketryBox Logistics',
          serviceType: orderData.serviceType || 'standard',
          totalRate: orderData.shippingRate || payment.amount,
          estimatedDays: orderData.estimatedDelivery || '3-5'
        },
        shippingRate: orderData.shippingRate || payment.amount,
        totalAmount: payment.amount,
        instructions: orderData.instructions || '',
        pickupDate: orderData.pickupDate ? new Date(orderData.pickupDate) : new Date(),
        status: 'confirmed',
        paymentStatus: 'paid',
        paidAt: new Date()
      });

      console.log('✅ Order created in database:', newOrder.orderNumber);

      // 🚀 NEW: Book shipment with REAL courier partner API
      const { OrderBookingService } = await import('../../../services/orderBooking.service.js');

      console.log('📡 Booking shipment with courier partner API...');
      const bookingResult = await OrderBookingService.bookShipmentWithCourier(
        {
          ...orderData,
          orderId: newOrder.orderNumber,
          totalAmount: payment.amount
        },
        orderData.selectedProvider || { name: 'Delhivery', serviceType: 'standard', estimatedDays: '3-5' }
      );

      console.log('📨 Courier booking result:', {
        success: bookingResult.success,
        awb: bookingResult.awb,
        courier: bookingResult.courierPartner,
        bookingType: bookingResult.bookingType
      });

      // Update order with REAL AWB and tracking details from courier
      const updatedOrder = await CustomerOrder.findByIdAndUpdate(
        newOrder._id,
        {
          awb: bookingResult.awb,
          trackingUrl: bookingResult.trackingUrl,
          estimatedDelivery: bookingResult.estimatedDelivery,
          courierPartner: bookingResult.courierPartner,
          bookingType: bookingResult.bookingType,
          requiresManualBooking: bookingResult.requiresManualBooking || false,
          manualBookingInstructions: bookingResult.manualBookingInstructions || null,
          metadata: {
            paymentCompletedAt: new Date(),
            razorpayPaymentId: razorpay_payment_id,
            razorpayOrderId: razorpay_order_id,
            awbGeneratedAt: new Date(),
            courierBookingResponse: bookingResult.additionalInfo,
            lastUpdated: new Date(),
            createdFromPayment: true
          }
        },
        { new: true }
      );

      // Update payment record with order reference
      payment.orderId = updatedOrder._id;
      payment.razorpayPaymentId = razorpay_payment_id;
      payment.status = 'completed';
      payment.paidAt = new Date();
      await payment.save();

      console.log('✅ Order created and payment verified successfully:', {
        paymentId: payment._id,
        razorpayPaymentId: razorpay_payment_id,
        orderId: updatedOrder._id,
        orderNumber: updatedOrder.orderNumber,
        awb: updatedOrder.awb,
        trackingUrl: updatedOrder.trackingUrl,
        estimatedDelivery: updatedOrder.estimatedDelivery,
        courierPartner: updatedOrder.courierPartner,
        bookingType: updatedOrder.bookingType,
        requiresManualBooking: updatedOrder.requiresManualBooking
      });

      // Emit real-time event for order creation
      try {
        const { emitEvent, EVENT_TYPES } = await import('../../../utils/events.js');
        emitEvent(EVENT_TYPES.ORDER_CREATED, {
          orderId: updatedOrder._id,
          orderNumber: updatedOrder.orderNumber,
          awb: updatedOrder.awb,
          customerId: customerId,
          totalAmount: updatedOrder.totalAmount,
          status: updatedOrder.status,
          courierPartner: updatedOrder.courierPartner,
          bookingType: updatedOrder.bookingType
        });
      } catch (eventError) {
        console.error('Error emitting order created event:', eventError);
      }

      res.json({
        success: true,
        data: {
          payment: {
            id: payment._id,
            status: payment.status,
            amount: payment.amount,
            paidAt: payment.paidAt,
            razorpayPaymentId: payment.razorpayPaymentId
          },
          order: {
            id: updatedOrder._id,
            orderNumber: updatedOrder.orderNumber,
            awb: updatedOrder.awb,
            trackingUrl: updatedOrder.trackingUrl,
            status: updatedOrder.status,
            paymentStatus: updatedOrder.paymentStatus,
            estimatedDelivery: updatedOrder.estimatedDelivery,
            courierPartner: updatedOrder.courierPartner,
            bookingType: updatedOrder.bookingType,
            requiresManualBooking: updatedOrder.requiresManualBooking,
            manualBookingInstructions: updatedOrder.manualBookingInstructions,
            paidAt: updatedOrder.paidAt
          },
          verified: true,
          message: bookingResult.requiresManualBooking
            ? 'Payment verified successfully. Manual courier booking required.'
            : 'Payment verified successfully and shipment booked with courier partner'
        }
      });

    } catch (error) {
      console.error('❌ Error verifying payment and creating order:', error);
      next(new AppError(error.message, 500));
    }
  }

  /**
   * Get payment details
   */
  static async getPayment(req, res, next) {
    try {
      const { paymentId } = req.params;
      const customerId = req.user.id;

      const payment = await Payment.findOne({
        _id: paymentId,
        customerId
      }).populate('orderId');

      if (!payment) {
        return next(new AppError('Payment not found', 404));
      }

      res.json({
        success: true,
        data: { payment }
      });

    } catch (error) {
      console.error('❌ Error fetching payment:', error);
      next(new AppError(error.message, 500));
    }
  }

  /**
   * Get customer payments
   */
  static async getCustomerPayments(req, res, next) {
    try {
      const customerId = req.user.id;
      const { page = 1, limit = 10, status } = req.query;

      const filter = { customerId };
      if (status) filter.status = status;

      const payments = await Payment.find(filter)
        .populate('orderId', 'orderNumber totalAmount status')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await Payment.countDocuments(filter);

      res.json({
        success: true,
        data: {
          payments,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
          }
        }
      });

    } catch (error) {
      console.error('❌ Error fetching customer payments:', error);
      next(new AppError(error.message, 500));
    }
  }

  /**
   * Create refund
   */
  static async createRefund(req, res, next) {
    try {
      const { paymentId } = req.params;
      const { amount, reason } = req.body;
      const customerId = req.user.id;

      // Find payment
      const payment = await Payment.findOne({
        _id: paymentId,
        customerId
      });

      if (!payment) {
        return next(new AppError('Payment not found', 404));
      }

      if (!payment.canBeRefunded()) {
        return next(new AppError('Payment cannot be refunded', 400));
      }

      // Create refund via Razorpay
      const refundResult = await razorpayService.createRefund(
        payment.razorpayPaymentId,
        {
          amount,
          notes: {
            reason,
            requestedBy: customerId.toString(),
            paymentId: paymentId.toString()
          }
        }
      );

      if (!refundResult.success) {
        return next(new AppError('Failed to create refund', 500));
      }

      // Update payment record
      await Payment.findByIdAndUpdate(paymentId, {
        refundId: refundResult.refund.id,
        refundAmount: refundResult.refund.amount / 100, // Convert from paise
        refundStatus: 'pending',
        metadata: {
          ...payment.metadata,
          refundCreatedAt: new Date(),
          refundReason: reason
        }
      });

      console.log('💸 Refund initiated:', {
        paymentId,
        refundId: refundResult.refund.id,
        amount: refundResult.refund.amount / 100
      });

      res.json({
        success: true,
        data: {
          refund: refundResult.refund,
          message: 'Refund initiated successfully'
        }
      });

    } catch (error) {
      console.error('❌ Error creating refund:', error);
      next(new AppError(error.message, 500));
    }
  }

  /**
   * Get payment statistics
   */
  static async getPaymentStats(req, res, next) {
    try {
      const customerId = req.user.id;
      const { startDate, endDate } = req.query;

      const stats = await Payment.getPaymentStats(customerId, startDate, endDate);

      res.json({
        success: true,
        data: { stats }
      });

    } catch (error) {
      console.error('❌ Error fetching payment stats:', error);
      next(new AppError(error.message, 500));
    }
  }

  /**
   * Get Razorpay configuration
   */
  static async getRazorpayConfig(req, res, next) {
    try {
      const config = razorpayService.getConfig();

      res.json({
        success: true,
        data: { config }
      });

    } catch (error) {
      console.error('❌ Error fetching Razorpay config:', error);
      next(new AppError(error.message, 500));
    }
  }

  /**
   * Health check for payment service
   */
  static async healthCheck(req, res, next) {
    try {
      const razorpayHealth = await razorpayService.healthCheck();

      res.json({
        success: true,
        data: {
          service: 'payment',
          status: razorpayHealth.status,
          razorpay: razorpayHealth,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('❌ Payment health check failed:', error);
      next(new AppError(error.message, 500));
    }
  }
}

export default PaymentController;
