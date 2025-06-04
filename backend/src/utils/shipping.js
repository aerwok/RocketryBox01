import ShippingPartner from '../modules/admin/models/shippingPartner.model.js';
import * as bluedart from './bluedart.js';
import { calculateRate } from './courierRates.js';
import * as delhivery from './delhivery.js';
import * as dtdc from './dtdc.js';
import * as ecomexpress from './ecomexpress.js';
import * as ekart from './ekart.js';
import { logger } from './logger.js';
import { getCache, setCache } from './redis.js';
import * as xpressbees from './xpressbees.js';

// RATE CALCULATION CONFIGURATION
const RATE_CALCULATION_CONFIG = {
  // Set to 'API' to use live API calls, 'DATABASE' to use rate cards, 'B2B_API' for B2B, 'B2C_API' for B2C
  DEFAULT_METHOD: process.env.DEFAULT_RATE_METHOD || 'DATABASE',

  // Partner-specific overrides
  PARTNER_OVERRIDES: {
    'Delhivery': process.env.DELHIVERY_RATE_METHOD || 'DATABASE',     // Force Delhivery to use specific method
    'BlueDart': process.env.BLUEDART_RATE_METHOD || 'DATABASE',      // Can be changed to 'API' if you want live rates
    'Ecom Express': process.env.ECOMEXPRESS_RATE_METHOD || 'DATABASE',  // Can be changed to 'API' if you want live rates
    'DTDC': process.env.DTDC_RATE_METHOD || 'DATABASE',
    'Ekart': process.env.EKART_RATE_METHOD || 'DATABASE',
    'Xpressbees': process.env.XPRESSBEES_RATE_METHOD || 'DATABASE'
  },

  // API Type preferences when using API method
  API_TYPE_PREFERENCE: {
    'Delhivery': process.env.DELHIVERY_API_TYPE || 'B2C', // 'B2C' or 'B2B'
    'BlueDart': 'B2C',
    'Ecom Express': 'B2C',
    'DTDC': 'B2C',
    'Ekart': 'B2C',
    'Xpressbees': 'B2C'
  }
};

