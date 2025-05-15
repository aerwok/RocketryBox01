import axios from 'axios';
import { logger } from './logger.js';

/**
 * Calculate shipping rates using BlueDart API
 * @param {Object} packageDetails - Package weight and dimensions
 * @param {Object} deliveryDetails - Pickup and delivery details
 * @param {Object} partnerDetails - Partner configuration from the database
 * @returns {Object} - Shipping rate quote
 */
export const calculateRate = async (packageDetails, deliveryDetails, partnerDetails) => {
  try {
    if (!partnerDetails || !partnerDetails.apiKey || !partnerDetails.apiEndpoint) {
      logger.error('Missing BlueDart API credentials');
      return null;
    }

    // Prepare the request payload using partner-specific configuration
    const payload = {
      Pickup_Pincode: deliveryDetails.pickupPincode,
      Delivery_Pincode: deliveryDetails.deliveryPincode,
      Weight: packageDetails.weight,
      Dimensions: {
        Length: packageDetails.dimensions.length,
        Width: packageDetails.dimensions.width,
        Height: packageDetails.dimensions.height
      },
      ProductCode: packageDetails.serviceType || 'EXPRESS',
      SubProductCode: packageDetails.subServiceType || 'PRIORITY 1030',
      SpecialService: packageDetails.cod ? 'COD' : '',
      Commodity_Value: packageDetails.declaredValue || 0,
      License_Key: partnerDetails.apiKey
    };

    // Make API call to BlueDart
    const response = await axios.post(
      `${partnerDetails.apiEndpoint}/rates/calculate`,
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${partnerDetails.apiKey}`
        }
      }
    );

    // If API call is successful
    if (response.data && response.data.success) {
      // Calculate volumetric weight
      const volumetricWeight = 
        (packageDetails.dimensions.length * 
         packageDetails.dimensions.width * 
         packageDetails.dimensions.height) / 
        partnerDetails.rates.dimensionalFactor;

      // Use the higher of actual and volumetric weight
      const chargeableWeight = Math.max(packageDetails.weight, volumetricWeight);

      // Extract and format response data
      return {
        success: true,
        provider: {
          id: partnerDetails.id,
          name: partnerDetails.name,
          logoUrl: partnerDetails.logoUrl,
          expressDelivery: true,
          estimatedDays: response.data.estimatedDeliveryDays || '2-4'
        },
        totalRate: response.data.totalRate,
        volumetricWeight: volumetricWeight.toFixed(2),
        chargeableWeight: chargeableWeight.toFixed(2),
        breakdown: {
          baseRate: response.data.baseRate || partnerDetails.rates.baseRate,
          weightCharge: response.data.weightCharge || (chargeableWeight * partnerDetails.rates.weightRate),
          codCharge: packageDetails.cod ? response.data.codCharge || 50 : 0,
          fuelSurcharge: response.data.fuelSurcharge || 0,
          otherCharges: response.data.otherCharges || 0
        }
      };
    } else {
      logger.warn(`BlueDart rate calculation failed: ${response.data?.message || 'Unknown error'}`);
      return null;
    }
  } catch (error) {
    logger.error(`BlueDart API error: ${error.message}`);
    // Fallback to manual calculation if API fails
    return fallbackRateCalculation(packageDetails, deliveryDetails, partnerDetails);
  }
};

/**
 * Fallback calculation method when API fails
 */
const fallbackRateCalculation = (packageDetails, deliveryDetails, partnerDetails) => {
  try {
    // Calculate volumetric weight
    const volumetricWeight = 
      (packageDetails.dimensions.length * 
       packageDetails.dimensions.width * 
       packageDetails.dimensions.height) / 
      partnerDetails.rates.dimensionalFactor;

    // Use the higher of actual and volumetric weight
    const chargeableWeight = Math.max(packageDetails.weight, volumetricWeight);
    
    // Basic rate calculation using partner configurations
    const baseRate = partnerDetails.rates.baseRate;
    const weightCharge = chargeableWeight * partnerDetails.rates.weightRate;
    const codCharge = packageDetails.cod ? 50 : 0;
    
    // Total charge
    const totalRate = baseRate + weightCharge + codCharge;
    
    return {
      success: true,
      provider: {
        id: partnerDetails.id,
        name: partnerDetails.name,
        logoUrl: partnerDetails.logoUrl,
        expressDelivery: true,
        estimatedDays: '2-4'
      },
      totalRate: Math.round(totalRate),
      volumetricWeight: volumetricWeight.toFixed(2),
      chargeableWeight: chargeableWeight.toFixed(2),
      breakdown: {
        baseRate,
        weightCharge,
        codCharge,
        fuelSurcharge: 0,
        otherCharges: 0
      },
      isEstimate: true // Flag to indicate this is a fallback calculation
    };
  } catch (error) {
    logger.error(`BlueDart fallback calculation error: ${error.message}`);
    return null;
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
    if (!partnerDetails || !partnerDetails.apiKey || !partnerDetails.apiEndpoint) {
      throw new Error('Missing BlueDart API credentials');
    }

    // Prepare the request payload
    const payload = {
      // Map shipment details to BlueDart API format
      ConsigneeName: shipmentDetails.consignee.name,
      ConsigneeAddress1: shipmentDetails.consignee.address.line1,
      ConsigneeAddress2: shipmentDetails.consignee.address.line2 || '',
      ConsigneeAddress3: shipmentDetails.consignee.address.line3 || '',
      ConsigneePin: shipmentDetails.consignee.address.pincode,
      ConsigneeCity: shipmentDetails.consignee.address.city,
      ConsigneeState: shipmentDetails.consignee.address.state,
      ConsigneeMobile: shipmentDetails.consignee.phone,
      ConsigneeEmail: shipmentDetails.consignee.email || '',
      
      ShipperName: shipmentDetails.shipper.name,
      ShipperAddress1: shipmentDetails.shipper.address.line1,
      ShipperAddress2: shipmentDetails.shipper.address.line2 || '',
      ShipperAddress3: shipmentDetails.shipper.address.line3 || '',
      ShipperPin: shipmentDetails.shipper.address.pincode,
      ShipperCity: shipmentDetails.shipper.address.city,
      ShipperState: shipmentDetails.shipper.address.state,
      ShipperMobile: shipmentDetails.shipper.phone,
      ShipperEmail: shipmentDetails.shipper.email || '',
      
      ReferenceNumber: shipmentDetails.referenceNumber,
      ProductCode: shipmentDetails.serviceType || 'EXPRESS',
      SubProductCode: shipmentDetails.subServiceType || 'PRIORITY 1030',
      ActualWeight: shipmentDetails.weight,
      Dimensions: {
        Length: shipmentDetails.dimensions.length,
        Width: shipmentDetails.dimensions.width,
        Height: shipmentDetails.dimensions.height
      },
      DeclaredValue: shipmentDetails.declaredValue || 0,
      CODAmount: shipmentDetails.cod ? shipmentDetails.codAmount : 0,
      SpecialService: shipmentDetails.cod ? 'COD' : '',
      Commodity: shipmentDetails.commodity || 'GENERAL GOODS',
      
      // API credentials
      License_Key: partnerDetails.apiKey
    };

    // Make API call to BlueDart
    const response = await axios.post(
      `${partnerDetails.apiEndpoint}/shipment/book`,
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${partnerDetails.apiKey}`
        }
      }
    );

    // If API call is successful
    if (response.data && response.data.success) {
      return {
        success: true,
        awb: response.data.AWBNumber,
        trackingUrl: partnerDetails.trackingUrl 
          ? `${partnerDetails.trackingUrl}${response.data.AWBNumber}` 
          : `https://www.bluedart.com/tracking/${response.data.AWBNumber}`,
        label: response.data.ShippingLabel,
        manifest: response.data.Manifest || null,
        courierName: partnerDetails.name,
        message: response.data.message || 'Shipment booked successfully'
      };
    } else {
      throw new Error(response.data?.message || 'Unknown error from BlueDart API');
    }
  } catch (error) {
    logger.error(`BlueDart booking error: ${error.message}`);
    // If in development, provide a mock response
    if (process.env.NODE_ENV === 'development') {
      return {
        success: true,
        awb: `BD${Date.now()}`,
        trackingUrl: `https://www.bluedart.com/tracking/BD${Date.now()}`,
        label: 'mock-label-data-base64',
        courierName: partnerDetails.name,
        message: 'Development mode: Mock booking successful',
        isDevelopment: true
      };
    }
    
    return {
      success: false,
      error: error.message,
      courierName: partnerDetails.name
    };
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
    if (!partnerDetails || !partnerDetails.apiKey || !partnerDetails.apiEndpoint) {
      throw new Error('Missing BlueDart API credentials');
    }

    // Make API call to BlueDart
    const response = await axios.get(
      `${partnerDetails.apiEndpoint}/tracking/${trackingNumber}`,
      {
        headers: {
          'Authorization': `Bearer ${partnerDetails.apiKey}`
        },
        params: {
          License_Key: partnerDetails.apiKey
        }
      }
    );

    // If API call is successful
    if (response.data && response.data.success) {
      return {
        success: true,
        status: response.data.status,
        statusDetail: response.data.statusDetail,
        currentLocation: response.data.currentLocation,
        timestamp: response.data.timestamp,
        estimatedDelivery: response.data.estimatedDelivery,
        trackingHistory: response.data.trackingHistory || [],
        courierName: partnerDetails.name
      };
    } else {
      throw new Error(response.data?.message || 'Unknown error from BlueDart API');
    }
  } catch (error) {
    logger.error(`BlueDart tracking error: ${error.message}`);
    return {
      success: false,
      error: error.message,
      courierName: partnerDetails.name
    };
  }
};

// Export default object with all functions
export default {
  calculateRate,
  bookShipment,
  trackShipment
}; 