import { getPincodeDetails } from './pincode.js';

// Sample rate card data structure (expand as needed)
const rateCard = {
  'Bluedart air': {
    slabs: [0.5, 1, 2, 5, 10],
    zones: {
      'WITHIN_CITY':    { base: [37, 45, 48, 49, 64], addl: [36, 43, 47, 48, 62], cod: 35, codPct: 1.5 },
      'WITHIN_STATE':   { base: [45, 52, 60, 64, 87], addl: [43, 52, 59, 64, 86], cod: 35, codPct: 1.5 },
      'METRO_TO_METRO': { base: [48, 60, 89, 193, 227], addl: [47, 59, 60, 64, 87], cod: 35, codPct: 1.5 },
      'REST_OF_INDIA':  { base: [49, 64, 99, 193, 369], addl: [48, 63, 64, 64, 64], cod: 35, codPct: 1.5 },
      'NORTH_EAST':     { base: [64, 87, 131, 227, 430], addl: [62, 86, 87, 87, 87], cod: 35, codPct: 1.5 }
    }
  },
  'Delhivery surface': {
    slabs: [0.5, 1, 2, 5, 10],
    zones: {
      'WITHIN_CITY':    { base: [32, 49, 69, 141, 262], addl: [30, 48, 49, 49, 49], cod: 35, codPct: 1.75 },
      'WITHIN_STATE':   { base: [34, 52, 74, 149, 275], addl: [32, 51, 52, 52, 52], cod: 35, codPct: 1.75 },
      'METRO_TO_METRO': { base: [46, 60, 89, 171, 325], addl: [43, 59, 60, 60, 60], cod: 35, codPct: 1.75 },
      'REST_OF_INDIA':  { base: [49, 64, 99, 193, 369], addl: [46, 63, 64, 64, 64], cod: 35, codPct: 1.75 },
      'NORTH_EAST':     { base: [68, 87, 131, 227, 430], addl: [64, 86, 87, 87, 87], cod: 35, codPct: 1.75 }
    }
  },
  'DTDC surface': {
    slabs: [0.5, 1, 2, 5, 10],
    zones: {
      'WITHIN_CITY':    { base: [30, 49, 69, 141, 262], addl: [30, 48, 49, 49, 49], cod: 27, codPct: 1.25 },
      'WITHIN_STATE':   { base: [35, 52, 74, 149, 275], addl: [35, 51, 52, 52, 52], cod: 27, codPct: 1.25 },
      'METRO_TO_METRO': { base: [41, 60, 89, 171, 325], addl: [41, 59, 60, 60, 60], cod: 27, codPct: 1.25 },
      'REST_OF_INDIA':  { base: [49, 64, 99, 193, 369], addl: [49, 63, 64, 64, 64], cod: 27, codPct: 1.25 },
      'NORTH_EAST':     { base: [62, 87, 131, 227, 430], addl: [62, 86, 87, 87, 87], cod: 27, codPct: 1.25 }
    }
  },
  'Ekart air': {
    slabs: [0.5, 1, 2, 5, 10],
    zones: {
      'WITHIN_CITY':    { base: [31, 49, 69, 141, 262], addl: [29, 48, 49, 49, 49], cod: 30, codPct: 1.5 },
      'WITHIN_STATE':   { base: [33, 52, 74, 149, 275], addl: [31, 51, 52, 52, 52], cod: 30, codPct: 1.5 },
      'METRO_TO_METRO': { base: [38, 60, 89, 171, 325], addl: [36, 59, 60, 60, 60], cod: 30, codPct: 1.5 },
      'REST_OF_INDIA':  { base: [40, 64, 99, 193, 369], addl: [38, 63, 64, 64, 64], cod: 30, codPct: 1.5 },
      'NORTH_EAST':     { base: [45, 87, 131, 227, 430], addl: [43, 86, 87, 87, 87], cod: 30, codPct: 1.5 }
    }
  },
  'Xpressbees air': {
    slabs: [0.5, 1, 2, 5, 10],
    zones: {
      'WITHIN_CITY':    { base: [27, 40, 64, 98, 149], addl: [16, 30, 49, 52, 52], cod: 27, codPct: 1.18 },
      'WITHIN_STATE':   { base: [27, 40, 64, 98, 149], addl: [16, 30, 49, 52, 52], cod: 27, codPct: 1.18 },
      'METRO_TO_METRO': { base: [37, 58, 69, 110, 161], addl: [34, 35, 60, 20, 20], cod: 27, codPct: 1.18 },
      'REST_OF_INDIA':  { base: [51, 58, 76, 123, 174], addl: [40, 35, 25, 20, 22], cod: 27, codPct: 1.18 },
      'NORTH_EAST':     { base: [55, 69, 89, 149, 238], addl: [47, 69, 89, 149, 22], cod: 27, codPct: 1.18 }
    }
  },
  'Delhivery surface-0.50': {
    slabs: [0.5],
    zones: {
      'WITHIN_CITY':    { base: [32], addl: [30], cod: 35, codPct: 1.75 },
      'WITHIN_STATE':   { base: [34], addl: [32], cod: 35, codPct: 1.75 },
      'METRO_TO_METRO': { base: [46], addl: [43], cod: 35, codPct: 1.75 },
      'REST_OF_INDIA':  { base: [49], addl: [46], cod: 35, codPct: 1.75 },
      'NORTH_EAST':     { base: [68], addl: [64], cod: 35, codPct: 1.75 }
    }
  },
  'Delhivery surface-1.00': {
    slabs: [1.0],
    zones: {
      'WITHIN_CITY':    { base: [49], addl: [48], cod: 35, codPct: 1.75 },
      'WITHIN_STATE':   { base: [52], addl: [51], cod: 35, codPct: 1.75 },
      'METRO_TO_METRO': { base: [60], addl: [59], cod: 35, codPct: 1.75 },
      'REST_OF_INDIA':  { base: [64], addl: [63], cod: 35, codPct: 1.75 },
      'NORTH_EAST':     { base: [87], addl: [86], cod: 35, codPct: 1.75 }
    }
  },
  'Delhivery surface-2.00': {
    slabs: [2.0],
    zones: {
      'WITHIN_CITY':    { base: [69], addl: [49], cod: 35, codPct: 1.75 },
      'WITHIN_STATE':   { base: [74], addl: [52], cod: 35, codPct: 1.75 },
      'METRO_TO_METRO': { base: [89], addl: [60], cod: 35, codPct: 1.75 },
      'REST_OF_INDIA':  { base: [99], addl: [64], cod: 35, codPct: 1.75 },
      'NORTH_EAST':     { base: [131], addl: [87], cod: 35, codPct: 1.75 }
    }
  },
  'Delhivery surface-5.00': {
    slabs: [5.0],
    zones: {
      'WITHIN_CITY':    { base: [141], addl: [49], cod: 35, codPct: 1.75 },
      'WITHIN_STATE':   { base: [149], addl: [52], cod: 35, codPct: 1.75 },
      'METRO_TO_METRO': { base: [171], addl: [60], cod: 35, codPct: 1.75 },
      'REST_OF_INDIA':  { base: [193], addl: [64], cod: 35, codPct: 1.75 },
      'NORTH_EAST':     { base: [227], addl: [87], cod: 35, codPct: 1.75 }
    }
  },
  'Delhivery surface-10.00': {
    slabs: [10.0],
    zones: {
      'WITHIN_CITY':    { base: [262], addl: [49], cod: 35, codPct: 1.75 },
      'WITHIN_STATE':   { base: [275], addl: [52], cod: 35, codPct: 1.75 },
      'METRO_TO_METRO': { base: [325], addl: [60], cod: 35, codPct: 1.75 },
      'REST_OF_INDIA':  { base: [369], addl: [64], cod: 35, codPct: 1.75 },
      'NORTH_EAST':     { base: [430], addl: [87], cod: 35, codPct: 1.75 }
    }
  }
};

