import RateCard from '../models/ratecard.model.js';
import { AppError } from '../../../middleware/errorHandler.js';

// Get seller's current rate card
export const getSellerRateCard = async (req, res, next) => {
  try {
    const rateCard = await RateCard.findOne({ seller: req.user.id })
      .populate('defaultCard', 'name description')
      .lean();

    if (!rateCard) {
      throw new AppError('Rate card not found', 404);
    }

    res.status(200).json({
      success: true,
      data: rateCard
    });
  } catch (error) {
    next(error);
  }
};

// Calculate shipping rate based on rate card
export const calculateShippingRate = async (req, res, next) => {
  try {
    const { fromPincode, toPincode, weight, length, width, height, mode, cod } = req.body;
    
    // Get seller's rate card
    const rateCard = await RateCard.findOne({ seller: req.user.id });
    if (!rateCard) {
      throw new AppError('Rate card not found', 404);
    }

    // Calculate volumetric weight if dimensions provided
    let volumetricWeight = 0;
    if (length && width && height) {
      volumetricWeight = (length * width * height) / 5000; // Standard volumetric divisor
    }

    // Use higher of actual vs volumetric weight
    const chargeableWeight = Math.max(weight, volumetricWeight);

    // Get zone based on pincodes
    const zone = await getZoneFromPincodes(fromPincode, toPincode);

    // Get base rate from rate card
    const baseRate = rateCard.rates[mode.toLowerCase()][zone];
    if (!baseRate) {
      throw new AppError('Rate not found for given parameters', 400);
    }

    // Calculate additional weight charges
    const additionalWeight = Math.max(0, chargeableWeight - baseRate.uptoWeight);
    const additionalCharges = Math.ceil(additionalWeight / baseRate.perKg) * baseRate.perKgRate;

    // Calculate total rate
    let totalRate = baseRate.baseRate + additionalCharges;

    // Add COD charges if applicable
    if (cod && rateCard.codCharges) {
      totalRate += rateCard.codCharges;
    }

    // Add fuel surcharge if applicable
    if (rateCard.fuelSurcharge) {
      totalRate += (totalRate * rateCard.fuelSurcharge) / 100;
    }

    res.status(200).json({
      success: true,
      data: {
        baseRate: baseRate.baseRate,
        additionalCharges,
        codCharges: cod ? rateCard.codCharges : 0,
        fuelSurcharge: rateCard.fuelSurcharge ? (totalRate * rateCard.fuelSurcharge) / 100 : 0,
        totalRate: Math.round(totalRate),
        zone,
        chargeableWeight,
        mode
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get rate card change history
export const getRateCardHistory = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const history = await RateCard.findOne({ seller: req.user.id })
      .select('history')
      .slice('history', [skip, parseInt(limit)])
      .lean();

    if (!history) {
      throw new AppError('Rate card history not found', 404);
    }

    const total = history.history ? history.history.length : 0;

    res.status(200).json({
      success: true,
      data: {
        history: history.history || [],
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get zone mapping for pincodes
export const getZoneMapping = async (req, res, next) => {
  try {
    const { pincodes } = req.query;
    
    if (!pincodes) {
      throw new AppError('Please provide pincodes', 400);
    }

    const pincodeList = pincodes.split(',').map(p => p.trim());
    const zones = await Promise.all(
      pincodeList.map(async pincode => {
        const zone = await getZoneFromPincode(pincode);
        return { pincode, zone };
      })
    );

    res.status(200).json({
      success: true,
      data: zones
    });
  } catch (error) {
    next(error);
  }
};

// Helper function to get zone from pincode pair
async function getZoneFromPincodes(fromPincode, toPincode) {
  // This would typically query a pincode database to determine the zone
  // For now, using a simple logic based on first 2 digits
  const fromZone = fromPincode.substring(0, 2);
  const toZone = toPincode.substring(0, 2);
  
  if (fromZone === toZone) return 'A';
  if (Math.abs(parseInt(fromZone) - parseInt(toZone)) <= 5) return 'B';
  if (Math.abs(parseInt(fromZone) - parseInt(toZone)) <= 10) return 'C';
  return 'D';
}

// Helper function to get zone from single pincode
async function getZoneFromPincode(pincode) {
  // This would typically query a pincode database
  // For now, using a simple mapping based on first digit
  const zoneMap = {
    '1': 'North',
    '2': 'North',
    '3': 'East',
    '4': 'East',
    '5': 'South',
    '6': 'South',
    '7': 'West',
    '8': 'West',
    '9': 'Central',
    '0': 'Central'
  };
  return zoneMap[pincode[0]] || 'Unknown';
} 