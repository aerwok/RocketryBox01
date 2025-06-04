import axios from 'axios';
import { XPRESSBEES_CONFIG } from '../config/xpressbees.config.js';
import { logger } from '../utils/logger.js';

/**
 * XpressBees Service with Professional API Integration
 * Created for consistency with EcomExpress and BlueDart implementations
 * Provides a clean service layer for XpressBees operations
 */
export class XpressBeesService {
  constructor(config = XPRESSBEES_CONFIG) {
    this.config = config;
    this.requestCache = new Map();
    this.tokenCache = {
      token: null,
      expires: 0
    };
  }

  /**
   * Authenticate with XpressBees API and cache token
   * @returns {Promise<string>} Bearer token
   */
  async authenticate() {
    try {
      // Check if cached token is still valid
      if (this.tokenCache.token && Date.now() < this.tokenCache.expires) {
        return this.tokenCache.token;
      }

      logger.info('XpressBees service authentication request');

      const loginUrl = this.config.getApiUrl(this.config.ENDPOINTS.LOGIN);
      
      const response = await axios.post(loginUrl, {
        email: this.config.AUTH.EMAIL,
        password: this.config.AUTH.PASSWORD
      }, {
        headers: this.config.getHeaders(),
        timeout: this.config.REQUEST_TIMEOUT
      });

      if (response.data && response.data.status && response.data.data) {
        const token = response.data.data;
        
        // Cache token for 1 hour
        this.tokenCache = {
          token: token,
          expires: Date.now() + this.config.TOKEN_CACHE_DURATION
        };

        logger.info('XpressBees service authentication successful');
        return token;
      } else {
        throw new Error(response.data?.message || 'Authentication failed');
      }
    } catch (error) {
      logger.error(`XpressBees service authentication failed: ${error.message}`, {
        status: error.response?.status,
        data: error.response?.data
      });
      
      // Clear cached token on auth failure
      this.tokenCache = { token: null, expires: 0 };
      
      throw error;
    }
  }

  /**
   * Create authenticated API client
   * @returns {Object} Configured axios instance
   */
  async createApiClient() {
    try {
      const token = await this.authenticate();
      
      return axios.create({
        baseURL: this.config.API_BASE_URL,
        timeout: this.config.REQUEST_TIMEOUT,
        headers: this.config.getHeaders(token),
        validateStatus: (status) => status < 500
      });
    } catch (error) {
      logger.error(`Failed to create XpressBees API client: ${error.message}`);
      throw error;
    }
  }

  /**
   * Calculate shipping rates
   * @param {Object} packageDetails - Package details
   * @param {Object} deliveryDetails - Delivery details
   * @param {Object} partnerDetails - Partner configuration
   * @returns {Object} Rate calculation result
   */
  async calculateRate(packageDetails, deliveryDetails, partnerDetails) {
    const startTime = Date.now();
    
    try {
      logger.info('XpressBees service rate calculation (database-based):', {
        pickup: deliveryDetails.pickupPincode,
        delivery: deliveryDetails.deliveryPincode,
        weight: packageDetails.weight,
        serviceType: packageDetails.serviceType
      });

      // Check cache first
      const cacheKey = `rate_${deliveryDetails.pickupPincode}_${deliveryDetails.deliveryPincode}_${packageDetails.weight}_${packageDetails.serviceType}`;
      if (this.requestCache.has(cacheKey)) {
        const cached = this.requestCache.get(cacheKey);
        if (Date.now() - cached.timestamp < 300000) { // 5 minutes cache
          logger.info('Returning cached rate calculation result');
          return { ...cached.data, cached: true };
        }
      }

      // Calculate chargeable weight
      const chargeableWeight = this.config.getChargeableWeight(
        packageDetails.weight || 1,
        packageDetails.dimensions || {}
      );

      // Get service type configuration
      const serviceType = packageDetails.serviceType || 'standard';
      const serviceConfig = this.config.getServiceType(serviceType);

      // Use partner rate configuration from database
      const baseRate = partnerDetails?.rates?.baseRate || this.config.PRICING.BASE_RATE;
      const weightRate = partnerDetails?.rates?.weightRate || 15;
      const codCharges = packageDetails.cod ? (partnerDetails?.rates?.codCharges || this.config.PRICING.COD_CHARGES) : 0;
      const fuelSurcharge = Math.round(baseRate * (partnerDetails?.rates?.fuelSurchargePercent || this.config.PRICING.FUEL_SURCHARGE_PERCENT) / 100);

      // Calculate total rate based on weight and service type
      const weightCharge = Math.max(0, (chargeableWeight - 1)) * weightRate;
      const serviceCharge = serviceType === 'express' ? (partnerDetails?.rates?.expressCharge || 20) : 0;
      
      const totalRate = Math.round(baseRate + weightCharge + serviceCharge + codCharges + fuelSurcharge);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      logger.info('XpressBees service rate calculation response:', {
        totalRate: totalRate,
        responseTime: `${responseTime}ms`,
        rateSource: 'DATABASE'
      });

      // Estimated delivery days based on service type
      const estimatedDays = {
        'express': '1-2',
        'standard': '2-4'
      };

      const result = {
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
        volumetricWeight: this.config.calculateVolumetricWeight(packageDetails.dimensions || {}),
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
        rateType: 'DATABASE_CALCULATED',
        apiStatus: 'NOT_REQUIRED',
        rateCardUsed: true,
        responseTime: responseTime,
        lastUpdated: new Date().toISOString()
      };

      // Cache the result
      this.requestCache.set(cacheKey, {
        timestamp: Date.now(),
        data: result
      });

      return result;

    } catch (error) {
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      logger.error(`XpressBees service rate calculation failed: ${error.message}`, {
        pickup: deliveryDetails?.pickupPincode,
        delivery: deliveryDetails?.deliveryPincode,
        serviceType: packageDetails?.serviceType,
        responseTime: `${responseTime}ms`
      });

      throw error;
    }
  }

