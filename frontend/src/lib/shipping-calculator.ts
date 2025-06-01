import { ZoneType } from "@/types/shipping";
import { ServiceFactory } from "@/services/service-factory";

interface RateZone {
    base: string;
    additional: string;
    rto: string;
}

interface RateData {
    mode: string;
    withinCity: RateZone;
    withinState: RateZone;
    metroToMetro: RateZone;
    restOfIndia: RateZone;
    northEastJK: RateZone;
    cod: string;
    codPercent: string;
}

// Database zone mapping - matches backend enum
const DATABASE_ZONE_MAPPING: Record<ZoneType, string> = {
    "withinCity": "Within City",
    "withinState": "Within State", 
    "metroToMetro": "Metro to Metro",
    "restOfIndia": "Rest of India",
    "northEastJK": "Special Zone"
};

// Metro cities pincodes (sample)
const metroPincodes = {
    delhi: ["110001", "110002", "110003"],
    mumbai: ["400001", "400002", "400003"],
    kolkata: ["700001", "700002", "700003"],
    chennai: ["600001", "600002", "600003"]
};

// North East and J&K pincodes (sample)
const northEastJKPincodes = {
    assam: ["781001", "781002"],
    meghalaya: ["793001", "793002"],
    jammuKashmir: ["180001", "180002"]
};

export function determineZone(fromPincode: string, toPincode: string): ZoneType {
    // Check if both pincodes are from same city
    if (fromPincode.substring(0, 3) === toPincode.substring(0, 3)) {
        return "withinCity";
    }

    // Check if both pincodes are from same state
    if (fromPincode.substring(0, 2) === toPincode.substring(0, 2)) {
        return "withinState";
    }

    // Check if both are metro cities
    const isFromMetro = Object.values(metroPincodes).some(pincodes => pincodes.includes(fromPincode));
    const isToMetro = Object.values(metroPincodes).some(pincodes => pincodes.includes(toPincode));
    if (isFromMetro && isToMetro) {
        return "metroToMetro";
    }

    // Check if destination is North East or J&K
    const isNorthEastJK = Object.values(northEastJKPincodes).some(pincodes => pincodes.includes(toPincode));
    if (isNorthEastJK) {
        return "northEastJK";
    }

    // Default to Rest of India
    return "restOfIndia";
}

/**
 * New Database-Powered Rate Calculation
 * Uses the backend API with MongoDB rate cards
 */
export async function calculateShippingRateFromDB(
    fromPincode: string,
    toPincode: string,
    weight: number,
    length: number,
    width: number,
    height: number,
    orderType: 'prepaid' | 'cod' = 'prepaid',
    codCollectableAmount: number = 0,
    includeRTO: boolean = false,
    courier?: string
) {
    try {
        // Determine zone using pincode logic
        const zoneType = determineZone(fromPincode, toPincode);
        const dbZone = DATABASE_ZONE_MAPPING[zoneType];

        // Call the database API
        const response = await ServiceFactory.shipping.calculateRatesFromDB({
            zone: dbZone,
            weight,
            length,
            width,
            height,
            orderType,
            codCollectableAmount,
            includeRTO,
            courier
        });

        if (!response.success) {
            throw new Error(response.message || 'Failed to calculate shipping rates');
        }

        return {
            success: true,
            zone: zoneType,
            dbZone,
            calculations: response.data.calculations,
            inputData: response.data.inputData,
            cheapestOption: response.data.cheapestOption,
            totalOptions: response.data.totalOptions
        };

    } catch (error) {
        console.error('Database rate calculation failed:', error);
        throw error;
    }
}

/**
 * Get available couriers from database
 */
export async function getAvailableCouriers() {
    try {
        const response = await ServiceFactory.shipping.getActiveCouriers();
        return response.success ? response.data : [];
    } catch (error) {
        console.error('Failed to get couriers:', error);
        return [];
    }
}

/**
 * Legacy function - kept for backward compatibility
 * Uses hardcoded rate data
 */
export async function calculateShippingRate(
    fromPincode: string,
    toPincode: string,
    weight: number,
    mode: string,
    isCOD: boolean = false,
    rateData: RateData[]
) {
    const zone = determineZone(fromPincode, toPincode);
    const rateInfo = rateData.find(r => r.mode === mode);

    if (!rateInfo) {
        throw new Error(`Rate not found for mode: ${mode}`);
    }

    let zoneRates;
    switch (zone) {
        case "withinCity":
            zoneRates = rateInfo.withinCity;
            break;
        case "withinState":
            zoneRates = rateInfo.withinState;
            break;
        case "metroToMetro":
            zoneRates = rateInfo.metroToMetro;
            break;
        case "northEastJK":
            zoneRates = rateInfo.northEastJK;
            break;
        default:
            zoneRates = rateInfo.restOfIndia;
    }

    // Calculate base shipping charge
    const baseCharge = parseFloat(zoneRates.base);
    
    // Add additional weight charges
    const baseWeight = parseFloat(mode.split("-")[1].replace("kg", ""));
    const additionalWeightCharge = weight > baseWeight ? parseFloat(zoneRates.additional) * Math.ceil(weight - baseWeight) : 0;
    
    // Calculate COD charge if applicable
    const codCharge = isCOD ? parseFloat(rateInfo.cod) : 0;
    
    // Calculate GST (18%)
    const subtotal = baseCharge + additionalWeightCharge + codCharge;
    const gst = subtotal * 0.18;
    
    // Calculate total
    const total = subtotal + gst;

    return {
        zone,
        baseCharge,
        additionalWeightCharge,
        codCharge,
        gst,
        total,
        gstPercentage: 18
    };
} 