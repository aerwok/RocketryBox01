import RateCard from '../../../models/ratecard.model.js';
import rateCardService from '../../../services/ratecard.service.js';
import { AppError } from '../../../middleware/errorHandler.js';
import { logger } from '../../../utils/logger.js';

// Get available rate cards for seller
export const getSellerRateCard = async (req, res, next) => {
  try {
    // Get all active rate cards (available to all sellers)
    const result = await rateCardService.getAllRateCards({ isActive: true });
    
    if (!result.success) {
      throw new AppError('Failed to fetch rate cards', 500);
    }

    // Group rate cards by courier for easier frontend consumption
    const rateCardsByCourier = {};
    result.rateCards.forEach(card => {
      if (!rateCardsByCourier[card.courier]) {
        rateCardsByCourier[card.courier] = [];
      }
      rateCardsByCourier[card.courier].push(card);
    });

    res.status(200).json({
      success: true,
      data: {
        rateCards: result.rateCards,
        rateCardsByCourier,
        totalCount: result.rateCards.length
      }
    });
  } catch (error) {
    logger.error(`Error in getSellerRateCard: ${error.message}`);
    next(error);
  }
};

// Calculate shipping rate for seller using unified rate card system
export const calculateShippingRate = async (req, res, next) => {
  try {
    const {
      fromPincode,
      toPincode,
      weight,
      length,
      width,
      height,
      mode = 'Surface',
      courier,
      isCOD = false,
      declaredValue = 0
    } = req.body;

    // Validate required parameters
    if (!fromPincode || !toPincode || !weight) {
      throw new AppError('fromPincode, toPincode, and weight are required', 400);
    }

    // Use the unified rate card service for calculation
    const result = await rateCardService.calculateShippingRate({
      fromPincode,
      toPincode,
      weight,
      dimensions: length && width && height ? { length, width, height } : null,
      mode,
      courier,
      orderType: isCOD ? 'cod' : 'prepaid',
      codCollectableAmount: declaredValue || 0,
      includeRTO: false
    });

    if (!result.success) {
      throw new AppError(result.error, 400);
    }

    // Transform response for seller API compatibility
    const response = {
      success: true,
      data: {
        calculations: result.calculations,
        bestOptions: result.bestOptions,
        requestId: result.requestId,
        zone: result.zone,
        billedWeight: result.billedWeight,
        deliveryEstimate: result.deliveryEstimate
      }
    };

    res.status(200).json(response);
  } catch (error) {
    logger.error(`Error in calculateShippingRate: ${error.message}`);
    next(error);
  }
};

// Get rate comparison across multiple couriers
export const getRateComparison = async (req, res, next) => {
  try {
    const {
      fromPincode,
      toPincode,
      weight,
      dimensions,
      isCOD = false,
      declaredValue = 0
    } = req.body;

    // Validate required parameters
    if (!fromPincode || !toPincode || !weight) {
      throw new AppError('fromPincode, toPincode, and weight are required', 400);
    }

    // Get active couriers
    const couriersResult = await rateCardService.getActiveCouriers();
    if (!couriersResult.success) {
      throw new AppError('Failed to fetch active couriers', 500);
    }

    const comparisons = [];
    const errors = [];

    // Calculate rates for each courier
    for (const courier of couriersResult.couriers) {
      try {
        const result = await rateCardService.calculateShippingRate({
          fromPincode,
          toPincode,
          weight,
          dimensions,
          courier,
          isCOD,
          declaredValue
        });

        if (result.success && result.calculations.length > 0) {
          // Get the best option for this courier
          const bestOption = result.calculations.reduce((best, current) => 
            current.totalAmount < best.totalAmount ? current : best
          );

          comparisons.push({
            courier,
            ...bestOption,
            zone: result.zone,
            deliveryEstimate: result.deliveryEstimate
          });
        }
      } catch (courierError) {
        errors.push(`${courier}: ${courierError.message}`);
      }
    }

    // Sort by total amount (cheapest first)
    comparisons.sort((a, b) => a.totalAmount - b.totalAmount);

    res.status(200).json({
      success: true,
      data: {
        comparisons,
        cheapest: comparisons[0] || null,
        errors: errors.length > 0 ? errors : undefined,
        requestDetails: {
          fromPincode,
          toPincode,
          weight,
          dimensions,
          isCOD,
          declaredValue
        }
      }
    });
  } catch (error) {
    logger.error(`Error in getRateComparison: ${error.message}`);
    next(error);
  }
};

// Get zone mapping for pincodes (updated to use unified system)
export const getZoneMapping = async (req, res, next) => {
  try {
    const { pincodes, fromPincode } = req.query;
    
    if (!pincodes || !fromPincode) {
      throw new AppError('Please provide fromPincode and pincodes', 400);
    }

    const pincodeList = pincodes.split(',').map(p => p.trim());
    const zones = [];

    for (const pincode of pincodeList) {
      try {
        const zone = await rateCardService.determineZone(fromPincode, pincode);
        zones.push({ 
          pincode, 
          zone,
          fromPincode 
        });
      } catch (error) {
        zones.push({ 
          pincode, 
          zone: 'Unknown',
          fromPincode,
          error: error.message 
        });
      }
    }

    res.status(200).json({
      success: true,
      data: {
        zones,
        fromPincode
      }
    });
  } catch (error) {
    logger.error(`Error in getZoneMapping: ${error.message}`);
    next(error);
  }
};

// Get rate card statistics for seller dashboard
export const getRateCardStatistics = async (req, res, next) => {
  try {
    const result = await rateCardService.getStatistics();
    
    if (!result.success) {
      throw new AppError('Failed to fetch statistics', 500);
    }

    res.status(200).json({
      success: true,
      data: result.statistics
    });
  } catch (error) {
    logger.error(`Error in getRateCardStatistics: ${error.message}`);
    next(error);
  }
}; 