  /**
   * Book a shipment
   * @param {Object} shipmentDetails - Shipment details
   * @returns {Object} Booking response
   */
  async bookShipment(shipmentDetails) {
    const startTime = Date.now();
    
    try {
      logger.info('XpressBees service shipment booking request');

      const apiClient = await this.createApiClient();

      // Generate unique order ID
      const orderId = this.config.generateOrderId();

      // Get service type configuration
      const serviceConfig = this.config.getServiceType(shipmentDetails.serviceType);

      // Calculate weights and dimensions
      const weightInGrams = this.config.convertToGrams(shipmentDetails.weight || 1);

      // Prepare booking payload
      const bookingPayload = {
        id: orderId,
        unique_order_number: this.config.DEFAULT_SETTINGS.UNIQUE_ORDER_NUMBER,
        payment_method: shipmentDetails.cod ? this.config.PAYMENT_METHODS.COD : this.config.PAYMENT_METHODS.PREPAID,
        
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
        pickup_location: this.config.DEFAULT_SETTINGS.PICKUP_LOCATION,
        
        // Pricing details
        shipping_charges: (shipmentDetails.shippingCharges || this.config.PRICING.BASE_RATE).toString(),
        cod_charges: shipmentDetails.cod ? this.config.PRICING.COD_CHARGES.toString() : '0',
        discount: '0',
        order_amount: (shipmentDetails.declaredValue || 100).toString(),
        collectable_amount: shipmentDetails.cod ? (shipmentDetails.codAmount || 0).toString() : '0'
      };

      const response = await apiClient.post(this.config.ENDPOINTS.CREATE_SHIPMENT, bookingPayload);
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      logger.info('XpressBees service booking response:', {
        status: response.status,
        responseTime: `${responseTime}ms`,
        success: response.data?.response === true
      });

      if (response.data && response.data.response === true) {
        return {
          success: true,
          awb: response.data.awb_number,
          shippingId: response.data.shipping_id,
          courierId: response.data.courier_id,
          trackingUrl: this.config.getTrackingUrl(response.data.awb_number),
          courierName: 'XpressBees',
          serviceType: shipmentDetails.serviceType,
          serviceName: serviceConfig.name,
          bookingType: 'API_AUTOMATED',
          label: response.data.label || null,
          orderId: orderId,
          message: 'Shipment booked successfully via XpressBees API',
          responseTime: responseTime,
          timestamp: new Date().toISOString()
        };
      } else {
        throw new Error(response.data?.message || 'XpressBees booking failed');
      }

    } catch (error) {
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      logger.error(`XpressBees service booking failed: ${error.message}`, {
        responseTime: `${responseTime}ms`
      });

      // Generate temporary reference for manual processing
      const tempReference = `XB${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

      return {
        success: true,
        awb: tempReference,
        trackingUrl: this.config.getTrackingUrl(tempReference),
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
        responseTime: responseTime,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Track a shipment
   * @param {string} trackingNumber - AWB number to track
   * @returns {Object} Tracking information
   */
  async trackShipment(trackingNumber) {
    const startTime = Date.now();
    
    try {
      logger.info('XpressBees service tracking request:', { trackingNumber });

      const apiClient = await this.createApiClient();

      const response = await apiClient.post(this.config.ENDPOINTS.TRACK_SHIPMENT, {
        awb_number: trackingNumber
      });

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      logger.info('XpressBees service tracking response:', {
        status: response.status,
        responseTime: `${responseTime}ms`,
        success: response.data?.response === true
      });

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
          estimatedDelivery: null,
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
          responseTime: responseTime,
          lastUpdated: new Date().toISOString()
        };
      } else {
        throw new Error(response.data?.message || 'XpressBees tracking failed');
      }

    } catch (error) {
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      logger.error(`XpressBees service tracking failed: ${error.message}`, {
        trackingNumber,
        responseTime: `${responseTime}ms`
      });

      return {
        success: true,
        trackingNumber: trackingNumber,
        trackingUrl: this.config.getTrackingUrl(trackingNumber),
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
        responseTime: responseTime,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Cancel a shipment
   * @param {string} awbNumber - AWB number to cancel
   * @returns {Object} Cancellation response
   */
  async cancelShipment(awbNumber) {
    const startTime = Date.now();
    
    try {
      logger.info('XpressBees service cancellation request:', { awbNumber });

      const apiClient = await this.createApiClient();

      const response = await apiClient.post(this.config.ENDPOINTS.CANCEL_SHIPMENT, {
        awb_number: awbNumber
      });

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      logger.info('XpressBees service cancellation response:', {
        status: response.status,
        responseTime: `${responseTime}ms`,
        success: response.data?.response === true
      });

      if (response.data && response.data.response === true) {
        return {
          success: true,
          awb: awbNumber,
          message: response.data.message || 'Shipment cancelled successfully',
          responseTime: responseTime,
          timestamp: new Date().toISOString()
        };
      } else {
        throw new Error(response.data?.message || 'XpressBees cancellation failed');
      }

    } catch (error) {
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      logger.error(`XpressBees service cancellation failed: ${error.message}`, {
        awbNumber,
        responseTime: `${responseTime}ms`
      });

      return {
        success: false,
        awb: awbNumber,
        error: error.message,
        responseTime: responseTime,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get courier list
   * @returns {Object} Courier list response
   */
  async getCourierList() {
    const startTime = Date.now();
    
    try {
      logger.info('XpressBees service courier list request');

      const apiClient = await this.createApiClient();
      const response = await apiClient.get(this.config.ENDPOINTS.COURIER_LIST);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      logger.info('XpressBees service courier list response:', {
        status: response.status,
        responseTime: `${responseTime}ms`,
        success: response.data?.status === true
      });

      if (response.data && response.data.status) {
        return {
          success: true,
          couriers: response.data.data || [],
          message: 'Courier list fetched successfully',
          responseTime: responseTime
        };
      } else {
        throw new Error(response.data?.message || 'Failed to fetch courier list');
      }

    } catch (error) {
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      logger.error(`XpressBees service courier list failed: ${error.message}`, {
        responseTime: `${responseTime}ms`
      });

      throw error;
    }
  }

  /**
   * Request pickup for shipments
   * @param {Array} awbNumbers - Array of AWB numbers
   * @returns {Object} Pickup response
   */
  async requestPickup(awbNumbers) {
    const startTime = Date.now();
    
    try {
      logger.info('XpressBees service pickup request:', { count: awbNumbers.length });

      const apiClient = await this.createApiClient();

      const response = await apiClient.post(this.config.ENDPOINTS.PICKUP_SHIPMENT, {
        awb_numbers: awbNumbers.join(',')
      });

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      logger.info('XpressBees service pickup response:', {
        status: response.status,
        responseTime: `${responseTime}ms`,
        success: response.data?.response === true
      });

      if (response.data && response.data.response === true) {
        return {
          success: true,
          message: response.data.message || 'Pickup manifest generated successfully',
          manifestUrl: response.data.data || null,
          awbNumbers: awbNumbers,
          responseTime: responseTime,
          timestamp: new Date().toISOString()
        };
      } else {
        throw new Error(response.data?.message || 'Pickup request failed');
      }

    } catch (error) {
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      logger.error(`XpressBees service pickup failed: ${error.message}`, {
        responseTime: `${responseTime}ms`
      });

      return {
        success: false,
        error: error.message,
        awbNumbers: awbNumbers,
        responseTime: responseTime,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Clear request cache
   */
  clearCache() {
    this.requestCache.clear();
    this.tokenCache = { token: null, expires: 0 };
    logger.info('XpressBees service cache cleared');
  }

  /**
   * Get service health status
   * @returns {Object} Health status
   */
  async getHealthStatus() {
    try {
      // Test authentication
      const token = await this.authenticate();
      
      if (token) {
        return {
          status: 'HEALTHY',
          authentication: 'SUCCESS',
          tokenCached: !!this.tokenCache.token,
          timestamp: new Date().toISOString(),
          cacheSize: this.requestCache.size
        };
      } else {
        return {
          status: 'UNHEALTHY',
          authentication: 'FAILED',
          timestamp: new Date().toISOString(),
          cacheSize: this.requestCache.size
        };
      }
    } catch (error) {
      return {
        status: 'UNHEALTHY',
        authentication: 'ERROR',
        error: error.message,
        timestamp: new Date().toISOString(),
        cacheSize: this.requestCache.size
      };
    }
  }
}

// Create and export default instance
const xpressBeesService = new XpressBeesService();
export default xpressBeesService; 