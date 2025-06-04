import axios from 'axios';
import { logger } from './logger.js';
import { XPRESSBEES_CONFIG } from '../config/xpressbees.config.js';

/**
 * Professional XpressBees API Integration
 * Complete implementation with authentication and API operations
 * Rate calculation handled via MongoDB rate cards (not API-based)
 */

// Token cache to avoid repeated authentication
let tokenCache = {
  token: null,
  expires: 0
};

/**
 * Authenticate with XpressBees API
 * @returns {Promise<string>} Bearer token
 */
export const authenticate = async () => {
  try {
    // Check if cached token is still valid
    if (tokenCache.token && Date.now() < tokenCache.expires) {
      return tokenCache.token;
    }

    logger.info('XpressBees authentication request');

    const loginUrl = XPRESSBEES_CONFIG.getApiUrl(XPRESSBEES_CONFIG.ENDPOINTS.LOGIN);
    
    const response = await axios.post(loginUrl, {
      email: XPRESSBEES_CONFIG.AUTH.EMAIL,
      password: XPRESSBEES_CONFIG.AUTH.PASSWORD
    }, {
      headers: XPRESSBEES_CONFIG.getHeaders(),
      timeout: XPRESSBEES_CONFIG.REQUEST_TIMEOUT
    });

    if (response.data && response.data.status && response.data.data) {
      const token = response.data.data;
      
      // Cache token for 1 hour
      tokenCache = {
        token: token,
        expires: Date.now() + XPRESSBEES_CONFIG.TOKEN_CACHE_DURATION
      };

      logger.info('XpressBees authentication successful');
      return token;
    } else {
      throw new Error(response.data?.message || 'Authentication failed');
    }
  } catch (error) {
    logger.error(`XpressBees authentication failed: ${error.message}`, {
      status: error.response?.status,
      data: error.response?.data
    });
    
    // Clear cached token on auth failure
    tokenCache = { token: null, expires: 0 };
    
    throw new Error(`XpressBees authentication failed: ${error.message}`);
  }
};

/**
 * Get list of available couriers
 * @returns {Promise<Object>} Courier list response
 */
export const getCourierList = async () => {
  try {
    logger.info('XpressBees courier list request');

    const token = await authenticate();
    const courierUrl = XPRESSBEES_CONFIG.getApiUrl(XPRESSBEES_CONFIG.ENDPOINTS.COURIER_LIST);

    const response = await axios.get(courierUrl, {
      headers: XPRESSBEES_CONFIG.getHeaders(token),
      timeout: XPRESSBEES_CONFIG.REQUEST_TIMEOUT
    });

    if (response.data && response.data.status) {
      return {
        success: true,
        couriers: response.data.data || [],
        message: 'Courier list fetched successfully'
      };
    } else {
      throw new Error(response.data?.message || 'Failed to fetch courier list');
    }
  } catch (error) {
    logger.error(`XpressBees courier list failed: ${error.message}`);
    throw error;
  }
};

/**
 * Calculate shipping rates using MongoDB rate cards
 * @param {Object} packageDetails - Package weight and dimensions
 * @param {Object} deliveryDetails - Pickup and delivery details
 * @param {Object} partnerDetails - Partner configuration from the database
 * @returns {Object} - Shipping rate quote
 */
