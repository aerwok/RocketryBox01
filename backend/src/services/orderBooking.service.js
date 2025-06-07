import CustomerOrder from '../modules/customer/models/customerOrder.model.js';
import { emitEvent, EVENT_TYPES } from '../utils/events.js';
import { logger } from '../utils/logger.js';
import { bookShipment, trackShipment } from '../utils/shipping.js';

/**
 * Order Booking Service - Handles real courier partner integration
 */
export class OrderBookingService {

  /**
   * Book shipment with selected courier partner after payment verification
   * @param {Object} orderData - Order details
   * @param {Object} selectedProvider - Chosen courier provider
   * @returns {Object} - Booking response with real AWB
   */
  static async bookShipmentWithCourier(orderData, selectedProvider) {
    try {
      logger.info('🚀 Starting real courier shipment booking', {
        provider: selectedProvider.name,
        orderId: orderData.orderId
      });

      // Map courier name to courier code for API integration
      const courierMapping = {
        'Delhivery': 'DELHIVERY',
        'BlueDart': 'BLUEDART',
        'Blue Dart Express': 'BLUEDART',
        'Ekart Logistics': 'EKART',
        'XpressBees': 'XPRESSBEES',
        'Ecom Express': 'ECOMEXPRESS'
      };

      const courierCode = courierMapping[selectedProvider.name] || 'DELHIVERY'; // Default fallback

      // Prepare shipment details for courier API
      const shipmentDetails = {
        // Order reference
        orderId: orderData.orderId || `ORDER_${Date.now()}`,
        orderValue: orderData.totalAmount || orderData.shippingRate,

        // Sender details (pickup address)
        senderName: orderData.pickupAddress?.name || 'RocketryBox Sender',
        senderAddress: this.formatAddress(orderData.pickupAddress?.address),
        senderPincode: orderData.pickupAddress?.address?.pincode,
        senderPhone: orderData.pickupAddress?.phone || '9999999999',
        senderEmail: orderData.pickupAddress?.email || 'sender@rocketrybox.com',

        // Receiver details (delivery address)
        receiverName: orderData.deliveryAddress?.name,
        receiverAddress: this.formatAddress(orderData.deliveryAddress?.address),
        receiverPincode: orderData.deliveryAddress?.address?.pincode,
        receiverPhone: orderData.deliveryAddress?.phone,
        receiverEmail: orderData.deliveryAddress?.email || 'customer@example.com',

        // Package details
        weight: orderData.packageDetails?.weight || 1,
        dimensions: orderData.packageDetails?.dimensions || { length: 10, width: 10, height: 10 },
        declaredValue: orderData.packageDetails?.declaredValue || orderData.totalAmount || 100,

        // Service configuration
        serviceType: selectedProvider.serviceType || 'standard',
        paymentMode: 'Prepaid', // Since payment is already verified
        codAmount: 0, // Prepaid order

        // Product details
        products: [{
          name: 'Package',
          quantity: 1,
          value: orderData.packageDetails?.declaredValue || 100,
          hsn: '9999'
        }],

        // Additional details
        instructions: orderData.instructions || '',
        pickupDate: orderData.pickupDate || new Date(),

        // RocketryBox specific
        platform: 'RocketryBox',
        source: 'Customer Portal'
      };

      logger.info('📦 Prepared shipment details for courier booking', {
        courierCode,
        orderId: shipmentDetails.orderId,
        pickup: shipmentDetails.senderPincode,
        delivery: shipmentDetails.receiverPincode,
        weight: shipmentDetails.weight
      });

      // Call real courier API for shipment booking
      const bookingResponse = await bookShipment(courierCode, shipmentDetails);

      logger.info('📨 Courier booking response received', {
        courierCode,
        success: bookingResponse.success,
        awb: bookingResponse.awb,
        error: bookingResponse.error
      });

      if (bookingResponse.success && bookingResponse.awb) {
        return {
          success: true,
          awb: bookingResponse.awb,
          trackingUrl: bookingResponse.trackingUrl || `https://track.rocketrybox.com/${bookingResponse.awb}`,
          courierPartner: selectedProvider.name,
          bookingType: bookingResponse.bookingType || 'API_AUTOMATED',
          estimatedDelivery: this.calculateEstimatedDelivery(selectedProvider.estimatedDays),
          additionalInfo: {
            courierResponse: bookingResponse,
            bookedAt: new Date(),
            provider: selectedProvider
          }
        };
      } else {
        // API booking failed, create manual booking reference
        logger.warn('❌ Courier API booking failed, creating manual reference', {
          courierCode,
          error: bookingResponse.error
        });

        return this.createManualBookingReference(selectedProvider, bookingResponse.error);
      }

    } catch (error) {
      logger.error('❌ Critical error in courier booking', {
        error: error.message,
        stack: error.stack,
        orderData: orderData?.orderId
      });

      // Create manual booking as fallback
      return this.createManualBookingReference(selectedProvider, error.message);
    }
  }

