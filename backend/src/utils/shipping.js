import { AppError } from '../middleware/errorHandler.js';

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

// Calculate shipping rates
export const calculateShippingRates = async ({
  weight,
  dimensions,
  pickupPincode,
  deliveryPincode,
  serviceType
}) => {
  try {
    // Validate inputs
    if (!weight || !dimensions || !pickupPincode || !deliveryPincode || !serviceType) {
      throw new AppError('Missing required parameters', 400);
    }

    // Calculate volumetric weight
    const volumetricWeight = calculateVolumetricWeight(dimensions);
    const chargeableWeight = Math.max(weight, volumetricWeight);

    // Calculate distance
    const distance = calculateDistance(pickupPincode, deliveryPincode);

    // Calculate base rate
    let totalRate = RATE_CONFIG.baseRate;

    // Add weight-based rate
    totalRate += chargeableWeight * RATE_CONFIG.weightMultiplier;

    // Add distance-based rate
    totalRate += distance * RATE_CONFIG.distanceMultiplier;

    // Apply service type multiplier
    totalRate *= RATE_CONFIG.serviceMultiplier[serviceType];

    // Calculate estimated delivery time
    const estimatedDelivery = new Date();
    const deliveryDays = Math.ceil(distance / 500); // Assuming 500km per day
    estimatedDelivery.setDate(estimatedDelivery.getDate() + deliveryDays);

    return {
      success: true,
      data: {
        totalRate: Math.round(totalRate),
        breakdown: {
          baseRate: RATE_CONFIG.baseRate,
          weightRate: chargeableWeight * RATE_CONFIG.weightMultiplier,
          distanceRate: distance * RATE_CONFIG.distanceMultiplier,
          serviceMultiplier: RATE_CONFIG.serviceMultiplier[serviceType]
        },
        chargeableWeight,
        distance,
        estimatedDelivery
      }
    };
  } catch (error) {
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