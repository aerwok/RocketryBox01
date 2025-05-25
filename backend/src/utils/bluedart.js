import axios from 'axios';
import { logger } from './logger.js';
import { BLUEDART_CONFIG } from '../config/bluedart.config.js';

// Create a custom axios instance for BlueDart API
const bluedartApi = axios.create({
  baseURL: BLUEDART_CONFIG.API_URL,
  timeout: BLUEDART_CONFIG.REQUEST_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Add response interceptor for better error handling
bluedartApi.interceptors.response.use(
  response => response,
  async error => {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      logger.error('BlueDart API Error:', {
        status: error.response.status,
        data: error.response.data,
        config: {
          url: error.config.url,
          method: error.config.method,
          data: error.config.data
        }
      });
    } else if (error.request) {
      // The request was made but no response was received
      logger.error('BlueDart API No Response:', {
        request: error.request
      });
    } else {
      // Something happened in setting up the request that triggered an Error
      logger.error('BlueDart API Request Error:', {
        message: error.message
      });
    }
    return Promise.reject(error);
  }
);

/**
 * Calculate shipping rates using BlueDart API
 * @param {Object} packageDetails - Package weight and dimensions
 * @param {Object} deliveryDetails - Pickup and delivery details
 * @param {Object} partnerDetails - Partner configuration from the database
 * @returns {Object} - Shipping rate quote
 */
export const calculateRate = async (packageDetails, deliveryDetails, partnerDetails) => {
  try {
    // Use environment configuration as fallback
    const apiKey = partnerDetails?.apiKey || BLUEDART_CONFIG.LICENSE_KEY;
    const apiEndpoint = partnerDetails?.apiEndpoint || BLUEDART_CONFIG.API_URL;
    
    logger.info('BlueDart API Configuration:', {
      apiEndpoint,
      hasApiKey: !!apiKey,
      isDevelopment: BLUEDART_CONFIG.IS_DEVELOPMENT
    });
    
    if (!apiKey) {
      throw new Error('Missing BlueDart API credentials');
    }

    // Prepare the request payload using partner-specific configuration
    const payload = {
      Request: {
        ServiceHeader: {
          UserID: BLUEDART_CONFIG.USER,
          APIType: BLUEDART_CONFIG.API_TYPE,
          Version: BLUEDART_CONFIG.VERSION
        },
        ConsigneeDetails: {
          ConsigneePincode: deliveryDetails.deliveryPincode
        },
        ShipperDetails: {
          ShipperPincode: deliveryDetails.pickupPincode
        },
        ShipmentDetails: {
          ProductType: packageDetails.serviceType || BLUEDART_CONFIG.DEFAULT_PRODUCT_CODE,
          SubProductType: packageDetails.subServiceType || BLUEDART_CONFIG.DEFAULT_SUB_PRODUCT_CODE,
          PaymentType: packageDetails.cod ? 'C' : 'P',
          DeclaredValue: packageDetails.declaredValue || 0,
          Weight: packageDetails.weight,
          Dimensions: {
            Length: packageDetails.dimensions.length,
            Width: packageDetails.dimensions.width,
            Height: packageDetails.dimensions.height
          }
        }
      }
    };

    logger.info('Attempting BlueDart API call with payload:', {
      endpoint: `${apiEndpoint}/RateCalculator`,
      pickupPincode: deliveryDetails.pickupPincode,
      deliveryPincode: deliveryDetails.deliveryPincode,
      weight: packageDetails.weight
    });

    // Make API call to BlueDart
    const response = await bluedartApi.post('/RateCalculator', payload);

    // If API call is successful
    if (response.data && response.data.Response && response.data.Response.Status === 'Success') {
      // Calculate volumetric weight
      const volumetricWeight = 
        (packageDetails.dimensions.length * 
         packageDetails.dimensions.width * 
         packageDetails.dimensions.height) / 
        (partnerDetails?.rates?.dimensionalFactor || BLUEDART_CONFIG.DIMENSIONAL_FACTOR);

      // Use the higher of actual and volumetric weight
      const chargeableWeight = Math.max(packageDetails.weight, volumetricWeight);

      // Extract and format response data
      return {
        success: true,
        provider: {
          id: partnerDetails?.id || 'bluedart',
          name: partnerDetails?.name || 'Blue Dart',
          logoUrl: partnerDetails?.logoUrl,
          expressDelivery: true,
          estimatedDays: response.data.Response.EstimatedDeliveryDays || '1-2'
        },
        totalRate: response.data.Response.TotalAmount,
        volumetricWeight: volumetricWeight.toFixed(2),
        chargeableWeight: chargeableWeight.toFixed(2),
        breakdown: {
          baseRate: response.data.Response.BaseRate || BLUEDART_CONFIG.BASE_RATE,
          weightCharge: response.data.Response.WeightCharge || (chargeableWeight * BLUEDART_CONFIG.WEIGHT_RATE),
          codCharge: packageDetails.cod ? response.data.Response.CODCharge || BLUEDART_CONFIG.COD_CHARGE : 0,
          fuelSurcharge: response.data.Response.FuelSurcharge || 0,
          otherCharges: response.data.Response.OtherCharges || 0
        }
      };
    } else {
      throw new Error(response.data?.Response?.Error || 'Unknown error from BlueDart API');
    }
  } catch (error) {
    logger.error(`BlueDart API error: ${error.message}`);
    throw error; // Re-throw the error instead of falling back
  }
};

/**
 * Book a shipment with BlueDart
 * @param {Object} shipmentDetails - Shipment booking details
 * @param {Object} partnerDetails - Partner configuration from the database
 * @returns {Object} - Booking response with AWB number, label, etc.
 */
export const bookShipment = async (shipmentDetails, partnerDetails) => {
  try {
    // Use environment configuration as fallback
    const apiKey = partnerDetails?.apiKey || BLUEDART_CONFIG.LICENSE_KEY;
    const apiEndpoint = partnerDetails?.apiEndpoint || BLUEDART_CONFIG.API_URL;
    
    if (!apiKey) {
      throw new Error('Missing BlueDart API credentials');
    }

    // Prepare the request payload
    const payload = {
      Request: {
        ServiceHeader: {
          UserID: BLUEDART_CONFIG.USER,
          APIType: BLUEDART_CONFIG.API_TYPE,
          Version: BLUEDART_CONFIG.VERSION
        },
        ConsigneeDetails: {
          ConsigneeName: shipmentDetails.consignee.name,
          ConsigneeAddress1: shipmentDetails.consignee.address.line1,
          ConsigneeAddress2: shipmentDetails.consignee.address.line2 || '',
          ConsigneeAddress3: shipmentDetails.consignee.address.line3 || '',
          ConsigneePincode: shipmentDetails.consignee.address.pincode,
          ConsigneeCity: shipmentDetails.consignee.address.city,
          ConsigneeState: shipmentDetails.consignee.address.state,
          ConsigneeMobile: shipmentDetails.consignee.phone,
          ConsigneeEmail: shipmentDetails.consignee.email || ''
        },
        ShipperDetails: {
          ShipperName: shipmentDetails.shipper.name,
          ShipperAddress1: shipmentDetails.shipper.address.line1,
          ShipperAddress2: shipmentDetails.shipper.address.line2 || '',
          ShipperAddress3: shipmentDetails.shipper.address.line3 || '',
          ShipperPincode: shipmentDetails.shipper.address.pincode,
          ShipperCity: shipmentDetails.shipper.address.city,
          ShipperState: shipmentDetails.shipper.address.state,
          ShipperMobile: shipmentDetails.shipper.phone,
          ShipperEmail: shipmentDetails.shipper.email || ''
        },
        ShipmentDetails: {
          ReferenceNumber: shipmentDetails.referenceNumber,
          ProductType: shipmentDetails.serviceType || BLUEDART_CONFIG.DEFAULT_PRODUCT_CODE,
          SubProductType: shipmentDetails.subServiceType || BLUEDART_CONFIG.DEFAULT_SUB_PRODUCT_CODE,
          PaymentType: shipmentDetails.cod ? 'C' : 'P',
          DeclaredValue: shipmentDetails.declaredValue || 0,
          CODAmount: shipmentDetails.cod ? shipmentDetails.codAmount : 0,
          Weight: shipmentDetails.weight,
          Dimensions: {
            Length: shipmentDetails.dimensions.length,
            Width: shipmentDetails.dimensions.width,
            Height: shipmentDetails.dimensions.height
          },
          Commodity: shipmentDetails.commodity || 'GENERAL GOODS'
        }
      }
    };

    // Make API call to BlueDart
    const response = await bluedartApi.post('/ShipmentBooking', payload);

    // If API call is successful
    if (response.data && response.data.Response && response.data.Response.Status === 'Success') {
      return {
        success: true,
        awb: response.data.Response.AWBNumber,
        trackingUrl: BLUEDART_CONFIG.getTrackingUrl(response.data.Response.AWBNumber),
        label: response.data.Response.ShippingLabel,
        manifest: response.data.Response.Manifest || null,
        courierName: partnerDetails?.name || 'Blue Dart',
        message: response.data.Response.Message || 'Shipment booked successfully'
      };
    } else {
      throw new Error(response.data?.Response?.Error || 'Unknown error from BlueDart API');
    }
  } catch (error) {
    logger.error(`BlueDart booking error: ${error.message}`);
    throw error; // Re-throw the error instead of falling back
  }
};

/**
 * Track a shipment with BlueDart
 * @param {string} trackingNumber - AWB number to track
 * @param {Object} partnerDetails - Partner configuration from the database
 * @returns {Object} - Tracking information
 */
export const trackShipment = async (trackingNumber, partnerDetails) => {
  try {
    // Use environment configuration as fallback
    const apiKey = partnerDetails?.apiKey || BLUEDART_CONFIG.LICENSE_KEY;
    const apiEndpoint = partnerDetails?.apiEndpoint || BLUEDART_CONFIG.API_URL;
    
    if (!apiKey) {
      throw new Error('Missing BlueDart API credentials');
    }

    const payload = {
      Request: {
        ServiceHeader: {
          UserID: BLUEDART_CONFIG.USER,
          APIType: BLUEDART_CONFIG.API_TYPE,
          Version: BLUEDART_CONFIG.VERSION
        },
        ShipmentDetails: {
          AWBNumber: trackingNumber
        }
      }
    };

    // Make API call to BlueDart
    const response = await bluedartApi.post('/ShipmentTracking', payload);

    // If API call is successful
    if (response.data && response.data.Response && response.data.Response.Status === 'Success') {
      return {
        success: true,
        status: response.data.Response.Status,
        statusDetail: response.data.Response.StatusDetail,
        currentLocation: response.data.Response.CurrentLocation,
        timestamp: response.data.Response.Timestamp,
        estimatedDelivery: response.data.Response.EstimatedDelivery,
        trackingHistory: response.data.Response.TrackingHistory || [],
        courierName: partnerDetails?.name || 'Blue Dart'
      };
    } else {
      throw new Error(response.data?.Response?.Error || 'Unknown error from BlueDart API');
    }
  } catch (error) {
    logger.error(`BlueDart tracking error: ${error.message}`);
    throw error; // Re-throw the error instead of falling back
  }
};

// Export default object with all functions
export default {
  calculateRate,
  bookShipment,
  trackShipment
}; 