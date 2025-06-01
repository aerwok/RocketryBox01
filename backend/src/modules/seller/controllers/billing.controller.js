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

    // Transform rate cards to frontend-expected format
    // Group rate cards by courier and mode for better organization
    const rateCardsByService = {};
    
    result.rateCards.forEach(card => {
      const serviceKey = `${card.courier} ${card.mode.toLowerCase()}-${card.minimumBillableWeight || 0.5}`;
      
      if (!rateCardsByService[serviceKey]) {
        rateCardsByService[serviceKey] = {
          mode: serviceKey,
          withinCity: { base: '0', additional: '0', rto: '0' },
          withinState: { base: '0', additional: '0', rto: '0' },
          metroToMetro: { base: '0', additional: '0', rto: '0' },
          restOfIndia: { base: '0', additional: '0', rto: '0' },
          northEastJK: { base: '0', additional: '0', rto: '0' },
          cod: card.codAmount.toString(),
          codPercent: card.codPercent.toString()
        };
      }
      
      const service = rateCardsByService[serviceKey];
      
      // Map zones to frontend format
      switch (card.zone) {
        case 'Within City':
          service.withinCity = {
            base: card.baseRate.toString(),
            additional: card.addlRate.toString(),
            rto: card.rtoCharges.toString()
          };
          break;
        case 'Within State':
          service.withinState = {
            base: card.baseRate.toString(),
            additional: card.addlRate.toString(),
            rto: card.rtoCharges.toString()
          };
          break;
        case 'Metro to Metro':
          service.metroToMetro = {
            base: card.baseRate.toString(),
            additional: card.addlRate.toString(),
            rto: card.rtoCharges.toString()
          };
          break;
        case 'Rest of India':
          service.restOfIndia = {
            base: card.baseRate.toString(),
            additional: card.addlRate.toString(),
            rto: card.rtoCharges.toString()
          };
          break;
        case 'Within Region':
        case 'Special Zone':
          // Map special zones to North East & J&K for frontend compatibility
          service.northEastJK = {
            base: card.baseRate.toString(),
            additional: card.addlRate.toString(),
            rto: card.rtoCharges.toString()
          };
          break;
      }
    });

    // Get the most recent update time from rate cards
    const lastUpdated = result.rateCards.length > 0 
      ? result.rateCards[0].updatedAt || result.rateCards[0].createdAt
      : new Date();

    res.status(200).json({
      success: true,
      data: {
        lastUpdated: lastUpdated.toISOString(),
        rates: Object.values(rateCardsByService)
      }
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
      paymentType,
      purchaseAmount = 0,
      packageLength,
      packageWidth,
      packageHeight,
      includeRTO = false
    } = req.body;

    if (!weight || !pickupPincode || !deliveryPincode || !paymentType) {
      return res.status(400).json({ 
        success: false, 
        message: 'weight, pickupPincode, deliveryPincode, and paymentType are required' 
      });
    }

    const isCOD = paymentType.toLowerCase() === 'cod';
    const actualWeight = parseFloat(weight);
    
    // Calculate volumetric weight if dimensions provided
    let volumetricWeight = 0;
    if (packageLength && packageWidth && packageHeight) {
      volumetricWeight = (parseFloat(packageLength) * parseFloat(packageWidth) * parseFloat(packageHeight)) / 5000;
    }
    
    // Billed weight is the higher of actual or volumetric weight
    const billedWeight = Math.max(actualWeight, volumetricWeight);

    // Get pincode information and determine zone
    const zone = await determineZoneFromPincodes(pickupPincode, deliveryPincode);
    
    // Get all active rate cards for the determined zone
    const result = await rateCardService.getAllRateCards({ 
      isActive: true,
      zone: zone 
    });

    if (!result.success || result.rateCards.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: `No rate cards found for zone: ${zone}`
      });
    }

    // Calculate rates for each applicable courier using the provided logic
    const rates = result.rateCards.map(rateCard => {
      // Determine final weight (minimum billable weight or billed weight, whichever is higher)
      const finalWeight = Math.max(billedWeight, rateCard.minimumBillableWeight || 0.5);
      
      // Calculate weight multiplier (0.5 kg increments)
      const weightMultiplier = Math.ceil(finalWeight / 0.5);
      
      // Calculate shipping cost: base rate + additional rate for extra weight
      const shippingCost = rateCard.baseRate + (rateCard.addlRate * (weightMultiplier - 1));
      
      // Calculate RTO charges if requested
      let rtoCharges = 0;
      if (includeRTO && rateCard.rtoCharges) {
        rtoCharges = rateCard.rtoCharges * weightMultiplier;
      }
      
      // Calculate COD charges based on the provided logic
      let codCharges = 0;
      if (isCOD) {
        const codCollectableAmount = parseFloat(purchaseAmount) || 0;
        
        // Option 1: Fixed COD Amount from rate card
        let fixedCODAmount = 0;
        if (rateCard.codAmount && !isNaN(rateCard.codAmount) && rateCard.codAmount > 0) {
          fixedCODAmount = rateCard.codAmount;
        }
        
        // Option 2: COD Percentage of COD Collectable Amount
        let percentBasedCOD = 0;
        if (rateCard.codPercent && !isNaN(rateCard.codPercent) && codCollectableAmount > 0) {
          percentBasedCOD = (rateCard.codPercent / 100) * codCollectableAmount;
        }
        
        // Use whichever is higher between fixed COD amount and percentage-based COD
        codCharges = Math.max(fixedCODAmount, percentBasedCOD);
      }
      
      // Calculate GST (18% on shipping + RTO + COD charges)
      const gst = 0.18 * (shippingCost + rtoCharges + codCharges);
      
      // Calculate total
      const total = shippingCost + rtoCharges + codCharges + gst;
      
      return {
        name: `${rateCard.courier} ${rateCard.mode}`,
        courier: rateCard.courier,
        productName: rateCard.productName,
        mode: rateCard.mode,
        zone: zone,
        volumetricWeight: volumetricWeight.toFixed(2),
        finalWeight: finalWeight.toFixed(2),
        weightMultiplier: weightMultiplier,
        baseCharge: Math.round(shippingCost * 100) / 100,
        codCharge: Math.round(codCharges * 100) / 100,
        rtoCharges: Math.round(rtoCharges * 100) / 100,
        gst: Math.round(gst * 100) / 100,
        total: Math.round(total * 100) / 100,
        rateCardId: rateCard._id
      };
    });

    res.status(200).json({ 
      success: true, 
      data: {
        zone: zone,
        billedWeight: billedWeight.toFixed(2),
        volumetricWeight: volumetricWeight.toFixed(2),
        rates: rates
      }
    });
  } catch (error) {
    logger.error(`Error in calculateRateCard: ${error.message}`);
    next(error);
  }
};