// Map of courier code to their respective utility modules
const courierModules = {
  BLUEDART: bluedart,
  BlueDart: bluedart,
  ECOMEXPRESS: ecomexpress,
  EcomExpress: ecomexpress,
  'Ecom Express': ecomexpress,
  DELHIVERY: delhivery,
  Delhivery: delhivery,
  DTDC: dtdc,
  Dtdc: dtdc,
  EKART: ekart,
  Ekart: ekart,
  'Ekart Logistics': ekart,
  XPRESSBEES: xpressbees,
  XpressBees: xpressbees
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
 * Determine which rate calculation method to use for a partner
 * @param {string} partnerName - The partner name
 * @returns {string} - 'API' or 'DATABASE'
 */
const getRateCalculationMethod = (partnerName) => {
  // Check for partner-specific override first
  if (RATE_CALCULATION_CONFIG.PARTNER_OVERRIDES[partnerName]) {
    return RATE_CALCULATION_CONFIG.PARTNER_OVERRIDES[partnerName];
  }

  // Fall back to default method
  return RATE_CALCULATION_CONFIG.DEFAULT_METHOD;
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
    // Handle case where all data is passed in a single object (from createOrder)
    if (!deliveryDetails && packageDetails.pickupPincode && packageDetails.deliveryPincode) {
      const { weight, dimensions, pickupPincode, deliveryPincode, serviceType, ...rest } = packageDetails;
      packageDetails = { weight, dimensions, serviceType, ...rest };
      deliveryDetails = { pickupPincode, deliveryPincode };
    }

    let availablePartners = partners;

    // If no specific partners provided, get all active partners
    if (!availablePartners) {
      const partnerDocs = await ShippingPartner.find({
        apiStatus: 'active',
        'weightLimits.min': { $lte: packageDetails.weight },
        'weightLimits.max': { $gte: packageDetails.weight }
      }).select('name').lean();

      availablePartners = partnerDocs.map(p => p.name);

      // FALLBACK: If no partners found in database, use hardcoded list
      if (!availablePartners || availablePartners.length === 0) {
        logger.warn('No active shipping partners found in database, using fallback partners');
        availablePartners = ['BlueDart', 'Ecom Express', 'Delhivery', 'DTDC', 'Ekart', 'Xpressbees'];
      }
    }

    logger.info('Calculating rates for partners:', {
      partners: availablePartners,
      packageWeight: packageDetails.weight,
      serviceType: packageDetails.serviceType,
      pickupPincode: deliveryDetails.pickupPincode,
      deliveryPincode: deliveryDetails.deliveryPincode
    });

    // Calculate rates for each partner
    const ratePromises = availablePartners.map(async (partnerName) => {
      try {
        let partnerDetails = await getPartnerDetails(partnerName);

        // If no partner details in database, create fallback details
        if (!partnerDetails) {
          logger.info(`Creating fallback partner details for: ${partnerName}`);
          partnerDetails = createFallbackPartnerDetails(partnerName);
        }

        // Determine rate calculation method for this partner
        const rateMethod = getRateCalculationMethod(partnerName);
        const apiType = RATE_CALCULATION_CONFIG.API_TYPE_PREFERENCE[partnerName] || 'B2C';
        logger.info(`Rate calculation method for ${partnerName}: ${rateMethod} (${apiType})`);

        if (rateMethod === 'API' || rateMethod === 'B2C_API' || rateMethod === 'B2B_API') {
          // Check if partner module exists for API integration
          let partnerModule = courierModules[partnerName] || courierModules[partnerName.toUpperCase()];

          if (partnerModule && partnerModule.calculateRate) {
            logger.info(`Using ${rateMethod} integration for ${partnerName}`);

            // For Delhivery, check if we should use B2B API
            if (partnerName === 'Delhivery' && (rateMethod === 'B2B_API' || apiType === 'B2B')) {
              // Use B2B freight estimator instead of B2C rate calculation
              try {
                const delhiveryAPI = new (await import('./delhivery.js')).DelhiveryAPI();
                const freightResult = await delhiveryAPI.b2bFreightEstimator({
                  dimensions: [{
                    length_cm: packageDetails.dimensions?.length || 20,
                    width_cm: packageDetails.dimensions?.width || 15,
                    height_cm: packageDetails.dimensions?.height || 10,
                    box_count: 1
                  }],
                  weightG: Math.round(packageDetails.weight * 1000), // Convert to grams
                  sourcePin: deliveryDetails.pickupPincode,
                  consigneePin: deliveryDetails.deliveryPincode,
                  paymentMode: packageDetails.paymentMode?.toLowerCase() === 'cod' ? 'cod' : 'prepaid',
                  codAmount: packageDetails.codAmount || 0,
                  invAmount: packageDetails.invoiceValue || packageDetails.codAmount || 1000,
                  freightMode: 'fop',
                  rovInsurance: false
                });

                if (freightResult.success) {
                  return {
                    success: true,
                    provider: {
                      id: partnerDetails.id || 'delhivery-b2b',
                      name: 'Delhivery',
                      serviceType: 'B2B Freight',
                      apiType: 'B2B',
                      estimatedDays: '2-4 days'
                    },
                    totalRate: Math.round(freightResult.estimatedCost),
                    breakdown: freightResult.breakdown,
                    source: 'B2B_API'
                  };
                } else {
                  logger.warn(`Delhivery B2B API failed, falling back to B2C or database: ${freightResult.error}`);
                  // Fall through to regular B2C API or database
                }
              } catch (error) {
                logger.error(`Delhivery B2B API error: ${error.message}`);
                // Fall through to regular B2C API or database
              }
            }

            // Use standard API integration (B2C)
            const apiResult = await partnerModule.calculateRate(packageDetails, deliveryDetails, partnerDetails);
            if (apiResult && apiResult.success) {
              apiResult.source = 'B2C_API';
              return apiResult;
            } else {
              logger.warn(`${partnerName} API failed, falling back to database rates`);
              return await calculateRate(packageDetails, deliveryDetails, partnerDetails);
            }
          } else {
            logger.warn(`API integration not available for ${partnerName}, falling back to database rates`);
            return await calculateRate(packageDetails, deliveryDetails, partnerDetails);
          }
        } else {
          // Use database rate cards
          logger.info(`Using database rate cards for ${partnerName}`);
          const dbResult = await calculateRate(packageDetails, deliveryDetails, partnerDetails);
          if (dbResult) {
            dbResult.source = 'DATABASE';
          }
          return dbResult;
        }
      } catch (error) {
        logger.error(`Error calculating rate for ${partnerName}: ${error.message}`);
        // Return null for failed calculations
        return null;
      }
    });

    const rates = await Promise.all(ratePromises);
    const validRates = rates.filter(rate => rate !== null);

    logger.info(`Rate calculation completed: ${validRates.length} valid rates out of ${availablePartners.length} partners`);

    return validRates;
  } catch (error) {
    logger.error(`Error calculating shipping rates: ${error.message}`);
    return [];
  }
};

