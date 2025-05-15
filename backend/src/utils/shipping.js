import { AppError } from '../middleware/errorHandler.js';
import ShippingPartner from '../modules/admin/models/shippingPartner.model.js';
import * as bluedart from './bluedart.js';
import * as delhivery from './delhivery.js';
import * as dtdc from './dtdc.js';
import * as ekart from './ekart.js';
import * as xpressbees from './xpressbees.js';
import { calculateRate } from './courierRates.js';
import { getCache, setCache } from './redis.js';
import { logger } from './logger.js';

// Map of courier code to their respective utility modules
const courierModules = {
  BLUEDART: bluedart,
  DELHIVERY: delhivery,
  DTDC: dtdc,
  EKART: ekart,
  XPRESSBEES: xpressbees
};

// Shipping rate configuration
const RATE_CONFIG = {
  baseRate: 50, // Base rate in INR
  weightMultiplier: 20, // Rate per kg
  distanceMultiplier: 0.5, // Rate per km
  serviceMultiplier: {
    standard: 1,
    express: 1.5,
    cod: 1.2
  }
};

// Calculate distance between two pincodes (simplified)
const calculateDistance = (pickupPincode, deliveryPincode) => {
  // In a real application, this would use a proper distance calculation
  // or a third-party service to get accurate distances
  const pincode1 = parseInt(pickupPincode);
  const pincode2 = parseInt(deliveryPincode);
  return Math.abs(pincode1 - pincode2) / 100; // Simplified distance in km
};

// Calculate volumetric weight
const calculateVolumetricWeight = (dimensions) => {
  const { length, width, height } = dimensions;
  return (length * width * height) / 5000; // Standard volumetric weight calculation
};

/**
 * Get shipping partner details from database and cache them
 * @param {string} courierCode - The courier code (e.g., 'BLUEDART', 'DELHIVERY')
 * @returns {Object} - The shipping partner details
 */
export const getPartnerDetails = async (courierCode) => {
  try {
    // Check for cached partner details
    const cacheKey = `partner:${courierCode}`;
    const cachedPartner = await getCache(cacheKey);
    if (cachedPartner) {
      return cachedPartner;
    }

    // Find partner by name, case-insensitive
    const partner = await ShippingPartner.findOne({
      name: { $regex: new RegExp(`^${courierCode}$`, 'i') },
      apiStatus: 'active' // Only use active partners
    }).lean();

    if (!partner) {
      logger.warn(`Shipping partner not found or not active: ${courierCode}`);
      return null;
    }

    // Extract relevant details for API integration
    const partnerDetails = {
      id: partner._id.toString(),
      name: partner.name,
      apiKey: partner.apiKey,
      apiEndpoint: partner.apiEndpoint,
      serviceTypes: partner.serviceTypes,
      weightLimits: partner.weightLimits,
      dimensionLimits: partner.dimensionLimits,
      rates: partner.rates,
      zones: partner.zones,
      trackingUrl: partner.trackingUrl
    };

    // Cache the partner details
    await setCache(cacheKey, partnerDetails, 1800); // 30 minutes cache

    return partnerDetails;
  } catch (error) {
    logger.error(`Error fetching partner details for ${courierCode}: ${error.message}`);
    return null;
  }
};

/**
 * Calculate shipping rates for a given package and delivery details
 * @param {Object} packageDetails - Package details (weight, dimensions, etc.)
 * @param {Object} deliveryDetails - Delivery location details (pickup/delivery pincodes)
 * @param {Array} partners - Optional list of specific partners to check (if not provided, checks all active partners)
 * @returns {Array} - List of available shipping options with rates
 */
export const calculateShippingRates = async (packageDetails, deliveryDetails, partners = null) => {
  try {
    let availablePartners = partners;

    // If no specific partners provided, get all active partners
    if (!availablePartners) {
      availablePartners = await ShippingPartner.find({ 
        apiStatus: 'active',
        'weightLimits.min': { $lte: packageDetails.weight },
        'weightLimits.max': { $gte: packageDetails.weight }
      }).select('name').lean();
      
      availablePartners = availablePartners.map(p => p.name);
    }
    
    // Calculate rates for each partner
    const ratePromises = availablePartners.map(async (partnerName) => {
      const partnerDetails = await getPartnerDetails(partnerName);
      
      if (!partnerDetails) {
        return null;
      }
      
      // Check if partner module exists
      const partnerModule = courierModules[partnerName.toUpperCase()];
      
      if (partnerModule && partnerModule.calculateRate) {
        // Use partner-specific rate calculation if available
        return partnerModule.calculateRate(packageDetails, deliveryDetails, partnerDetails);
      } else {
        // Use generic rate calculation
        return calculateRate(packageDetails, deliveryDetails, partnerDetails);
      }
    });
    
    const rates = await Promise.all(ratePromises);
    return rates.filter(rate => rate !== null);
  } catch (error) {
    logger.error(`Error calculating shipping rates: ${error.message}`);
    return [];
  }
};

/**
 * Book a shipment with the specified courier
 * @param {string} courierCode - The courier code
 * @param {Object} shipmentDetails - Shipment booking details
 * @returns {Object} - The booking response
 */
export const bookShipment = async (courierCode, shipmentDetails) => {
  try {
    const partnerDetails = await getPartnerDetails(courierCode);
    
    if (!partnerDetails) {
      throw new Error(`Partner details not found for ${courierCode}`);
    }
    
    // Check if partner module exists
    const partnerModule = courierModules[courierCode.toUpperCase()];
    
    if (!partnerModule || !partnerModule.bookShipment) {
      throw new Error(`Booking functionality not available for ${courierCode}`);
    }
    
    // Call the partner-specific booking function
    const bookingResponse = await partnerModule.bookShipment(shipmentDetails, partnerDetails);
    
    // If booking successful, update shipment count for the partner
    if (bookingResponse.success) {
      await ShippingPartner.findByIdAndUpdate(
        partnerDetails.id,
        { $inc: { shipmentCount: 1 } }
      );
    }
    
    return bookingResponse;
  } catch (error) {
    logger.error(`Error booking shipment with ${courierCode}: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Track a shipment using the tracking number and courier
 * @param {string} trackingNumber - The shipment tracking number or AWB
 * @param {string} courierCode - The courier code
 * @returns {Object} - The tracking information
 */
export const trackShipment = async (trackingNumber, courierCode) => {
  try {
    const partnerDetails = await getPartnerDetails(courierCode);
    
    if (!partnerDetails) {
      throw new Error(`Partner details not found for ${courierCode}`);
    }
    
    // Check if partner module exists
    const partnerModule = courierModules[courierCode.toUpperCase()];
    
    if (!partnerModule || !partnerModule.trackShipment) {
      throw new Error(`Tracking functionality not available for ${courierCode}`);
    }
    
    // Call the partner-specific tracking function
    return await partnerModule.trackShipment(trackingNumber, partnerDetails);
  } catch (error) {
    logger.error(`Error tracking shipment ${trackingNumber} with ${courierCode}: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
};

// Validate pincode
export const validatePincode = (pincode) => {
  const pincodeRegex = /^\d{6}$/;
  return pincodeRegex.test(pincode);
};

// Get service availability
export const getServiceAvailability = (pickupPincode, deliveryPincode) => {
  // In a real application, this would check against a database of serviceable pincodes
  const isServiceable = validatePincode(pickupPincode) && validatePincode(deliveryPincode);
  
  return {
    success: true,
    data: {
      isServiceable,
      availableServices: isServiceable ? ['standard', 'express', 'cod'] : [],
      message: isServiceable ? 'Service available' : 'Service not available for these pincodes'
    }
  };
}; 