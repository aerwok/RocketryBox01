import axios from 'axios';
import { logger } from './logger.js';
import { BLUEDART_CONFIG } from '../config/bluedart.config.js';

/**
 * Professional BlueDart REST API Integration
 * Based on Official BlueDart API User Guide
 */

// Token cache
let cachedToken = null;
let tokenExpiry = null;

/**
 * Get JWT token for BlueDart API authentication
 * @returns {string} JWT token
 * @throws {Error} If authentication fails
 */
const getAuthToken = async () => {
  try {
    // Check if we have a valid cached token
    if (cachedToken && tokenExpiry && new Date() < tokenExpiry) {
      return cachedToken;
    }

    logger.info('Generating new BlueDart JWT token');
    
    // Validate configuration
    if (!BLUEDART_CONFIG.LICENSE_KEY || !BLUEDART_CONFIG.USER) {
      throw new Error('BlueDart API credentials not configured properly');
    }

    // Prepare authentication request using official format
    const authPayload = {
      profile: {
        Api_type: BLUEDART_CONFIG.API_TYPE,
        LicenceKey: BLUEDART_CONFIG.LICENSE_KEY,
        LoginID: BLUEDART_CONFIG.USER
      }
    };

    logger.info('BlueDart Authentication Request:', {
      authUrl: BLUEDART_CONFIG.AUTH_URL,
      loginID: BLUEDART_CONFIG.USER,
      apiType: BLUEDART_CONFIG.API_TYPE
    });

    const response = await axios.post(BLUEDART_CONFIG.AUTH_URL, authPayload, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: BLUEDART_CONFIG.REQUEST_TIMEOUT
    });

    logger.info('BlueDart Auth Response:', {
      status: response.status,
      hasData: !!response.data,
      dataKeys: response.data ? Object.keys(response.data) : []
    });

    // Extract token from response
    const token = response.data?.JWTToken || response.data?.token || response.data?.access_token;
    
    if (!token) {
      logger.error('BlueDart Auth Response Data:', response.data);
      throw new Error('BlueDart API authentication failed: No token received');
    }

    cachedToken = token;
    tokenExpiry = new Date(Date.now() + BLUEDART_CONFIG.TOKEN_EXPIRY);
    logger.info('BlueDart JWT token generated successfully');
    return cachedToken;

  } catch (error) {
    // Clear cached token on error
    cachedToken = null;
    tokenExpiry = null;
    
    logger.error('BlueDart authentication failed:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
    
    throw new Error(`BlueDart API authentication failed: ${error.message}`);
  }
};

/**
 * Create authenticated axios instance for BlueDart API
 * @returns {Object} Configured axios instance
 */
const createBlueDartApiClient = async () => {
  const token = await getAuthToken();
  
  return axios.create({
    baseURL: BLUEDART_CONFIG.API_URL,
    timeout: BLUEDART_CONFIG.REQUEST_TIMEOUT,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
      'JWTToken': token
    }
  });
};

/**
 * Calculate shipping rates using BlueDart REST API
 * @param {Object} packageDetails - Package weight and dimensions
 * @param {Object} deliveryDetails - Pickup and delivery details
 * @param {Object} partnerDetails - Partner configuration from the database
 * @returns {Object} - Shipping rate quote
 */
