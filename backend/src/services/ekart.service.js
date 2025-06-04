import axios from 'axios';
import { EKART_CONFIG } from '../config/ekart.config.js';
import { logger } from '../utils/logger.js';
import { getCache, setCache } from '../utils/redis.js';

/**
 * Ekart Logistics Service with Professional API Integration
 * Created for consistency with other shipping service implementations
 * Provides a clean service layer for Ekart operations
 */
export class EkartService {
  constructor(config = EKART_CONFIG) {
    this.config = config;
    this.requestCache = new Map();
  }

  /**
   * Create authenticated API client
   * @param {string} token - Access token (optional)
   * @returns {Object} Configured axios instance
   */
  createApiClient(token = null) {
    try {
      return axios.create({
        baseURL: this.config.BASE_URL,
        timeout: this.config.REQUEST_TIMEOUT,
        headers: this.config.getHeaders(token),
        validateStatus: (status) => status < 500 // Accept 4xx as valid responses
      });
    } catch (error) {
      logger.error(`Failed to create Ekart API client: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get access token with caching
   * @returns {string} - Access token
   */
  async getAccessToken() {
    const startTime = Date.now();
    
    try {
      // Check cache first
      const cachedToken = await getCache(this.config.TOKEN_CACHE_KEY);
      if (cachedToken && cachedToken.expires_at > Date.now()) {
        logger.info('Using cached Ekart token');
        return cachedToken.access_token;
      }

      logger.info('Ekart authentication request');

      const apiClient = this.createApiClient();
      const authUrl = this.config.getAuthUrl();

      const authPayload = {
        username: this.config.USERNAME,
        password: this.config.PASSWORD
      };

      const response = await apiClient.post(authUrl, authPayload);
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      logger.info('Ekart authentication response:', {
        status: response.status,
        responseTime: `${responseTime}ms`,
        hasToken: !!response.data?.access_token
      });

      if (response.data && response.data.access_token) {
        const tokenData = {
          access_token: response.data.access_token,
          token_type: response.data.token_type || 'Bearer',
          expires_in: response.data.expires_in,
          expires_at: Date.now() + ((response.data.expires_in - this.config.TOKEN_EXPIRY_BUFFER) * 1000)
        };

        // Cache the token
        await setCache(
          this.config.TOKEN_CACHE_KEY, 
          tokenData, 
          response.data.expires_in - this.config.TOKEN_EXPIRY_BUFFER
        );

        return response.data.access_token;
      } else {
        throw new Error('No access token received from Ekart API');
      }

    } catch (error) {
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      logger.error(`Ekart authentication failed: ${error.message}`, {
        responseTime: `${responseTime}ms`,
        status: error.response?.status,
        data: error.response?.data
      });

      return {
        success: false,
        error: error.message,
        responseTime: responseTime
      };
    }
  }

  /**
   * Check serviceability for a pincode (V2)
   * @param {string|number} pincode - Pincode to check
   * @returns {Object} - Serviceability information
   */
  async checkServiceability(pincode) {
    const startTime = Date.now();
    
    try {
      logger.info(`Ekart serviceability check: ${pincode}`);

      const token = await this.getAccessToken();
      const apiClient = this.createApiClient(token);
      const endpoint = `${this.config.ENDPOINTS.SERVICEABILITY_V2}/${pincode}`;

      const response = await apiClient.get(endpoint);
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      logger.info('Ekart serviceability response:', {
        status: response.status,
        responseTime: `${responseTime}ms`,
        serviceable: response.data?.status
      });

      if (response.data) {
        return {
          success: true,
          pincode: pincode,
          serviceable: response.data.status,
          details: response.data.details,
          message: response.data.remark,
          responseTime: responseTime,
          timestamp: new Date().toISOString()
        };
      } else {
        throw new Error('Invalid response from Ekart serviceability API');
      }

    } catch (error) {
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      logger.error(`Ekart serviceability check failed: ${error.message}`, {
        pincode,
        responseTime: `${responseTime}ms`
      });

      return {
        success: false,
        pincode: pincode,
        serviceable: false,
        error: error.message,
        responseTime: responseTime,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get pricing estimates with serviceability (V3)
   * @param {Object} estimateData - Estimate request data
   * @returns {Object} - Pricing and serviceability information
   */
  async getPricingEstimate(estimateData) {
    const startTime = Date.now();
    
    try {
      logger.info('Ekart pricing estimate request:', estimateData);

      const token = await this.getAccessToken();
      const apiClient = this.createApiClient(token);
      const endpoint = this.config.ENDPOINTS.SERVICEABILITY_V3;

      const payload = {
        pickupPincode: String(estimateData.pickupPincode),
        dropPincode: String(estimateData.dropPincode),
        length: String(estimateData.length || 10),
        height: String(estimateData.height || 10),
        width: String(estimateData.width || 10),
        weight: String(estimateData.weight || 500),
        paymentType: estimateData.paymentType || 'Prepaid',
        invoiceAmount: String(estimateData.invoiceAmount || 100)
      };

      if (payload.paymentType === 'COD') {
        payload.codAmount = String(estimateData.codAmount || estimateData.invoiceAmount);
      }

      const response = await apiClient.post(endpoint, payload);
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      logger.info('Ekart pricing estimate response:', {
        status: response.status,
        responseTime: `${responseTime}ms`,
        courierPartners: response.data?.length || 0
      });

      if (response.data && Array.isArray(response.data)) {
        return {
          success: true,
          courierPartners: response.data,
          totalPartners: response.data.length,
          responseTime: responseTime,
          timestamp: new Date().toISOString()
        };
      } else {
        throw new Error('Invalid response from Ekart pricing API');
      }

    } catch (error) {
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      logger.error(`Ekart pricing estimate failed: ${error.message}`, {
        estimateData,
        responseTime: `${responseTime}ms`
      });

      return {
        success: false,
        error: error.message,
        responseTime: responseTime,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Book a shipment
   * @param {Object} shipmentDetails - Shipment details
   * @returns {Object} - Booking response
   */
  async bookShipment(shipmentDetails) {
    const startTime = Date.now();
    
    try {
      logger.info('Ekart shipment booking request');

      const token = await this.getAccessToken();
      const apiClient = this.createApiClient(token);
      const endpoint = this.config.ENDPOINTS.CREATE_SHIPMENT;

      // Transform shipment data to Ekart format
      const ekartShipmentData = this.config.transformShipmentData(shipmentDetails);

      // Validate shipment data
      const validation = this.config.validateShipmentData(ekartShipmentData);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      const response = await apiClient.put(endpoint, ekartShipmentData);
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      logger.info('Ekart shipment booking response:', {
        status: response.status,
        responseTime: `${responseTime}ms`,
        success: !!response.data?.status,
        trackingId: response.data?.tracking_id
      });

      if (response.data && response.data.status) {
        return {
          success: true,
          trackingId: response.data.tracking_id,
          awb: response.data.tracking_id,
          vendor: response.data.vendor,
          barcodes: response.data.barcodes,
          trackingUrl: this.config.getTrackingUrl(response.data.tracking_id),
          courierName: 'Ekart Logistics',
          bookingType: 'API_AUTOMATED',
          message: response.data.remark || 'Shipment created successfully',
          responseTime: responseTime,
          timestamp: new Date().toISOString()
        };
      } else {
        throw new Error(response.data?.remark || 'Ekart shipment booking failed');
      }

    } catch (error) {
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      logger.error(`Ekart shipment booking failed: ${error.message}`, {
        responseTime: `${responseTime}ms`
      });

      // Generate temporary reference for manual processing
      const tempReference = `EK${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

      return {
        success: true,
        awb: tempReference,
        trackingUrl: this.config.getTrackingUrl(tempReference),
        courierName: 'Ekart Logistics',
        bookingType: 'MANUAL_REQUIRED',
        apiError: error.message,
        instructions: {
          step1: 'Contact Ekart support or use their dashboard',
          step2: 'Provide shipment details for manual booking',
          step3: 'Update system with actual tracking ID received',
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
   * Cancel a shipment
   * @param {string} trackingId - Ekart tracking ID
   * @returns {Object} - Cancellation response
   */
  async cancelShipment(trackingId) {
    const startTime = Date.now();
    
    try {
      logger.info('Ekart shipment cancellation request:', { trackingId });

      const token = await this.getAccessToken();
      const apiClient = this.createApiClient(token);
      const endpoint = this.config.ENDPOINTS.CANCEL_SHIPMENT;

      const response = await apiClient.delete(endpoint, {
        params: { tracking_id: trackingId }
      });
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      logger.info('Ekart shipment cancellation response:', {
        status: response.status,
        responseTime: `${responseTime}ms`,
        success: !!response.data?.status
      });

      if (response.data && response.data.status) {
        return {
          success: true,
          trackingId: trackingId,
          message: response.data.remark || 'Shipment cancelled successfully',
          responseTime: responseTime,
          timestamp: new Date().toISOString()
        };
      } else {
        throw new Error(response.data?.remark || 'Ekart shipment cancellation failed');
      }

    } catch (error) {
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      logger.error(`Ekart shipment cancellation failed: ${error.message}`, {
        trackingId,
        responseTime: `${responseTime}ms`
      });

      return {
        success: false,
        trackingId: trackingId,
        error: error.message,
        responseTime: responseTime,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Track a shipment
   * @param {string} trackingId - Ekart tracking ID
   * @returns {Object} - Tracking information
   */
  async trackShipment(trackingId) {
    const startTime = Date.now();
    
    try {
      logger.info('Ekart tracking request:', { trackingId });

      // Note: Tracking API is open and doesn't require authentication
      const apiClient = this.createApiClient();
      const endpoint = `${this.config.ENDPOINTS.TRACK_SHIPMENT}/${trackingId}`;

      const response = await apiClient.get(endpoint);
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      logger.info('Ekart tracking response:', {
        status: response.status,
        responseTime: `${responseTime}ms`,
        hasTrackData: !!response.data?.track
      });

      if (response.data && response.data.track) {
        const trackData = response.data.track;

        return {
          success: true,
          trackingId: trackingId,
          status: trackData.status,
          statusDetail: trackData.desc,
          currentLocation: trackData.location,
          lastUpdated: new Date(trackData.ctime).toISOString(),
          pickupTime: trackData.pickupTime ? new Date(trackData.pickupTime).toISOString() : null,
          estimatedDelivery: response.data.edd ? new Date(response.data.edd).toISOString() : null,
          attempts: trackData.attempts || 0,
          ndrStatus: trackData.ndrStatus,
          ndrActions: trackData.ndrActions || [],
          trackingHistory: trackData.details || [],
          courierName: 'Ekart Logistics',
          trackingType: 'API_AUTOMATED',
          orderNumber: response.data.order_number,
          trackingUrl: this.config.getTrackingUrl(trackingId),
          responseTime: responseTime,
          timestamp: new Date().toISOString()
        };
      } else {
        throw new Error('No tracking data found for this tracking ID');
      }

    } catch (error) {
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      logger.error(`Ekart tracking failed: ${error.message}`, {
        trackingId,
        responseTime: `${responseTime}ms`
      });

      return {
        success: true,
        trackingId: trackingId,
        trackingUrl: this.config.getTrackingUrl(trackingId),
        courierName: 'Ekart Logistics',
        trackingType: 'MANUAL_REQUIRED',
        apiError: error.message,
        status: 'API Error',
        statusDetail: 'Tracking API failed, manual tracking required',
        instructions: {
          step1: `Visit ${this.config.getTrackingUrl(trackingId)}`,
          step2: 'View real-time tracking status',
          step3: 'Contact support if tracking ID is invalid',
          step4: 'Use Ekart customer service for assistance'
        },
        message: 'API tracking failed. Manual tracking required.',
        responseTime: responseTime,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Download labels for shipments
   * @param {Array} trackingIds - Array of tracking IDs
   * @param {boolean} jsonOnly - Return JSON data only
   * @returns {Object} - Label download response
   */
  async downloadLabels(trackingIds, jsonOnly = false) {
    const startTime = Date.now();
    
    try {
      logger.info('Ekart label download request:', { 
        count: trackingIds.length,
        jsonOnly 
      });

      if (trackingIds.length > this.config.MAX_LABEL_IDS) {
        throw new Error(`Maximum ${this.config.MAX_LABEL_IDS} tracking IDs allowed per request`);
      }

      const token = await this.getAccessToken();
      const apiClient = this.createApiClient(token);
      const endpoint = this.config.ENDPOINTS.DOWNLOAD_LABEL;

      const params = jsonOnly ? { json_only: true } : {};
      const payload = { ids: trackingIds };

      const response = await apiClient.post(endpoint, payload, { params });
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      logger.info('Ekart label download response:', {
        status: response.status,
        responseTime: `${responseTime}ms`,
        contentType: response.headers['content-type']
      });

      if (jsonOnly) {
        return {
          success: true,
          labelData: response.data,
          format: 'JSON',
          responseTime: responseTime,
          timestamp: new Date().toISOString()
        };
      } else {
        return {
          success: true,
          labelPdf: response.data,
          format: 'PDF',
          contentType: response.headers['content-type'],
          responseTime: responseTime,
          timestamp: new Date().toISOString()
        };
      }

    } catch (error) {
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      logger.error(`Ekart label download failed: ${error.message}`, {
        trackingIds,
        responseTime: `${responseTime}ms`
      });

      return {
        success: false,
        error: error.message,
        responseTime: responseTime,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Generate manifest for shipments
   * @param {Array} trackingIds - Array of tracking IDs
   * @returns {Object} - Manifest generation response
   */
  async generateManifest(trackingIds) {
    const startTime = Date.now();
    
    try {
      logger.info('Ekart manifest generation request:', { 
        count: trackingIds.length 
      });

      if (trackingIds.length > this.config.MAX_MANIFEST_IDS) {
        throw new Error(`Maximum ${this.config.MAX_MANIFEST_IDS} tracking IDs allowed per request`);
      }

      const token = await this.getAccessToken();
      const apiClient = this.createApiClient(token);
      const endpoint = this.config.ENDPOINTS.GENERATE_MANIFEST;

      const payload = { ids: trackingIds };

      const response = await apiClient.post(endpoint, payload);
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      logger.info('Ekart manifest generation response:', {
        status: response.status,
        responseTime: `${responseTime}ms`,
        hasManifestUrl: !!response.data?.manifestDownloadUrl
      });

      if (response.data && response.data.manifestDownloadUrl) {
        return {
          success: true,
          manifestNumber: response.data.manifestNumber,
          manifestUrl: response.data.manifestDownloadUrl,
          generatedAt: new Date(response.data.ctime).toISOString(),
          responseTime: responseTime,
          timestamp: new Date().toISOString()
        };
      } else {
        throw new Error('Failed to generate manifest');
      }

    } catch (error) {
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      logger.error(`Ekart manifest generation failed: ${error.message}`, {
        trackingIds,
        responseTime: `${responseTime}ms`
      });

      return {
        success: false,
        error: error.message,
        responseTime: responseTime,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Take NDR action for a shipment
   * @param {Object} ndrData - NDR action data
   * @returns {Object} - NDR action response
   */
  async takeNDRAction(ndrData) {
    const startTime = Date.now();
    
    try {
      logger.info('Ekart NDR action request:', ndrData);

      const token = await this.getAccessToken();
      const apiClient = this.createApiClient(token);
      const endpoint = this.config.ENDPOINTS.NDR_ACTION;

      const response = await apiClient.post(endpoint, ndrData);
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      logger.info('Ekart NDR action response:', {
        status: response.status,
        responseTime: `${responseTime}ms`,
        success: !!response.data?.status
      });

      if (response.data && response.data.status) {
        return {
          success: true,
          message: response.data.remark || 'NDR action completed successfully',
          trackingId: ndrData.wbn,
          action: ndrData.action,
          responseTime: responseTime,
          timestamp: new Date().toISOString()
        };
      } else {
        throw new Error(response.data?.remark || 'NDR action failed');
      }

    } catch (error) {
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      logger.error(`Ekart NDR action failed: ${error.message}`, {
        ndrData,
        responseTime: `${responseTime}ms`
      });

      return {
        success: false,
        error: error.message,
        responseTime: responseTime,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get service health status
   * @returns {Object} - Health status information
   */
  async getHealthStatus() {
    try {
      logger.info('Ekart service health check');

      // Test authentication
      const token = await this.getAccessToken();
      
      if (token && typeof token === 'string') {
        return {
          status: 'HEALTHY',
          message: 'Ekart service is operational',
          details: {
            authentication: 'SUCCESS',
            apiEndpoint: this.config.BASE_URL,
            clientId: this.config.CLIENT_ID,
            hasCredentials: !!(this.config.USERNAME && this.config.PASSWORD)
          },
          timestamp: new Date().toISOString()
        };
      } else {
        throw new Error('Authentication failed');
      }

    } catch (error) {
      logger.error(`Ekart health check failed: ${error.message}`);
      
      return {
        status: 'UNHEALTHY',
        message: 'Ekart service has issues',
        error: error.message,
        details: {
          authentication: 'FAILED',
          apiEndpoint: this.config.BASE_URL,
          clientId: this.config.CLIENT_ID,
          hasCredentials: !!(this.config.USERNAME && this.config.PASSWORD)
        },
        timestamp: new Date().toISOString()
      };
    }
  }
}

// Export singleton instance
const ekartService = new EkartService();
export default ekartService; 