export const calculateRate = async (packageDetails, deliveryDetails, partnerDetails) => {
  try {
    // Validate input parameters
    if (!packageDetails || !deliveryDetails) {
      throw new Error('Missing required parameters for XpressBees rate calculation');
    }
    
    if (!deliveryDetails.pickupPincode || !deliveryDetails.deliveryPincode) {
      throw new Error('Missing pickup or delivery pincode for XpressBees rate calculation');
    }

    logger.info('XpressBees rate calculation (database-based):', {
      pickupPincode: deliveryDetails.pickupPincode,
      deliveryPincode: deliveryDetails.deliveryPincode,
      weight: packageDetails.weight,
      serviceType: packageDetails.serviceType
    });

    // Calculate chargeable weight
    const chargeableWeight = XPRESSBEES_CONFIG.getChargeableWeight(
      packageDetails.weight || 1,
      packageDetails.dimensions || {}
    );

    // Get service type configuration
    const serviceType = packageDetails.serviceType || 'standard';
    const serviceConfig = XPRESSBEES_CONFIG.getServiceType(serviceType);

    // Use partner rate configuration from database
    const baseRate = partnerDetails?.rates?.baseRate || XPRESSBEES_CONFIG.PRICING.BASE_RATE;
    const weightRate = partnerDetails?.rates?.weightRate || 15;
    const codCharges = packageDetails.cod ? (partnerDetails?.rates?.codCharges || XPRESSBEES_CONFIG.PRICING.COD_CHARGES) : 0;
    const fuelSurcharge = Math.round(baseRate * (partnerDetails?.rates?.fuelSurchargePercent || XPRESSBEES_CONFIG.PRICING.FUEL_SURCHARGE_PERCENT) / 100);

    // Calculate total rate based on weight and service type
    const weightCharge = Math.max(0, (chargeableWeight - 1)) * weightRate;
    const serviceCharge = serviceType === 'express' ? (partnerDetails?.rates?.expressCharge || 20) : 0;
    
    const totalRate = Math.round(baseRate + weightCharge + serviceCharge + codCharges + fuelSurcharge);

    // Estimated delivery days based on service type
    const estimatedDays = {
      'express': '1-2',
      'standard': '2-4'
    };

    return {
      success: true,
      provider: {
        id: partnerDetails?.id || 'xpressbees',
        name: 'XpressBees',
        logoUrl: partnerDetails?.logoUrl,
        expressDelivery: serviceType === 'express',
        estimatedDays: estimatedDays[serviceType] || '2-4',
        serviceCode: serviceConfig.id,
        serviceName: serviceConfig.name
      },
      totalRate: totalRate,
      volumetricWeight: XPRESSBEES_CONFIG.calculateVolumetricWeight(packageDetails.dimensions || {}),
      chargeableWeight: chargeableWeight,
      breakdown: {
        baseRate: baseRate,
        weightCharge: weightCharge,
        serviceCharge: serviceCharge,
        codCharge: codCharges,
        fuelSurcharge: fuelSurcharge,
        otherCharges: 0
      },
      serviceability: {
        pickup: { success: true, serviceable: true },
        delivery: { success: true, serviceable: true },
        overall: true
      },
      // Database-based rate indicators
      rateType: 'DATABASE_CALCULATED',
      apiStatus: 'NOT_REQUIRED',
      rateCardUsed: true,
      lastUpdated: new Date().toISOString()
    };

  } catch (error) {
    logger.error(`XpressBees rate calculation failed: ${error.message}`, {
      pickupPincode: deliveryDetails?.pickupPincode,
      deliveryPincode: deliveryDetails?.deliveryPincode,
      serviceType: packageDetails?.serviceType,
      weight: packageDetails?.weight
    });
    
    throw new Error(`XpressBees rate calculation failed: ${error.message}`);
  }
};

/**
 * Book a shipment with XpressBees API
 * @param {Object} shipmentDetails - Shipment booking details
 * @param {Object} partnerDetails - Partner configuration from the database
 * @returns {Object} - Booking response with AWB number, label, etc.
 */