export const calculateRate = async (packageDetails, deliveryDetails, partnerDetails) => {
  try {
    // Validate input parameters
    if (!packageDetails || !deliveryDetails) {
      throw new Error('Missing required parameters for BlueDart rate calculation');
    }
    
    if (!deliveryDetails.pickupPincode || !deliveryDetails.deliveryPincode) {
      throw new Error('Missing pickup or delivery pincode for BlueDart rate calculation');
    }

    logger.info('BlueDart REST API rate calculation request:', {
      pickupPincode: deliveryDetails.pickupPincode,
      deliveryPincode: deliveryDetails.deliveryPincode,
      weight: packageDetails.weight,
      serviceType: packageDetails.serviceType
    });

    // Create authenticated API client
    const apiClient = await createBlueDartApiClient();

    // Calculate volumetric weight
    const volumetricWeight = Math.ceil(
      (packageDetails.dimensions.length * 
       packageDetails.dimensions.width * 
       packageDetails.dimensions.height) / 
      BLUEDART_CONFIG.DIMENSIONAL_FACTOR
    );

    // Use the higher of actual and volumetric weight
    const chargeableWeight = Math.max(packageDetails.weight, volumetricWeight);

    // Prepare rate calculation request using official format
    const ratePayload = {
      request: {
        OriginPincode: deliveryDetails.pickupPincode,
        DestinationPincode: deliveryDetails.deliveryPincode,
        ProductCode: packageDetails.serviceType === 'express' ? 'A' : 'D',
        SubProductCode: 'P',
        PaymentType: 'P', // Prepaid
        DeclaredValue: packageDetails.declaredValue || 100,
        Weight: chargeableWeight,
        Dimensions: {
          Length: packageDetails.dimensions.length,
          Width: packageDetails.dimensions.width,
          Height: packageDetails.dimensions.height
        }
      },
      profile: {
        Api_type: BLUEDART_CONFIG.API_TYPE,
        LicenceKey: BLUEDART_CONFIG.LICENSE_KEY,
        LoginID: BLUEDART_CONFIG.USER
      }
    };

    // Make API call to BlueDart
    const response = await apiClient.post('/in/transportation/rates/v1/calculate', ratePayload);

    logger.info('BlueDart REST API response received:', {
      status: response.status,
      hasData: !!response.data,
      success: response.data?.success
    });

    // Process successful response
    if (response.data && (response.data.success || response.data.Status === 'Success')) {
      const rateData = response.data.data || response.data.Response || response.data;
      
      return {
        success: true,
        provider: {
          id: partnerDetails?.id || 'bluedart',
          name: 'Blue Dart Express',
          logoUrl: partnerDetails?.logoUrl,
          expressDelivery: packageDetails.serviceType === 'express',
          estimatedDays: packageDetails.serviceType === 'express' ? '1-2' : '2-3'
        },
        totalRate: parseFloat(rateData.TotalAmount || rateData.Rate || rateData.TotalRate || 100),
        volumetricWeight: volumetricWeight.toFixed(2),
        chargeableWeight: chargeableWeight.toFixed(2),
        breakdown: {
          baseRate: parseFloat(rateData.BaseRate || BLUEDART_CONFIG.BASE_RATE),
          weightCharge: parseFloat(rateData.WeightCharge || (chargeableWeight * BLUEDART_CONFIG.WEIGHT_RATE)),
          codCharge: 0,
          fuelSurcharge: parseFloat(rateData.FuelSurcharge || 0),
          otherCharges: parseFloat(rateData.OtherCharges || 0)
        },
        // API status indicators
        rateType: 'LIVE_API',
        apiStatus: 'AVAILABLE',
        lastUpdated: new Date().toISOString()
      };
    } else {
      throw new Error(response.data?.message || response.data?.ErrorMessage || 'BlueDart API returned unsuccessful response');
    }
  } catch (error) {
    logger.error(`BlueDart REST API rate calculation failed: ${error.message}`);
    
    // If API fails, fall back to configured rates with clear messaging
    if (error.response?.status === 401) {
      // Clear token cache on authentication error
      cachedToken = null;
      tokenExpiry = null;
    }
    
    // Fallback to configured rates
    logger.warn('Falling back to configured rates due to API error');
    
    const volumetricWeight = Math.ceil(
      (packageDetails.dimensions.length * 
       packageDetails.dimensions.width * 
       packageDetails.dimensions.height) / 
      BLUEDART_CONFIG.DIMENSIONAL_FACTOR
    );
    
    const chargeableWeight = Math.max(packageDetails.weight, volumetricWeight);
    const baseRate = partnerDetails?.rates?.baseRate || BLUEDART_CONFIG.BASE_RATE;
    const weightRate = partnerDetails?.rates?.weightRate || BLUEDART_CONFIG.WEIGHT_RATE;
    const serviceMultiplier = packageDetails.serviceType === 'express' ? 1.5 : 1.0;
    const weightCharge = chargeableWeight * weightRate;
    const serviceCharge = baseRate * serviceMultiplier;
    const totalRate = Math.round((baseRate + weightCharge + serviceCharge) * 100) / 100;

    return {
      success: true,
      provider: {
        id: partnerDetails?.id || 'bluedart',
        name: 'Blue Dart Express (Estimated)',
        logoUrl: partnerDetails?.logoUrl,
        expressDelivery: packageDetails.serviceType === 'express',
        estimatedDays: packageDetails.serviceType === 'express' ? '1-2' : '2-3'
      },
      totalRate: totalRate,
      volumetricWeight: volumetricWeight.toFixed(2),
      chargeableWeight: chargeableWeight.toFixed(2),
      breakdown: {
        baseRate: baseRate,
        weightCharge: weightCharge,
        serviceCharge: serviceCharge,
        codCharge: 0,
        fuelSurcharge: 0,
        otherCharges: 0
      },
      // Fallback status indicators
      rateType: 'CONFIGURED_FALLBACK',
      apiStatus: 'UNAVAILABLE',
      apiError: error.message,
      businessNote: 'Rate calculated using configured parameters due to API unavailability. Contact support for assistance.',
      lastUpdated: new Date().toISOString()
    };
  }
};

