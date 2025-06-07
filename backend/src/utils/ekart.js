import axios from 'axios';
import { EKART_CONFIG } from '../config/ekart.config.js';
import { logger } from './logger.js';
import { getCache, setCache } from './redis.js';

/**
 * Professional Ekart Logistics API Integration
 * Based on official API documentation v3.8.1
 */

/**
 * Create authenticated axios instance for Ekart API
 * @param {string} token - Access token (optional)
 * @returns {Object} Configured axios instance
 */
const createEkartApiClient = (token = null) => {
  return axios.create({
    baseURL: EKART_CONFIG.BASE_URL,
    timeout: EKART_CONFIG.REQUEST_TIMEOUT,
    headers: EKART_CONFIG.getHeaders(token),
    validateStatus: (status) => status < 500 // Accept 4xx as valid responses
  });
};

/**
 * Get access token for Ekart API
 * @returns {string} - Access token
 */
export const authenticate = async () => {
  try {
    logger.info('Ekart authentication request');

    // Check if token exists in cache
    const cachedToken = await getCache(EKART_CONFIG.TOKEN_CACHE_KEY);
    if (cachedToken && cachedToken.expires_at > Date.now()) {
      logger.info('Using cached Ekart token');
      return cachedToken.access_token;
    }

    const apiClient = createEkartApiClient();
    const authUrl = EKART_CONFIG.getAuthUrl();

    const authPayload = {
      username: EKART_CONFIG.USERNAME,
      password: EKART_CONFIG.PASSWORD
    };

    logger.info('Ekart authentication request:', {
      url: authUrl,
      username: EKART_CONFIG.USERNAME,
      clientId: EKART_CONFIG.CLIENT_ID
    });

    const response = await apiClient.post(authUrl, authPayload);

    logger.info('Ekart authentication response:', {
      status: response.status,
      hasToken: !!response.data?.access_token,
      expiresIn: response.data?.expires_in
    });

    if (response.data && response.data.access_token) {
      const tokenData = {
        access_token: response.data.access_token,
        token_type: response.data.token_type || 'Bearer',
        expires_in: response.data.expires_in,
        expires_at: Date.now() + ((response.data.expires_in - EKART_CONFIG.TOKEN_EXPIRY_BUFFER) * 1000)
      };

      // Cache the token
      await setCache(EKART_CONFIG.TOKEN_CACHE_KEY, tokenData, response.data.expires_in - EKART_CONFIG.TOKEN_EXPIRY_BUFFER);

      return response.data.access_token;
    } else {
      throw new Error('No access token received from Ekart API');
    }

  } catch (error) {
    logger.error(`Ekart authentication failed: ${error.message}`, {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data
    });
    throw error;
  }
};

/**
 * Check pincode serviceability (V2)
 * @param {string|number} pincode - Pincode to check
 * @returns {Object} - Serviceability information
 */