/**
 * Create fallback partner details when no database entry exists
 * @param {string} partnerName - Name of the shipping partner
 * @returns {Object} - Fallback partner details
 */
const createFallbackPartnerDetails = (partnerName) => {
  const fallbackDetails = {
    BlueDart: {
      id: 'bluedart-fallback',
      name: 'BlueDart',
      apiKey: null,
      apiEndpoint: 'https://apigateway.bluedart.com',
      serviceTypes: ['standard', 'express'],
      weightLimits: { min: 0.1, max: 100 },
      dimensionLimits: { maxLength: 120, maxWidth: 80, maxHeight: 80, maxSum: 280 },
      rates: { baseRate: 50, weightRate: 20, dimensionalFactor: 5000 },
      zones: [],
      trackingUrl: 'https://www.bluedart.com/tracking'
    },
    'Ecom Express': {
      id: 'ecomexpress-fallback',
      name: 'Ecom Express',
      apiKey: null,
      apiEndpoint: 'https://api.ecomexpress.in',
      serviceTypes: ['standard', 'express', 'economy'],
      weightLimits: { min: 0.1, max: 50 },
      dimensionLimits: { maxLength: 120, maxWidth: 80, maxHeight: 80, maxSum: 280 },
      rates: { baseRate: 40, weightRate: 15, dimensionalFactor: 5000 },
      zones: [],
      trackingUrl: 'https://www.ecomexpress.in/tracking'
    },
    Delhivery: {
      id: 'delhivery-fallback',
      name: 'Delhivery',
      apiKey: null,
      apiEndpoint: 'https://api.delhivery.com',
      serviceTypes: ['standard', 'express'],
      weightLimits: { min: 0.1, max: 50 },
      dimensionLimits: { maxLength: 120, maxWidth: 80, maxHeight: 80, maxSum: 280 },
      rates: { baseRate: 50, weightRate: 20, dimensionalFactor: 5000 },
      zones: [],
      trackingUrl: 'https://www.delhivery.com/tracking'
    },
    DTDC: {
      id: 'dtdc-fallback',
      name: 'DTDC',
      apiKey: null,
      apiEndpoint: 'https://api.dtdc.com',
      serviceTypes: ['standard', 'express'],
      weightLimits: { min: 0.1, max: 50 },
      dimensionLimits: { maxLength: 120, maxWidth: 80, maxHeight: 80, maxSum: 280 },
      rates: { baseRate: 45, weightRate: 18, dimensionalFactor: 5000 },
      zones: [],
      trackingUrl: 'https://www.dtdc.com/tracking'
    },
    Ekart: {
      id: 'ekart-fallback',
      name: 'Ekart',
      apiKey: null,
      apiEndpoint: 'https://api.ekart.com',
      serviceTypes: ['standard', 'express'],
      weightLimits: { min: 0.1, max: 50 },
      dimensionLimits: { maxLength: 120, maxWidth: 80, maxHeight: 80, maxSum: 280 },
      rates: { baseRate: 55, weightRate: 22, dimensionalFactor: 5000 },
      zones: [],
      trackingUrl: 'https://ekart.com/tracking'
    },
    Xpressbees: {
      id: 'xpressbees-fallback',
      name: 'Xpressbees',
      apiKey: null,
      apiEndpoint: 'https://api.xpressbees.com',
      serviceTypes: ['standard', 'express'],
      weightLimits: { min: 0.1, max: 50 },
      dimensionLimits: { maxLength: 120, maxWidth: 80, maxHeight: 80, maxSum: 280 },
      rates: { baseRate: 60, weightRate: 19, dimensionalFactor: 5000 },
      zones: [],
      trackingUrl: 'https://www.xpressbees.com/tracking'
    }
  };

  return fallbackDetails[partnerName] || {
    id: `${partnerName.toLowerCase()}-fallback`,
    name: partnerName,
    apiKey: null,
    apiEndpoint: null,
    serviceTypes: ['standard'],
    weightLimits: { min: 0.1, max: 50 },
    dimensionLimits: { maxLength: 120, maxWidth: 80, maxHeight: 80, maxSum: 280 },
    rates: { baseRate: 50, weightRate: 20, dimensionalFactor: 5000 },
    zones: [],
    trackingUrl: null
  };
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