/**
 * Register pickup with BlueDart REST API
 * @param {Object} pickupDetails - Pickup registration details
 * @param {Object} partnerDetails - Partner configuration from the database
 * @returns {Object} - Pickup registration response
 */
export const registerPickup = async (pickupDetails, partnerDetails) => {
  try {
    logger.info('BlueDart REST API pickup registration request');

    // Create authenticated API client
    const apiClient = await createBlueDartApiClient();

    // Prepare pickup registration request using official format
    const pickupPayload = {
      request: {
        AWBNo: pickupDetails.awbNumbers || [""],
        AreaCode: pickupDetails.areaCode || "BOM",
        CISDDN: false,
        ContactPersonName: pickupDetails.contactPerson || "Contact Person",
        CustomerAddress1: pickupDetails.address.line1,
        CustomerAddress2: pickupDetails.address.line2 || "",
        CustomerAddress3: pickupDetails.address.line3 || "",
        CustomerCode: BLUEDART_CONFIG.USER,
        CustomerName: pickupDetails.customerName,
        CustomerPincode: pickupDetails.address.pincode,
        CustomerTelephoneNumber: pickupDetails.phone,
        DoxNDox: "1",
        EmailID: pickupDetails.email || "",
        IsForcePickup: false,
        IsReversePickup: false,
        MobileTelNo: pickupDetails.phone,
        NumberofPieces: pickupDetails.numberOfPieces || 1,
        OfficeCloseTime: "18:00",
        PackType: "",
        ProductCode: pickupDetails.serviceType === 'express' ? 'A' : 'D',
        ReferenceNo: pickupDetails.referenceNumber || "",
        Remarks: pickupDetails.remarks || "",
        RouteCode: "",
        ShipmentPickupDate: `/Date(${new Date(pickupDetails.pickupDate).getTime()})/`,
        ShipmentPickupTime: pickupDetails.pickupTime || "16:00",
        SubProducts: ["E-Tailing"],
        VolumeWeight: pickupDetails.volumetricWeight || 0.5,
        WeightofShipment: pickupDetails.weight,
        isToPayShipper: false
      },
      profile: {
        Api_type: BLUEDART_CONFIG.API_TYPE,
        LicenceKey: BLUEDART_CONFIG.LICENSE_KEY,
        LoginID: BLUEDART_CONFIG.USER
      }
    };

    // Make API call to BlueDart
    const response = await apiClient.post('/in/transportation/pickup/v1', pickupPayload);

    // Process successful response
    if (response.data && (response.data.success || response.data.Status === 'Success')) {
      const pickupData = response.data.data || response.data.Response || response.data;
      
      return {
        success: true,
        pickupRequestNumber: pickupData.PickupRequestNumber || pickupData.RequestNumber,
        pickupDate: pickupDetails.pickupDate,
        pickupTime: pickupDetails.pickupTime,
        courierName: 'Blue Dart Express',
        message: 'Pickup registered successfully via BlueDart REST API',
        timestamp: new Date().toISOString()
      };
    } else {
      throw new Error(response.data?.message || response.data?.ErrorMessage || 'BlueDart pickup registration failed');
    }
  } catch (error) {
    logger.error(`BlueDart REST API pickup registration failed: ${error.message}`);
    
    return {
      success: false,
      error: error.message,
      courierName: 'Blue Dart Express',
      message: 'Pickup registration failed. Please contact support.',
      timestamp: new Date().toISOString()
    };
  }
};

/**
 * Book a shipment with BlueDart REST API
 * @param {Object} shipmentDetails - Shipment booking details
 * @param {Object} partnerDetails - Partner configuration from the database
 * @returns {Object} - Booking response with AWB number, label, etc.
 */
