import { getPartnerDetails } from './shipping.js';
import bluedart from './bluedart.js';
import delhivery from './delhivery.js';
import dtdc from './dtdc.js';
import ekart from './ekart.js';
import xpressbees from './xpressbees.js';
import { logger } from './logger.js';

// Map of courier codes to their respective modules
const courierModules = {
  BLUEDART: bluedart,
  DELHIVERY: delhivery,
  DTDC: dtdc,
  EKART: ekart,
  XPRESSBEES: xpressbees
};

/**
 * Courier factory that returns the appropriate courier service handler
 * based on the courier code
 * @param {string} courierCode - The courier code (e.g., 'BLUEDART', 'DELHIVERY')
 * @returns {Object} - The courier handler with methods for rate calculation, booking, etc.
 */
export const getCourierHandler = async (courierCode) => {
  try {
    // Standardize courier code
    const normalizedCode = courierCode.toUpperCase();
    
    // Get partner configuration from database
    const partnerDetails = await getPartnerDetails(courierCode);
    
    if (!partnerDetails) {
      throw new Error(`Partner configuration not found for ${courierCode}`);
    }
    
    // Check if courier module exists
    const courierModule = courierModules[normalizedCode];
    
    if (!courierModule) {
      throw new Error(`Courier module not found for ${courierCode}`);
    }
    
    // Return a handler with methods that use the partner details
    return {
      calculateRate: (packageDetails, deliveryDetails) => 
        courierModule.calculateRate(packageDetails, deliveryDetails, partnerDetails),
      
      bookShipment: (shipmentDetails) => 
        courierModule.bookShipment(shipmentDetails, partnerDetails),
      
      trackShipment: (trackingNumber) => 
        courierModule.trackShipment(trackingNumber, partnerDetails),
      
      partnerDetails: {
        id: partnerDetails.id,
        name: partnerDetails.name,
        serviceTypes: partnerDetails.serviceTypes,
        weightLimits: partnerDetails.weightLimits,
        dimensionLimits: partnerDetails.dimensionLimits
      }
    };
  } catch (error) {
    logger.error(`Error getting courier handler for ${courierCode}: ${error.message}`);
    return null;
  }
};

/**
 * Book a shipment with the specified courier
 * @param {string} courierCode - The courier code
 * @param {Object} shipmentDetails - The shipment details
 * @returns {Object} - The booking response
 */
export const bookShipment = async (courierCode, shipmentDetails) => {
  try {
    const courierHandler = await getCourierHandler(courierCode);
    
    if (!courierHandler) {
      throw new Error(`Could not initialize handler for ${courierCode}`);
    }
    
    return await courierHandler.bookShipment(shipmentDetails);
  } catch (error) {
    logger.error(`Error booking shipment with ${courierCode}: ${error.message}`);
    return {
      success: false,
      error: error.message,
      courierName: courierCode
    };
  }
};

export default {
  getCourierHandler,
  bookShipment
}; 