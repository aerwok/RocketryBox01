import Seller from '../models/seller.model.js';
import RateCard from '../models/ratecard.model.js';
import { rateCard as defaultRateCard } from '../../../utils/courierRates.js';
import { getPincodeDetails } from '../../../utils/pincode.js';

// Get the rate card for the authenticated seller
export const getSellerRateCard = async (req, res, next) => {
  try {
    const seller = await Seller.findById(req.user.id).populate('rateCard');
    let rateCardData;
    if (seller && seller.rateCard) {
      rateCardData = seller.rateCard.rates;
    } else {
      rateCardData = defaultRateCard;
    }
    res.status(200).json({
      success: true,
      data: rateCardData
    });
  } catch (error) {
    next(error);
  }
};

// Calculate rates using the seller's rate card
export const calculateRateCard = async (req, res, next) => {
  try {
    const { weight, pickupPincode, deliveryPincode, isCOD } = req.body;
    if (!weight || !pickupPincode || !deliveryPincode) {
      return res.status(400).json({ success: false, message: 'weight, pickupPincode, and deliveryPincode are required' });
    }
    // Get seller's rate card
    const seller = await Seller.findById(req.user.id).populate('rateCard');
    const rateCardData = (seller && seller.rateCard) ? seller.rateCard.rates : defaultRateCard;
    // Validate pincodes
    const pickupDetails = await getPincodeDetails(pickupPincode);
    const deliveryDetails = await getPincodeDetails(deliveryPincode);
    if (!pickupDetails || !deliveryDetails) {
      return res.status(400).json({ success: false, message: 'Invalid pickup or delivery pincode' });
    }
    // Determine zone
    const { determineZone } = await import('../../../utils/courierRates.js');
    const zone = await determineZone(pickupPincode, deliveryPincode);
    // Calculate rates for each courier in the rate card
    const results = Object.keys(rateCardData).map(courier => {
      const { slabs, zones } = rateCardData[courier];
      const zoneRates = zones[zone];
      // Find the correct slab
      let slabIdx = 0;
      for (let i = 0; i < slabs.length; i++) {
        if (weight <= slabs[i]) {
          slabIdx = i;
          break;
        }
        if (i === slabs.length - 1) slabIdx = i;
      }
      let base = zoneRates.base[slabIdx];
      let addl = zoneRates.addl[slabIdx];
      const slabWeight = slabs[slabIdx];
      let additionalWeight = Math.max(0, weight - slabWeight);
      let addlUnits = Math.ceil(additionalWeight / 0.5);
      let addlCharge = addlUnits * addl;
      let total = base + addlCharge;
      let codCharge = 0;
      if (isCOD) {
        codCharge = zoneRates.cod + (zoneRates.codPct / 100) * total;
        total += codCharge;
      }
      return {
        courier,
        zone,
        weight,
        base,
        addl,
        addlCharge,
        cod: isCOD ? zoneRates.cod : 0,
        codPct: isCOD ? zoneRates.codPct : 0,
        codCharge: isCOD ? codCharge : 0,
        total: Math.round(total)
      };
    });
    res.status(200).json({ success: true, data: results });
  } catch (error) {
    next(error);
  }
}; 