export const bookShipment = async (shipmentDetails, partnerDetails) => {
  try {
    logger.info('XpressBees shipment booking request');

    const token = await authenticate();
    const bookingUrl = XPRESSBEES_CONFIG.getApiUrl(XPRESSBEES_CONFIG.ENDPOINTS.CREATE_SHIPMENT);

    // Generate unique order ID
    const orderId = XPRESSBEES_CONFIG.generateOrderId();

    // Get service type configuration
    const serviceConfig = XPRESSBEES_CONFIG.getServiceType(shipmentDetails.serviceType);

    // Calculate weights and dimensions
    const weightInGrams = XPRESSBEES_CONFIG.convertToGrams(shipmentDetails.weight || 1);

    // Prepare booking payload
    const bookingPayload = {
      id: orderId,
      unique_order_number: XPRESSBEES_CONFIG.DEFAULT_SETTINGS.UNIQUE_ORDER_NUMBER,
      payment_method: shipmentDetails.cod ? XPRESSBEES_CONFIG.PAYMENT_METHODS.COD : XPRESSBEES_CONFIG.PAYMENT_METHODS.PREPAID,
      
      // Consigner (Shipper) details
      consigner_name: shipmentDetails.shipper.name,
      consigner_phone: shipmentDetails.shipper.phone,
      consigner_pincode: shipmentDetails.shipper.address.pincode,
      consigner_city: shipmentDetails.shipper.address.city,
      consigner_state: shipmentDetails.shipper.address.state,
      consigner_address: shipmentDetails.shipper.address.line1,
      consigner_gst_number: shipmentDetails.shipper.gstNumber || '',
      
      // Consignee (Customer) details
      consignee_name: shipmentDetails.consignee.name,
      consignee_phone: shipmentDetails.consignee.phone,
      consignee_pincode: shipmentDetails.consignee.address.pincode,
      consignee_city: shipmentDetails.consignee.address.city,
      consignee_state: shipmentDetails.consignee.address.state,
      consignee_address: shipmentDetails.consignee.address.line1,
      consignee_gst_number: shipmentDetails.consignee.gstNumber || '',
      
      // Product details
      products: [{
        product_name: shipmentDetails.commodity || 'General Goods',
        product_qty: '1',
        product_price: (shipmentDetails.declaredValue || 100).toString(),
        product_tax_per: shipmentDetails.declaredValue > 49999 ? '18' : '',
        product_sku: shipmentDetails.sku || '',
        product_hsn: shipmentDetails.hsn || ''
      }],
      
      // Invoice details
      invoice: [{
        invoice_number: shipmentDetails.invoiceNumber || orderId,
        invoice_date: new Date().toISOString().split('T')[0],
        ebill_number: shipmentDetails.ebillNumber || '',
        ebill_expiry_date: shipmentDetails.ebillExpiryDate || ''
      }],
      
      // Package details
      weight: weightInGrams.toString(),
      length: (shipmentDetails.dimensions?.length || 10).toString(),
      breadth: (shipmentDetails.dimensions?.width || 10).toString(),
      height: (shipmentDetails.dimensions?.height || 10).toString(),
      
      // Service configuration
      courier_id: serviceConfig.id,
      pickup_location: XPRESSBEES_CONFIG.DEFAULT_SETTINGS.PICKUP_LOCATION,
      
      // Pricing details (using calculated rates from database)
      shipping_charges: (shipmentDetails.calculatedRate?.breakdown?.baseRate || XPRESSBEES_CONFIG.PRICING.BASE_RATE).toString(),
      cod_charges: shipmentDetails.cod ? (shipmentDetails.calculatedRate?.breakdown?.codCharge || XPRESSBEES_CONFIG.PRICING.COD_CHARGES).toString() : '0',
      discount: '0',
      order_amount: (shipmentDetails.declaredValue || 100).toString(),
      collectable_amount: shipmentDetails.cod ? (shipmentDetails.codAmount || 0).toString() : '0'
    };

    logger.info('XpressBees booking payload prepared:', {
      orderId,
      serviceId: serviceConfig.id,
      serviceName: serviceConfig.name,
      weight: weightInGrams,
      cod: shipmentDetails.cod
    });

    const response = await axios.post(bookingUrl, bookingPayload, {
      headers: XPRESSBEES_CONFIG.getHeaders(token),
      timeout: XPRESSBEES_CONFIG.REQUEST_TIMEOUT
    });

    // Process successful response
    if (response.data && response.data.response === true) {
      return {
        success: true,
        awb: response.data.awb_number,
        shippingId: response.data.shipping_id,
        courierId: response.data.courier_id,
        trackingUrl: XPRESSBEES_CONFIG.getTrackingUrl(response.data.awb_number),
        courierName: 'XpressBees',
        serviceType: shipmentDetails.serviceType,
        serviceName: serviceConfig.name,
        bookingType: 'API_AUTOMATED',
        label: response.data.label || null, // PDF label URL if available
        orderId: orderId,
        message: 'Shipment booked successfully via XpressBees API',
        timestamp: new Date().toISOString()
      };
    } else {
      throw new Error(response.data?.message || 'XpressBees booking failed');
    }
  } catch (error) {
    logger.error(`XpressBees booking failed: ${error.message}`);
    
    // Generate temporary reference for manual processing
    const tempReference = `XB${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
    
    return {
      success: true,
      awb: tempReference,
      trackingUrl: XPRESSBEES_CONFIG.getTrackingUrl(tempReference),
      courierName: 'XpressBees',
      bookingType: 'MANUAL_REQUIRED',
      apiError: error.message,
      instructions: {
        step1: 'Contact XpressBees support',
        step2: 'Provide shipment details for manual booking',
        step3: 'Update system with actual AWB number received',
        step4: 'Contact support if API issues persist'
      },
      tempReference: tempReference,
      message: 'API booking failed. Manual booking required.',
      timestamp: new Date().toISOString()
    };
  }
};

/**
 * Track a shipment with XpressBees API
 * @param {string} trackingNumber - AWB number to track
 * @param {Object} partnerDetails - Partner configuration from the database
 * @returns {Object} - Tracking information
 */
export const trackShipment = async (trackingNumber, partnerDetails) => {
  try {
    logger.info('XpressBees tracking request:', { trackingNumber });

    const token = await authenticate();
    const trackingUrl = XPRESSBEES_CONFIG.getApiUrl(XPRESSBEES_CONFIG.ENDPOINTS.TRACK_SHIPMENT);

    const response = await axios.post(trackingUrl, {
      awb_number: trackingNumber
    }, {
      headers: XPRESSBEES_CONFIG.getHeaders(token),
      timeout: XPRESSBEES_CONFIG.REQUEST_TIMEOUT
    });

    // Process successful response
    if (response.data && response.data.response === true) {
      const trackingData = response.data.tracking_data;
      
      // Parse tracking events from different status categories
      const allEvents = [];
      const statusCategories = ['delivered', 'out for delivery', 'in transit', 'pending pickup'];
      
      statusCategories.forEach(category => {
        if (trackingData[category] && Array.isArray(trackingData[category])) {
          allEvents.push(...trackingData[category]);
        }
      });

      // Sort events by timestamp (most recent first)
      allEvents.sort((a, b) => parseInt(b.event_time) - parseInt(a.event_time));
      
      const latestEvent = allEvents[0];
      
      return {
        success: true,
        trackingNumber: trackingNumber,
        status: latestEvent?.status || 'Unknown',
        statusDetail: latestEvent?.message || 'No status available',
        currentLocation: latestEvent?.location || 'Unknown',
        timestamp: latestEvent?.event_time ? new Date(parseInt(latestEvent.event_time) * 1000).toISOString() : new Date().toISOString(),
        estimatedDelivery: null, // XpressBees doesn't provide EDD in tracking
        trackingHistory: allEvents.map(event => ({
          date: new Date(parseInt(event.event_time) * 1000).toISOString(),
          status: event.status,
          message: event.message,
          location: event.location,
          statusCode: event.status_code
        })),
        courierName: 'XpressBees',
        trackingType: 'API_AUTOMATED',
        shipStatus: latestEvent?.ship_status || 'unknown',
        lastUpdated: new Date().toISOString()
      };
    } else {
      throw new Error(response.data?.message || 'XpressBees tracking failed');
    }
  } catch (error) {
    logger.error(`XpressBees tracking failed: ${error.message}`);
    
    return {
      success: true,
      trackingNumber: trackingNumber,
      trackingUrl: XPRESSBEES_CONFIG.getTrackingUrl(trackingNumber),
      courierName: 'XpressBees',
      trackingType: 'MANUAL_REQUIRED',
      apiError: error.message,
      instructions: {
        step1: 'Visit https://www.xpressbees.com/track/',
        step2: 'Enter AWB number in the tracking field',
        step3: 'View real-time tracking status',
        step4: 'Contact support if API issues persist'
      },
      message: 'API tracking failed. Manual tracking required.',
      timestamp: new Date().toISOString()
    };
  }
};

/**
 * Cancel a shipment with XpressBees API
 * @param {string} awbNumber - AWB number to cancel
 * @returns {Object} - Cancellation response
 */
export const cancelShipment = async (awbNumber) => {
  try {
    logger.info('XpressBees shipment cancellation request:', { awbNumber });

    const token = await authenticate();
    const cancelUrl = XPRESSBEES_CONFIG.getApiUrl(XPRESSBEES_CONFIG.ENDPOINTS.CANCEL_SHIPMENT);

    const response = await axios.post(cancelUrl, {
      awb_number: awbNumber
    }, {
      headers: XPRESSBEES_CONFIG.getHeaders(token),
      timeout: XPRESSBEES_CONFIG.REQUEST_TIMEOUT
    });

    if (response.data && response.data.response === true) {
      return {
        success: true,
        awb: awbNumber,
        message: response.data.message || 'Shipment cancelled successfully',
        timestamp: new Date().toISOString()
      };
    } else {
      throw new Error(response.data?.message || 'XpressBees cancellation failed');
    }
  } catch (error) {
    logger.error(`XpressBees cancellation failed: ${error.message}`);
    return {
      success: false,
      awb: awbNumber,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
};

/**
 * Request pickup for shipments
 * @param {Array} awbNumbers - Array of AWB numbers for pickup
 * @returns {Object} - Pickup response
 */
export const requestPickup = async (awbNumbers) => {
  try {
    logger.info('XpressBees pickup request:', { count: awbNumbers.length });

    const token = await authenticate();
    const pickupUrl = XPRESSBEES_CONFIG.getApiUrl(XPRESSBEES_CONFIG.ENDPOINTS.PICKUP_SHIPMENT);

    const response = await axios.post(pickupUrl, {
      awb_numbers: awbNumbers.join(',')
    }, {
      headers: XPRESSBEES_CONFIG.getHeaders(token),
      timeout: XPRESSBEES_CONFIG.REQUEST_TIMEOUT
    });

    if (response.data && response.data.response === true) {
      return {
        success: true,
        message: response.data.message || 'Pickup manifest generated successfully',
        manifestUrl: response.data.data || null,
        awbNumbers: awbNumbers,
        timestamp: new Date().toISOString()
      };
    } else {
      throw new Error(response.data?.message || 'Pickup request failed');
    }
  } catch (error) {
    logger.error(`XpressBees pickup request failed: ${error.message}`);
    return {
      success: false,
      error: error.message,
      awbNumbers: awbNumbers,
      timestamp: new Date().toISOString()
    };
  }
};

/**
 * Get NDR (Non-Delivery Report) list
 * @returns {Object} - NDR list response
 */
export const getNDRList = async () => {
  try {
    logger.info('XpressBees NDR list request');

    const token = await authenticate();
    const ndrUrl = XPRESSBEES_CONFIG.getApiUrl(XPRESSBEES_CONFIG.ENDPOINTS.NDR_LIST);

    const response = await axios.get(ndrUrl, {
      headers: XPRESSBEES_CONFIG.getHeaders(token),
      timeout: XPRESSBEES_CONFIG.REQUEST_TIMEOUT
    });

    if (response.data && response.data.status) {
      return {
        success: true,
        ndrList: response.data.data || [],
        message: 'NDR list fetched successfully'
      };
    } else {
      throw new Error(response.data?.message || 'Failed to fetch NDR list');
    }
  } catch (error) {
    logger.error(`XpressBees NDR list failed: ${error.message}`);
    throw error;
  }
};

// Export default object with all functions
export default {
  authenticate,
  getCourierList,
  calculateRate,
  bookShipment,
  trackShipment,
  cancelShipment,
  requestPickup,
  getNDRList
}; 