import Seller from '../models/seller.model.js';
import RateCard from '../../../models/ratecard.model.js';
import rateCardService from '../../../services/ratecard.service.js';
import { logger } from '../../../utils/logger.js';
import { AppError } from '../../../middleware/errorHandler.js';

// Get the rate card for the authenticated seller (now uses unified system)
export const getSellerRateCard = async (req, res, next) => {
  try {
    // Get all active rate cards available to sellers
    const result = await rateCardService.getAllRateCards({ isActive: true });
    
    if (!result.success) {
      throw new AppError('Failed to fetch rate cards', 500);
    }

    // Transform to match legacy response format for backward compatibility
    const rateCardData = {};
    result.rateCards.forEach(card => {
      if (!rateCardData[card.courier]) {
        rateCardData[card.courier] = {
          zones: {},
          slabs: [0.5, 1, 2, 5, 10, 20] // Standard weight slabs
        };
      }
      
      if (!rateCardData[card.courier].zones[card.zone]) {
        rateCardData[card.courier].zones[card.zone] = {
          base: [],
          addl: [],
          cod: card.codAmount,
          codPct: card.codPercent
        };
      }
      
      // Convert unified rate structure to legacy format
      rateCardData[card.courier].zones[card.zone].base.push(card.baseRate);
      rateCardData[card.courier].zones[card.zone].addl.push(card.addlRate);
    });

    res.status(200).json({
      success: true,
      data: rateCardData
    });
  } catch (error) {
    logger.error(`Error in getSellerRateCard: ${error.message}`);
    next(error);
  }
};

// Calculate rates using the unified rate card system
export const calculateRateCard = async (req, res, next) => {
  try {
    const { 
      weight, 
      pickupPincode, 
      deliveryPincode, 
      isCOD = false,
      dimensions,
      declaredValue = 0 
    } = req.body;

    if (!weight || !pickupPincode || !deliveryPincode) {
      return res.status(400).json({ 
        success: false, 
        message: 'weight, pickupPincode, and deliveryPincode are required' 
      });
    }

    // Use unified rate card service for calculation
    const result = await rateCardService.calculateShippingRate({
      fromPincode: pickupPincode,
      toPincode: deliveryPincode,
      weight,
      dimensions,
      orderType: isCOD ? 'cod' : 'prepaid',
      codCollectableAmount: declaredValue || 0,
      includeRTO: false
    });

    if (!result.success) {
      return res.status(400).json({ 
        success: false, 
        message: result.error 
      });
    }

    // Transform response to match legacy format
    const legacyResults = result.calculations.map(calc => ({
      courier: calc.courier,
      zone: result.zone,
      weight: result.billedWeight,
      base: calc.baseRate,
      addl: calc.addlRate,
      addlCharge: calc.addlRate * (calc.weightMultiplier - 1),
      cod: isCOD ? calc.codCharges : 0,
      codPct: isCOD ? calc.codPercent : 0,
      codCharge: isCOD ? calc.codCharges : 0,
      total: Math.round(calc.total)
    }));

    res.status(200).json({ 
      success: true, 
      data: legacyResults 
    });
  } catch (error) {
    logger.error(`Error in calculateRateCard: ${error.message}`);
    next(error);
  }
}; 