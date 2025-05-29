import { ECOMEXPRESS_CONFIG } from '../config/ecomexpress.config.js';

/**
 * Ecom Express Manual Rate Calculator
 * Since Ecom Express doesn't provide rate calculation API,
 * this utility implements manual rate calculation based on their rate card
 */

export class EcomExpressRateCalculator {
  
  constructor() {
    // Base rates (₹) - these should be updated based on your actual rate card from Ecom Express
    this.baseRates = {
      // Standard BA Service
      standard: {
        baseRate: 45,           // First 500g
        additionalRate: 8,      // Per additional 500g
        minWeight: 500,         // Minimum billable weight (grams)
        codCharge: 25,          // COD collection charge
        fuelSurcharge: 0.15,    // 15% fuel surcharge
        serviceTax: 0.18        // 18% GST
      },
      
      // Express EXSPLUS Service  
      express: {
        baseRate: 65,           // First 500g
        additionalRate: 12,     // Per additional 500g
        minWeight: 500,
        codCharge: 30,
        fuelSurcharge: 0.15,
        serviceTax: 0.18
      },
      
      // Economy EGS Service
      economy: {
        baseRate: 35,           // First 500g
        additionalRate: 6,      // Per additional 500g
        minWeight: 500,
        codCharge: 20,
        fuelSurcharge: 0.15,
        serviceTax: 0.18
      }
    };
    
    // Zone-based multipliers (approximate - should be confirmed with Ecom Express)
    this.zoneMultipliers = {
      'metro_to_metro': 1.0,      // Mumbai to Delhi
      'metro_to_state': 1.2,      // Mumbai to Pune
      'metro_to_rest': 1.5,       // Mumbai to smaller cities
      'state_to_state': 1.3,      // State capital to state capital
      'state_to_rest': 1.6,       // State capital to smaller cities
      'rest_to_rest': 1.8         // Smaller city to smaller city
    };
  }

  /**
   * Calculate volumetric weight
   */
  calculateVolumetricWeight(length, width, height) {
    return Math.ceil((length * width * height) / ECOMEXPRESS_CONFIG.DIMENSIONAL_FACTOR);
  }

  /**
   * Calculate chargeable weight (higher of actual weight vs volumetric weight)
   */
  calculateChargeableWeight(actualWeight, length, width, height) {
    const volumetricWeight = this.calculateVolumetricWeight(length, width, height);
    return Math.max(actualWeight, volumetricWeight);
  }

  /**
   * Determine zone based on pincodes (simplified logic)
   */
  determineZone(originPincode, destinationPincode) {
    // Metro cities (simplified list)
    const metroCities = ['400', '110', '560', '600', '500', '700', '411', '380'];
    
    const originMetro = metroCities.some(code => originPincode.startsWith(code));
    const destMetro = metroCities.some(code => destinationPincode.startsWith(code));
    
    // Same state check (first 2 digits of pincode)
    const sameState = originPincode.substring(0, 2) === destinationPincode.substring(0, 2);
    
    if (originMetro && destMetro) return 'metro_to_metro';
    if (originMetro && sameState) return 'metro_to_state';
    if (originMetro) return 'metro_to_rest';
    if (sameState) return 'state_to_state';
    if (!originMetro && !destMetro && !sameState) return 'rest_to_rest';
    return 'state_to_rest';
  }

