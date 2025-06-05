import { AppError } from '../../../middleware/errorHandler.js';
import SellerRateCard from '../../../models/sellerRateCard.model.js';
import rateCardService from '../../../services/ratecard.service.js';
import { logger } from '../../../utils/logger.js';

// Get the rate card for the authenticated seller (now uses seller-specific system)
export const getSellerRateCard = async (req, res, next) => {
  try {
    const sellerId = req.user.id;

    // Get seller's effective rate cards (base + overrides)
    const effectiveRates = await SellerRateCard.getSellerEffectiveRates(sellerId);

    if (!effectiveRates || effectiveRates.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          lastUpdated: new Date().toISOString(),
          rates: [],
          message: 'No rate cards available. Please contact admin to set up your rates.'
        }
      });
    }

    // Transform rate cards to frontend-expected format
    // Group rate cards by courier and mode for better organization
    const rateCardsByService = {};

    effectiveRates.forEach(card => {
      const serviceKey = `${card.courier} ${card.mode.toLowerCase()}-${card.minimumBillableWeight || 0.5}`;

      if (!rateCardsByService[serviceKey]) {
        rateCardsByService[serviceKey] = {
          name: serviceKey,
          cod: card.codAmount.toString(),
          codPercent: card.codPercent.toString(),
          withinCity: { base: '0', additional: '0', rto: '0' },
          withinState: { base: '0', additional: '0', rto: '0' },
          metroToMetro: { base: '0', additional: '0', rto: '0' },
          restOfIndia: { base: '0', additional: '0', rto: '0' },
          northEastJK: { base: '0', additional: '0', rto: '0' },
          isCustom: card.isOverride || false,
          lastUpdated: card.lastUpdated
        };
      }

      const service = rateCardsByService[serviceKey];

      // Map zones to the frontend expected format
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
        case 'North East & Special Areas':
          // Map special zones to North East & J&K for frontend compatibility
          service.northEastJK = {
            base: card.baseRate.toString(),
            additional: card.addlRate.toString(),
            rto: card.rtoCharges.toString()
          };
          break;
      }

      // Update isCustom flag if any rate is overridden
      if (card.isOverride) {
        service.isCustom = true;
      }
    });

    // Get the most recent update time from rate cards
    const lastUpdated = effectiveRates.length > 0
      ? Math.max(...effectiveRates.map(rate => new Date(rate.lastUpdated).getTime()))
      : new Date().getTime();

    // Count custom rates for additional info
    const customRatesCount = effectiveRates.filter(rate => rate.isOverride).length;

    res.status(200).json({
      success: true,
      data: {
        lastUpdated: new Date(lastUpdated).toISOString(),
        rates: Object.values(rateCardsByService),
        statistics: {
          totalRates: effectiveRates.length,
          customRates: customRatesCount,
          hasCustomRates: customRatesCount > 0,
          customizationPercentage: Math.round((customRatesCount / effectiveRates.length) * 100)
        }
      }
    });
  } catch (error) {
    logger.error(`Error in getSellerRateCard: ${error.message}`);
    next(error);
  }
};

// Calculate rate card using seller's effective rates
export const calculateRateCard = async (req, res, next) => {
  try {
    const sellerId = req.user.id;
    const {
      pickupPincode,
      deliveryPincode,
      weight,
      paymentType,
      purchaseAmount,
      packageLength,
      packageWidth,
      packageHeight
    } = req.body;

    // Validate required fields
    if (!pickupPincode || !deliveryPincode || !weight || !paymentType) {
      return next(new AppError('Pickup pincode, delivery pincode, weight, and payment type are required', 400));
    }

    // Get seller's effective rate cards
    const effectiveRates = await SellerRateCard.getSellerEffectiveRates(sellerId);

    if (!effectiveRates || effectiveRates.length === 0) {
      return next(new AppError('No rate cards available for your account. Please contact admin.', 400));
    }

    // Use the rate calculation service with seller's effective rates
    const calculationResult = await rateCardService.calculateShippingRate({
      pickupPincode,
      deliveryPincode,
      weight: parseFloat(weight),
      paymentType,
      purchaseAmount: purchaseAmount ? parseFloat(purchaseAmount) : 0,
      dimensions: {
        length: packageLength ? parseFloat(packageLength) : 0,
        width: packageWidth ? parseFloat(packageWidth) : 0,
        height: packageHeight ? parseFloat(packageHeight) : 0
      },
      rateCards: effectiveRates // Use seller's effective rates
    });

    if (!calculationResult.success) {
      return next(new AppError(calculationResult.error, 400));
    }

    // Add seller-specific information
    const response = {
      ...calculationResult,
      sellerInfo: {
        sellerId,
        hasCustomRates: effectiveRates.some(rate => rate.isOverride),
        customRatesUsed: calculationResult.rates ?
          calculationResult.rates.filter(rate =>
            effectiveRates.find(er =>
              er.courier === rate.courier &&
              er.mode === rate.mode &&
              er.isOverride
            )
          ).length : 0
      }
    };

    res.status(200).json({
      success: true,
      data: response
    });

  } catch (error) {
    logger.error(`Error in calculateRateCard for seller ${sellerId}: ${error.message}`);
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