export const checkServiceabilityV2 = async (pincode) => {
  try {
    logger.info(`Ekart serviceability check V2: ${pincode}`);

    const token = await authenticate();
    const apiClient = createEkartApiClient(token);
    const endpoint = `${EKART_CONFIG.ENDPOINTS.SERVICEABILITY_V2}/${pincode}`;

    const response = await apiClient.get(endpoint);

    logger.info('Ekart serviceability V2 response:', {
      status: response.status,
      pincode: pincode,
      serviceable: response.data?.status
    });

    if (response.data) {
      return {
        success: true,
        pincode: pincode,
        serviceable: response.data.status,
        details: response.data.details,
        message: response.data.remark,
        timestamp: new Date().toISOString()
      };
    } else {
      throw new Error('Invalid response from Ekart serviceability API');
    }

  } catch (error) {
    logger.error(`Ekart serviceability V2 check failed: ${error.message}`, {
      pincode,
      status: error.response?.status,
      data: error.response?.data
    });

    return {
      success: false,
      pincode: pincode,
      serviceable: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
};

/**
 * Check serviceability with pricing (V3)
 * @param {Object} serviceabilityData - Serviceability request data
 * @returns {Object} - Serviceability with pricing information
 */
export const checkServiceabilityV3 = async (serviceabilityData) => {
  try {
    logger.info('Ekart serviceability check V3:', serviceabilityData);

    const token = await authenticate();
    const apiClient = createEkartApiClient(token);
    const endpoint = EKART_CONFIG.ENDPOINTS.SERVICEABILITY_V3;

    const payload = {
      pickupPincode: String(serviceabilityData.pickupPincode),
      dropPincode: String(serviceabilityData.dropPincode),
      length: String(serviceabilityData.length || 10),
      height: String(serviceabilityData.height || 10),
      width: String(serviceabilityData.width || 10),
      weight: String(serviceabilityData.weight || 500),
      paymentType: serviceabilityData.paymentType || 'Prepaid',
      invoiceAmount: String(serviceabilityData.invoiceAmount || 100)
    };

    if (payload.paymentType === 'COD') {
      payload.codAmount = String(serviceabilityData.codAmount || serviceabilityData.invoiceAmount);
    }

    const response = await apiClient.post(endpoint, payload);

    logger.info('Ekart serviceability V3 response:', {
      status: response.status,
      courierPartners: response.data?.length || 0
    });

    if (response.data && Array.isArray(response.data)) {
      return {
        success: true,
        courierPartners: response.data,
        totalPartners: response.data.length,
        timestamp: new Date().toISOString()
      };
    } else {
      throw new Error('Invalid response from Ekart serviceability V3 API');
    }

  } catch (error) {
    logger.error(`Ekart serviceability V3 check failed: ${error.message}`, {
      serviceabilityData,
      status: error.response?.status,
      data: error.response?.data
    });

    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
};

/**
 * Create a shipment with Ekart API
 * @param {Object} shipmentDetails - Shipment booking details
 * @param {Object} partnerDetails - Partner configuration from the database
 * @returns {Object} - Booking response with tracking ID, label, etc.
 */
export const bookShipment = async (shipmentDetails, partnerDetails) => {
  try {
    logger.info('Ekart shipment booking request');

    const token = await authenticate();
    const apiClient = createEkartApiClient(token);
    const endpoint = EKART_CONFIG.ENDPOINTS.CREATE_SHIPMENT;

    // Transform shipment data to Ekart format
    const ekartShipmentData = EKART_CONFIG.transformShipmentData(shipmentDetails);

    // Validate shipment data
    const validation = EKART_CONFIG.validateShipmentData(ekartShipmentData);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    logger.info('Ekart shipment creation payload:', {
      orderNumber: ekartShipmentData.order_number,
      paymentMode: ekartShipmentData.payment_mode,
      codAmount: ekartShipmentData.cod_amount,
      weight: ekartShipmentData.weight
    });

    const response = await apiClient.put(endpoint, ekartShipmentData);

    logger.info('Ekart shipment booking response:', {
      status: response.status,
      success: response.data?.status,
      trackingId: response.data?.tracking_id
    });

    if (response.data && response.data.status) {
      return {
        success: true,
        trackingId: response.data.tracking_id,
        awb: response.data.tracking_id,
        vendor: response.data.vendor,
        barcodes: response.data.barcodes,
        trackingUrl: EKART_CONFIG.getTrackingUrl(response.data.tracking_id),
        courierName: 'Ekart Logistics',
        bookingType: 'API_AUTOMATED',
        message: response.data.remark || 'Shipment created successfully',
        timestamp: new Date().toISOString()
      };
    } else {
      throw new Error(response.data?.remark || 'Ekart shipment booking failed');
    }

  } catch (error) {
    logger.error(`Ekart shipment booking failed: ${error.message}`, {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data
    });

    return {
      success: false,
      error: `Ekart API booking failed: ${error.message}`,
      courierName: 'Ekart Logistics',
      bookingType: 'API_ERROR',
      apiError: error.message,
      instructions: {
        step1: 'Contact Ekart support for manual booking',
        step2: 'Provide shipment details manually',
        step3: 'Try again later when API is stable',
        step4: 'Consider using alternative courier partners'
      },
      availableAlternatives: ['BlueDart', 'Delhivery', 'Ecom Express', 'XpressBees'],
      message: 'Ekart API booking failed. Please try alternative couriers.',
      timestamp: new Date().toISOString()
    };
  }
};

/**
 * Cancel a shipment with Ekart API
 * @param {string} trackingId - Ekart tracking ID to cancel
 * @returns {Object} - Cancellation response
 */
export const cancelShipment = async (trackingId) => {
  try {
    logger.info('Ekart shipment cancellation request:', { trackingId });

    const token = await authenticate();
    const apiClient = createEkartApiClient(token);
    const endpoint = EKART_CONFIG.ENDPOINTS.CANCEL_SHIPMENT;

    const response = await apiClient.delete(endpoint, {
      params: { tracking_id: trackingId }
    });

    logger.info('Ekart shipment cancellation response:', {
      status: response.status,
      success: response.data?.status,
      trackingId: trackingId
    });

    if (response.data && response.data.status) {
      return {
        success: true,
        trackingId: trackingId,
        message: response.data.remark || 'Shipment cancelled successfully',
        timestamp: new Date().toISOString()
      };
    } else {
      throw new Error(response.data?.remark || 'Ekart shipment cancellation failed');
    }

  } catch (error) {
    logger.error(`Ekart shipment cancellation failed: ${error.message}`, {
      trackingId,
      status: error.response?.status,
      data: error.response?.data
    });

    return {
      success: false,
      trackingId: trackingId,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
};

/**
 * Track a shipment with Ekart API
 * @param {string} trackingId - Ekart tracking ID
 * @param {Object} partnerDetails - Partner configuration from the database
 * @returns {Object} - Tracking information
 */
export const trackShipment = async (trackingId, partnerDetails) => {
  try {
    logger.info('Ekart tracking request:', { trackingId });

    // Note: Tracking API is open and doesn't require authentication
    const apiClient = createEkartApiClient();
    const endpoint = `${EKART_CONFIG.ENDPOINTS.TRACK_SHIPMENT}/${trackingId}`;

    const response = await apiClient.get(endpoint);

    logger.info('Ekart tracking response:', {
      status: response.status,
      hasTrackData: !!response.data?.track,
      trackingId: trackingId
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
        trackingUrl: EKART_CONFIG.getTrackingUrl(trackingId),
        timestamp: new Date().toISOString()
      };
    } else {
      throw new Error('No tracking data found for this tracking ID');
    }

  } catch (error) {
    logger.error(`Ekart tracking failed: ${error.message}`, {
      trackingId,
      status: error.response?.status,
      data: error.response?.data
    });

    return {
      success: true,
      trackingId: trackingId,
      trackingUrl: EKART_CONFIG.getTrackingUrl(trackingId),
      courierName: 'Ekart Logistics',
      trackingType: 'MANUAL_REQUIRED',
      apiError: error.message,
      status: 'API Error',
      statusDetail: 'Tracking API failed, manual tracking required',
      instructions: {
        step1: `Visit ${EKART_CONFIG.getTrackingUrl(trackingId)}`,
        step2: 'View real-time tracking status',
        step3: 'Contact support if tracking ID is invalid',
        step4: 'Use Ekart customer service for assistance'
      },
      message: 'API tracking failed. Manual tracking required.',
      timestamp: new Date().toISOString()
    };
  }
};

/**
 * Download shipment labels
 * @param {Array} trackingIds - Array of tracking IDs (max 100)
 * @param {boolean} jsonOnly - Return JSON data only (default: false for PDF)
 * @returns {Object} - Label download response
 */
export const downloadLabels = async (trackingIds, jsonOnly = false) => {
  try {
    logger.info('Ekart label download request:', {
      count: trackingIds.length,
      jsonOnly
    });

    if (trackingIds.length > EKART_CONFIG.MAX_LABEL_IDS) {
      throw new Error(`Maximum ${EKART_CONFIG.MAX_LABEL_IDS} tracking IDs allowed per request`);
    }

    const token = await authenticate();
    const apiClient = createEkartApiClient(token);
    const endpoint = EKART_CONFIG.ENDPOINTS.DOWNLOAD_LABEL;

    const params = jsonOnly ? { json_only: true } : {};
    const payload = { ids: trackingIds };

    const response = await apiClient.post(endpoint, payload, { params });

    logger.info('Ekart label download response:', {
      status: response.status,
      contentType: response.headers['content-type']
    });

    if (jsonOnly) {
      return {
        success: true,
        labelData: response.data,
        format: 'JSON',
        timestamp: new Date().toISOString()
      };
    } else {
      return {
        success: true,
        labelPdf: response.data,
        format: 'PDF',
        contentType: response.headers['content-type'],
        timestamp: new Date().toISOString()
      };
    }

  } catch (error) {
    logger.error(`Ekart label download failed: ${error.message}`, {
      trackingIds,
      status: error.response?.status,
      data: error.response?.data
    });

    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
};

/**
 * Generate manifest for shipments
 * @param {Array} trackingIds - Array of tracking IDs (max 100)
 * @returns {Object} - Manifest generation response
 */
export const generateManifest = async (trackingIds) => {
  try {
    logger.info('Ekart manifest generation request:', {
      count: trackingIds.length
    });

    if (trackingIds.length > EKART_CONFIG.MAX_MANIFEST_IDS) {
      throw new Error(`Maximum ${EKART_CONFIG.MAX_MANIFEST_IDS} tracking IDs allowed per request`);
    }

    const token = await authenticate();
    const apiClient = createEkartApiClient(token);
    const endpoint = EKART_CONFIG.ENDPOINTS.GENERATE_MANIFEST;

    const payload = { ids: trackingIds };

    const response = await apiClient.post(endpoint, payload);

    logger.info('Ekart manifest generation response:', {
      status: response.status,
      hasManifestUrl: !!response.data?.manifestDownloadUrl
    });

    if (response.data && response.data.manifestDownloadUrl) {
      return {
        success: true,
        manifestNumber: response.data.manifestNumber,
        manifestUrl: response.data.manifestDownloadUrl,
        generatedAt: new Date(response.data.ctime).toISOString(),
        timestamp: new Date().toISOString()
      };
    } else {
      throw new Error('Failed to generate manifest');
    }

  } catch (error) {
    logger.error(`Ekart manifest generation failed: ${error.message}`, {
      trackingIds,
      status: error.response?.status,
      data: error.response?.data
    });

    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
};

/**
 * Take NDR action for a shipment
 * @param {Object} ndrData - NDR action data
 * @returns {Object} - NDR action response
 */
export const takeNDRAction = async (ndrData) => {
  try {
    logger.info('Ekart NDR action request:', ndrData);

    const token = await authenticate();
    const apiClient = createEkartApiClient(token);
    const endpoint = EKART_CONFIG.ENDPOINTS.NDR_ACTION;

    const response = await apiClient.post(endpoint, ndrData);

    logger.info('Ekart NDR action response:', {
      status: response.status,
      success: response.data?.status
    });

    if (response.data && response.data.status) {
      return {
        success: true,
        message: response.data.remark || 'NDR action completed successfully',
        trackingId: ndrData.wbn,
        action: ndrData.action,
        timestamp: new Date().toISOString()
      };
    } else {
      throw new Error(response.data?.remark || 'NDR action failed');
    }

  } catch (error) {
    logger.error(`Ekart NDR action failed: ${error.message}`, {
      ndrData,
      status: error.response?.status,
      data: error.response?.data
    });

    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
};

/**
 * Add an address to Ekart
 * @param {Object} addressData - Address data
 * @returns {Object} - Address addition response
 */
export const addAddress = async (addressData) => {
  try {
    logger.info('Ekart add address request:', addressData);

    const token = await authenticate();
    const apiClient = createEkartApiClient(token);
    const endpoint = EKART_CONFIG.ENDPOINTS.ADD_ADDRESS;

    const response = await apiClient.post(endpoint, addressData);

    logger.info('Ekart add address response:', {
      status: response.status,
      success: response.data?.status
    });

    if (response.data && response.data.status) {
      return {
        success: true,
        alias: response.data.alias,
        message: response.data.remark || 'Address added successfully',
        timestamp: new Date().toISOString()
      };
    } else {
      throw new Error(response.data?.remark || 'Failed to add address');
    }

  } catch (error) {
    logger.error(`Ekart add address failed: ${error.message}`, {
      addressData,
      status: error.response?.status,
      data: error.response?.data
    });

    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
};

/**
 * Get all addresses from Ekart
 * @returns {Object} - Addresses list response
 */
export const getAddresses = async () => {
  try {
    logger.info('Ekart get addresses request');

    const token = await authenticate();
    const apiClient = createEkartApiClient(token);
    const endpoint = EKART_CONFIG.ENDPOINTS.GET_ADDRESSES;

    const response = await apiClient.get(endpoint);

    logger.info('Ekart get addresses response:', {
      status: response.status,
      count: response.data?.length || 0
    });

    if (response.data && Array.isArray(response.data)) {
      return {
        success: true,
        addresses: response.data,
        count: response.data.length,
        timestamp: new Date().toISOString()
      };
    } else {
      throw new Error('Failed to get addresses');
    }

  } catch (error) {
    logger.error(`Ekart get addresses failed: ${error.message}`, {
      status: error.response?.status,
      data: error.response?.data
    });

    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
};

/**
 * Get pricing estimates
 * @param {Object} estimateData - Estimate request data
 * @returns {Object} - Pricing estimate response
 */
export const getPricingEstimate = async (estimateData) => {
  try {
    logger.info('Ekart pricing estimate request:', estimateData);

    const token = await authenticate();
    const apiClient = createEkartApiClient(token);
    const endpoint = EKART_CONFIG.ENDPOINTS.ESTIMATE_PRICING;

    const response = await apiClient.post(endpoint, estimateData);

    logger.info('Ekart pricing estimate response:', {
      status: response.status,
      hasEstimate: !!response.data?.total
    });

    if (response.data) {
      return {
        success: true,
        estimate: response.data,
        timestamp: new Date().toISOString()
      };
    } else {
      throw new Error('Failed to get pricing estimate');
    }

  } catch (error) {
    logger.error(`Ekart pricing estimate failed: ${error.message}`, {
      estimateData,
      status: error.response?.status,
      data: error.response?.data
    });

    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
};

/**
 * Calculate rate for shipment (compatibility function)
 * @param {Object} packageDetails - Package details
 * @param {Object} deliveryDetails - Delivery details
 * @param {Object} partnerDetails - Partner configuration
 * @returns {Object} - Rate calculation response
 */
export const calculateRate = async (packageDetails, deliveryDetails, partnerDetails) => {
  try {
    logger.info('Ekart rate calculation request');

    const estimateData = {
      pickupPincode: parseInt(deliveryDetails.pickupPincode),
      dropPincode: parseInt(deliveryDetails.deliveryPincode),
      invoiceAmount: packageDetails.declaredValue || 100,
      weight: Math.round((packageDetails.weight || 1) * 1000), // Convert to grams
      length: Math.round(packageDetails.dimensions?.length || 10),
      height: Math.round(packageDetails.dimensions?.height || 10),
      width: Math.round(packageDetails.dimensions?.width || 10),
      serviceType: packageDetails.serviceType === 'express' ? 'EXPRESS' : 'SURFACE',
      codAmount: packageDetails.cod ? (packageDetails.codAmount || packageDetails.declaredValue || 100) : 0
    };

    const result = await getPricingEstimate(estimateData);

    if (result.success) {
      return {
        success: true,
        rate: {
          baseRate: parseFloat(result.estimate.shippingCharge || 0),
          totalRate: parseFloat(result.estimate.total || 0),
          codCharges: parseFloat(result.estimate.codCharge || 0),
          fuelSurcharge: parseFloat(result.estimate.fuelSurcharge || 0),
          taxes: parseFloat(result.estimate.taxes || 0),
          currency: 'INR',
          zone: result.estimate.zone,
          serviceType: estimateData.serviceType,
          estimateId: result.estimate.rid
        },
        courierName: 'Ekart Logistics',
        timestamp: result.timestamp
      };
    } else {
      throw new Error(result.error);
    }

  } catch (error) {
    logger.error(`Ekart rate calculation failed: ${error.message}`);

    return {
      success: false,
      error: error.message,
      courierName: 'Ekart Logistics',
      timestamp: new Date().toISOString()
    };
  }
};