  /**
   * Calculate shipping rate
   */
  async calculateRate(params) {
    const {
      serviceType = 'standard',
      originPincode,
      destinationPincode,
      actualWeight, // in grams
      length = 0,   // in cm
      width = 0,    // in cm  
      height = 0,   // in cm
      codValue = 0, // COD amount
      declaredValue = 0
    } = params;

    try {
      // Validate inputs
      if (!originPincode || !destinationPincode || !actualWeight) {
        throw new Error('Origin pincode, destination pincode, and weight are required');
      }

      // Check serviceability first
      const isServiceable = await this.checkServiceability(destinationPincode);
      if (!isServiceable) {
        throw new Error(`Destination pincode ${destinationPincode} is not serviceable`);
      }

      const rates = this.baseRates[serviceType];
      if (!rates) {
        throw new Error(`Invalid service type: ${serviceType}`);
      }

      // Calculate chargeable weight
      const chargeableWeight = this.calculateChargeableWeight(actualWeight, length, width, height);
      const billableWeight = Math.max(chargeableWeight, rates.minWeight);

      // Calculate base shipping cost
      let shippingCost = rates.baseRate;
      
      if (billableWeight > rates.minWeight) {
        const additionalWeight = billableWeight - rates.minWeight;
        const additionalSlabs = Math.ceil(additionalWeight / 500); // 500g slabs
        shippingCost += additionalSlabs * rates.additionalRate;
      }

      // Apply zone multiplier
      const zone = this.determineZone(originPincode, destinationPincode);
      const zoneMultiplier = this.zoneMultipliers[zone] || 1.5;
      shippingCost *= zoneMultiplier;

      // Add fuel surcharge
      const fuelSurcharge = shippingCost * rates.fuelSurcharge;
      
      // Add COD charges if applicable
      const codCharges = codValue > 0 ? rates.codCharge : 0;

      // Calculate subtotal
      const subtotal = shippingCost + fuelSurcharge + codCharges;

      // Add service tax (GST)
      const serviceTax = subtotal * rates.serviceTax;
      
      // Final total
      const total = Math.round(subtotal + serviceTax);

      return {
        success: true,
        serviceType,
        zone,
        weight: {
          actual: actualWeight,
          volumetric: this.calculateVolumetricWeight(length, width, height),
          chargeable: chargeableWeight,
          billable: billableWeight
        },
        breakdown: {
          baseShipping: Math.round(shippingCost),
          fuelSurcharge: Math.round(fuelSurcharge),
          codCharges,
          subtotal: Math.round(subtotal),
          serviceTax: Math.round(serviceTax),
          total
        },
        metadata: {
          originPincode,
          destinationPincode,
          zoneMultiplier,
          rateCalculatedAt: new Date().toISOString(),
          disclaimer: 'Rates are estimated based on standard rate card. Actual rates may vary. Please confirm with Ecom Express.'
        }
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        serviceType,
        rateCalculatedAt: new Date().toISOString()
      };
    }
  }

  /**
   * Check if pincode is serviceable using the working pincode API
   */
  async checkServiceability(pincode) {
    try {
      const url = `${ECOMEXPRESS_CONFIG.API_BASE_URL}${ECOMEXPRESS_CONFIG.ENDPOINTS.PINCODE_CHECK}`;
      const formData = ECOMEXPRESS_CONFIG.createAuthenticatedFormData('standard', { pincode });
      
      const response = await fetch(url, {
        method: 'POST',
        headers: ECOMEXPRESS_CONFIG.getHeaders(),
        body: formData
      });

      if (response.ok) {
        const data = await response.text();
        const jsonData = JSON.parse(data);
        
        if (Array.isArray(jsonData)) {
          const pincodeRecord = jsonData.find(record => record.pincode == pincode);
          return pincodeRecord && pincodeRecord.status === 1 && pincodeRecord.active === true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('Error checking serviceability:', error);
      return false; // Assume not serviceable if API fails
    }
  }

  /**
   * Get rate for all service types
   */
  async getAllServiceRates(params) {
    const services = ['standard', 'express', 'economy'];
    const results = {};

    for (const serviceType of services) {
      results[serviceType] = await this.calculateRate({
        ...params,
        serviceType
      });
    }

    return results;
  }

  /**
   * Update rate card (for when you get actual rates from Ecom Express)
   */
  updateRateCard(serviceType, newRates) {
    if (this.baseRates[serviceType]) {
      this.baseRates[serviceType] = { ...this.baseRates[serviceType], ...newRates };
      return true;
    }
    return false;
  }
}

// Export singleton instance
export const ecomExpressRateCalculator = new EcomExpressRateCalculator();
export default ecomExpressRateCalculator; 