// Helper function to determine zone based on pincodes using the provided logic
async function determineZoneFromPincodes(pickupPincode, deliveryPincode) {
  try {
    // Use the ratecard service to get pincode information
    const pickupInfo = rateCardService.getPincodeInfo(pickupPincode);
    const deliveryInfo = rateCardService.getPincodeInfo(deliveryPincode);
    
    if (!pickupInfo || !deliveryInfo) {
      return 'Rest of India'; // Default fallback
    }
    
    // Special Zone Logic - North East, J&K, Himachal Pradesh, Andaman & Nicobar
    const specialZoneStates = [
      'Assam', 'Nagaland', 'Sikkim', 'Arunachal Pradesh', 'Manipur', 
      'Meghalaya', 'Mizoram', 'Tripura', 'Jammu And Kashmir', 
      'Himachal Pradesh', 'Andaman And Nicobar'
    ];
    
    if (specialZoneStates.includes(deliveryInfo.state)) {
      return 'Special Zone';
    }
    
    // Within City - same city
    if (pickupInfo.city === deliveryInfo.city) {
      return 'Within City';
    }
    
    // Within State - same state but different cities
    if (pickupInfo.state === deliveryInfo.state) {
      return 'Within State';
    }
    
    // Within Region - same region but different states
    const pickupRegion = getRegionFromState(pickupInfo.state);
    const deliveryRegion = getRegionFromState(deliveryInfo.state);
    
    if (pickupRegion === deliveryRegion) {
      return 'Within Region';
    }
    
    // Metro to Metro - between major metro cities
    const metroCities = ['New Delhi', 'Mumbai', 'Kolkata', 'Chennai', 'Bangalore'];
    if (metroCities.includes(pickupInfo.city) && metroCities.includes(deliveryInfo.city)) {
      return 'Metro to Metro';
    }
    
    // Default to Rest of India
    return 'Rest of India';
    
  } catch (error) {
    logger.error(`Error determining zone: ${error.message}`);
    return 'Rest of India'; // Default fallback
  }
}

// Helper function to get region from state
function getRegionFromState(state) {
  const regionMapping = {
    // North Region
    'Delhi': 'North',
    'Punjab': 'North',
    'Haryana': 'North',
    'Himachal Pradesh': 'North',
    'Uttarakhand': 'North',
    'Uttar Pradesh': 'North',
    'Rajasthan': 'North',
    'Jammu And Kashmir': 'North',
    
    // South Region
    'Karnataka': 'South',
    'Tamil Nadu': 'South',
    'Kerala': 'South',
    'Andhra Pradesh': 'South',
    'Telangana': 'South',
    'Puducherry': 'South',
    
    // West Region
    'Maharashtra': 'West',
    'Gujarat': 'West',
    'Goa': 'West',
    'Daman And Diu': 'West',
    'Dadra And Nagar Haveli': 'West',
    
    // East Region
    'West Bengal': 'East',
    'Odisha': 'East',
    'Jharkhand': 'East',
    'Bihar': 'East',
    
    // Central Region
    'Madhya Pradesh': 'Central',
    'Chhattisgarh': 'Central',
    
    // Northeast Region
    'Assam': 'Northeast',
    'Arunachal Pradesh': 'Northeast',
    'Manipur': 'Northeast',
    'Meghalaya': 'Northeast',
    'Mizoram': 'Northeast',
    'Nagaland': 'Northeast',
    'Sikkim': 'Northeast',
    'Tripura': 'Northeast'
  };
  
  return regionMapping[state] || 'Other';
} 