export const bookShipment = async (shipmentDetails, partnerDetails) => {
  try {
    logger.info('BlueDart REST API shipment booking request');

    // Create authenticated API client
    const apiClient = await createBlueDartApiClient();

    // Prepare booking request using official format
    const bookingPayload = {
      request: {
        ReferenceNumber: shipmentDetails.referenceNumber,
        ProductType: shipmentDetails.serviceType === 'express' ? 'A' : 'D',
        SubProductType: 'P',
        PaymentType: 'P', // Prepaid
        DeclaredValue: shipmentDetails.declaredValue || 100,
        Weight: shipmentDetails.weight,
        Dimensions: {
          Length: shipmentDetails.dimensions.length,
          Width: shipmentDetails.dimensions.width,
          Height: shipmentDetails.dimensions.height
        },
        Commodity: shipmentDetails.commodity || 'GENERAL GOODS',
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
        }
      },
      profile: {
        Api_type: BLUEDART_CONFIG.API_TYPE,
        LicenceKey: BLUEDART_CONFIG.LICENSE_KEY,
        LoginID: BLUEDART_CONFIG.USER
      }
    };

    // Make API call to BlueDart
    const response = await apiClient.post('/in/transportation/waybill/v1/generate', bookingPayload);

    // Process successful response
    if (response.data && (response.data.success || response.data.Status === 'Success')) {
      const bookingData = response.data.data || response.data.Response || response.data;
      
      return {
        success: true,
        awb: bookingData.AWBNumber || bookingData.WaybillNumber,
        trackingUrl: BLUEDART_CONFIG.getTrackingUrl(bookingData.AWBNumber || bookingData.WaybillNumber),
        label: bookingData.ShippingLabel || null,
        manifest: bookingData.Manifest || null,
        courierName: 'Blue Dart Express',
        bookingType: 'API_AUTOMATED',
        message: 'Shipment booked successfully via BlueDart REST API',
        timestamp: new Date().toISOString()
      };
    } else {
      throw new Error(response.data?.message || response.data?.ErrorMessage || 'BlueDart booking failed');
    }
  } catch (error) {
    logger.error(`BlueDart REST API booking failed: ${error.message}`);
    
    // Generate temporary reference for manual processing
    const tempReference = `BD${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
    
    return {
      success: true,
      awb: tempReference,
      trackingUrl: `https://www.bluedart.com/tracking`,
      courierName: 'Blue Dart Express',
      bookingType: 'MANUAL_REQUIRED',
      apiError: error.message,
      instructions: {
        step1: 'Visit BlueDart business portal or call 1860 233 1234',
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
 * Track a shipment with BlueDart REST API
 * @param {string} trackingNumber - AWB number to track
 * @param {Object} partnerDetails - Partner configuration from the database
 * @returns {Object} - Tracking information
 */
export const trackShipment = async (trackingNumber, partnerDetails) => {
  try {
    logger.info('BlueDart REST API tracking request:', { trackingNumber });

    // Create authenticated API client
    const apiClient = await createBlueDartApiClient();

    // Prepare tracking request using official format
    const trackingPayload = {
      request: {
        AWBNumber: trackingNumber
      },
      profile: {
        Api_type: BLUEDART_CONFIG.API_TYPE,
        LicenceKey: BLUEDART_CONFIG.LICENSE_KEY,
        LoginID: BLUEDART_CONFIG.USER
      }
    };

    // Make API call to BlueDart
    const response = await apiClient.post('/in/transportation/track/v1/status', trackingPayload);

    // Process successful response
    if (response.data && (response.data.success || response.data.Status === 'Success')) {
      const trackingData = response.data.data || response.data.Response || response.data;
      
      return {
        success: true,
        trackingNumber: trackingNumber,
        status: trackingData.Status || trackingData.ShipmentStatus,
        statusDetail: trackingData.StatusDetail || trackingData.StatusDescription,
        currentLocation: trackingData.CurrentLocation || trackingData.Location,
        timestamp: trackingData.Timestamp || trackingData.StatusDate,
        estimatedDelivery: trackingData.EstimatedDelivery || trackingData.ExpectedDeliveryDate,
        trackingHistory: trackingData.TrackingHistory || trackingData.StatusHistory || [],
        courierName: 'Blue Dart Express',
        trackingType: 'API_AUTOMATED',
        lastUpdated: new Date().toISOString()
      };
    } else {
      throw new Error(response.data?.message || response.data?.ErrorMessage || 'BlueDart tracking failed');
    }
  } catch (error) {
    logger.error(`BlueDart REST API tracking failed: ${error.message}`);
    
    return {
      success: true,
      trackingNumber: trackingNumber,
      trackingUrl: `https://www.bluedart.com/tracking`,
      courierName: 'Blue Dart Express',
      trackingType: 'MANUAL_REQUIRED',
      apiError: error.message,
      instructions: {
        step1: 'Visit https://www.bluedart.com/tracking',
        step2: 'Enter AWB number in the tracking field',
        step3: 'View real-time tracking status',
        step4: 'Contact support if API issues persist'
      },
      message: 'API tracking failed. Manual tracking required.',
      timestamp: new Date().toISOString()
    };
  }
};

// Export default object with all functions
export default {
  calculateRate,
  registerPickup,
  bookShipment,
  trackShipment
}; 