// Sample pincode to city/state mapping (expand for real use)
const pincodeData = {
  '400001': { city: 'Mumbai', state: 'Maharashtra' },
  '110001': { city: 'Delhi', state: 'Delhi' },
  '560001': { city: 'Bangalore', state: 'Karnataka' },
  '700001': { city: 'Kolkata', state: 'West Bengal' },
  '600001': { city: 'Chennai', state: 'Tamil Nadu' },
  '500001': { city: 'Hyderabad', state: 'Telangana' },
  '411001': { city: 'Pune', state: 'Maharashtra' },
  '380001': { city: 'Ahmedabad', state: 'Gujarat' },
  '793001': { city: 'Shillong', state: 'Meghalaya' }, // North East
  '190001': { city: 'Srinagar', state: 'Jammu & Kashmir' }, // J&K
  // ...add more as needed
};

const metroCities = ['Mumbai', 'Delhi', 'Bangalore', 'Kolkata', 'Chennai', 'Hyderabad', 'Pune', 'Ahmedabad'];
const northEastStates = [
  'Arunachal Pradesh', 'Assam', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Tripura', 'Sikkim', 'Jammu & Kashmir'
];

// Make determineZone async to use DB
export async function determineZone(pickupPincode, deliveryPincode) {
  const pickup = await getPincodeDetails(pickupPincode);
  const delivery = await getPincodeDetails(deliveryPincode);
  if (!pickup || !delivery) return 'REST_OF_INDIA';

  // North East/J&K logic
  if (northEastStates.includes(delivery.state)) return 'NORTH_EAST';

  if (pickup.district === delivery.district && pickup.state === delivery.state) return 'WITHIN_CITY';
  if (pickup.state === delivery.state) return 'WITHIN_STATE';

  if (metroCities.includes(pickup.district) && metroCities.includes(delivery.district)) return 'METRO_TO_METRO';

  return 'REST_OF_INDIA';
}

// Find the correct slab index for a given weight
function getSlabIndex(slabs, weight) {
  for (let i = 0; i < slabs.length; i++) {
    if (weight <= slabs[i]) return i;
  }
  return slabs.length - 1; // Use the highest slab if overweight
}

// Calculate rate for a single courier
function calculateRateForCourier(courier, weight, zone, isCOD) {
  const { slabs, zones } = rateCard[courier];
  const zoneRates = zones[zone];
  const slabIdx = getSlabIndex(slabs, weight);
  let base = zoneRates.base[slabIdx];
  let addl = zoneRates.addl[slabIdx];
  // Calculate additional weight charges
  const slabWeight = slabs[slabIdx];
  let additionalWeight = Math.max(0, weight - slabWeight);
  let addlUnits = Math.ceil(additionalWeight / 0.5);
  let addlCharge = addlUnits * addl;
  let total = base + addlCharge;
  // Add COD charges if applicable
  if (isCOD) {
    total += zoneRates.cod + (zoneRates.codPct / 100) * total;
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
    total: Math.round(total)
  };
}

// Main function: calculate rates for all couriers (now async)
export async function calculateCourierRates({ weight, pickupPincode, deliveryPincode, isCOD }) {
  const zone = await determineZone(pickupPincode, deliveryPincode);
  return Object.keys(rateCard).map(courier => {
    return calculateRateForCourier(courier, weight, zone, isCOD);
  });
} 