  /**
   * Create manual booking reference when API fails
   */
  static createManualBookingReference(selectedProvider, errorReason) {
    const manualRef = `MB${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

    return {
      success: true,
      awb: manualRef,
      trackingUrl: `https://track.rocketrybox.com/${manualRef}`,
      courierPartner: selectedProvider.name,
      bookingType: 'MANUAL_REQUIRED',
      estimatedDelivery: this.calculateEstimatedDelivery(selectedProvider.estimatedDays),
      requiresManualBooking: true,
      manualBookingInstructions: {
        step1: `Contact ${selectedProvider.name} customer service`,
        step2: 'Provide shipment details for manual booking',
        step3: 'Update system with actual AWB received',
        step4: 'Contact RocketryBox support if issues persist',
        errorReason: errorReason
      },
      additionalInfo: {
        manualRef: manualRef,
        createdAt: new Date(),
        requiresFollowUp: true
      }
    };
  }

  /**
   * Update order tracking information from courier webhook
   */
  static async updateOrderTracking(awb, trackingUpdate) {
    try {
      const order = await CustomerOrder.findOne({ awb });

      if (!order) {
        logger.warn('Order not found for tracking update', { awb });
        return { success: false, error: 'Order not found' };
      }

      // Update order status based on courier status
      const statusMapping = {
        'Picked Up': 'confirmed',
        'In Transit': 'shipped',
        'Out for Delivery': 'shipped',
        'Delivered': 'delivered',
        'Returned': 'cancelled',
        'Failed': 'cancelled'
      };

      const newStatus = statusMapping[trackingUpdate.status] || order.status;

      // Update order
      order.status = newStatus;
      order.trackingHistory = order.trackingHistory || [];
      order.trackingHistory.push({
        status: trackingUpdate.status,
        location: trackingUpdate.location,
        timestamp: trackingUpdate.timestamp || new Date(),
        description: trackingUpdate.description,
        courierUpdate: true
      });

      if (trackingUpdate.estimatedDelivery) {
        order.estimatedDelivery = new Date(trackingUpdate.estimatedDelivery);
      }

      await order.save();

      // Emit real-time event
      emitEvent(EVENT_TYPES.ORDER_STATUS_UPDATED, {
        orderId: order._id,
        awb: order.awb,
        status: newStatus,
        location: trackingUpdate.location,
        timestamp: trackingUpdate.timestamp
      });

      logger.info('✅ Order tracking updated successfully', {
        awb,
        newStatus,
        location: trackingUpdate.location
      });

      return { success: true, order };

    } catch (error) {
      logger.error('Error updating order tracking', { error: error.message, awb });
      return { success: false, error: error.message };
    }
  }

  /**
   * Get real-time tracking from courier partner
   */
  static async getRealtimeTracking(awb, courierCode) {
    try {
      const trackingResponse = await trackShipment(awb, courierCode);

      if (trackingResponse.success) {
        // Update local tracking data
        await this.updateOrderTracking(awb, {
          status: trackingResponse.status,
          location: trackingResponse.currentLocation,
          timestamp: new Date(),
          description: trackingResponse.description || trackingResponse.status
        });
      }

      return trackingResponse;
    } catch (error) {
      logger.error('Error fetching real-time tracking', { error: error.message, awb });
      return { success: false, error: error.message };
    }
  }

  /**
   * Helper methods
   */
  static formatAddress(address) {
    if (!address) return 'Address not provided';

    return `${address.line1 || ''} ${address.line2 || ''}, ${address.city || ''}, ${address.state || ''} ${address.pincode || ''}`.trim();
  }

  static calculateEstimatedDelivery(estimatedDays) {
    const days = parseInt(estimatedDays) || 5;
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + days);
    return deliveryDate;
  }
}

export default OrderBookingService;
