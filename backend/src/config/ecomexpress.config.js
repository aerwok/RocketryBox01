import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Ecom Express API Configuration
 * Based on official API credentials and endpoints
 */
export const ECOMEXPRESS_CONFIG = {
  // Production API Endpoints
  API_BASE_URL: process.env.ECOMEXPRESS_API_URL || 'https://api.ecomexpress.in',
  SHIPMENT_BASE_URL: process.env.ECOMEXPRESS_SHIPMENT_URL || 'https://shipment.ecomexpress.in',
  TRACKING_BASE_URL: process.env.ECOMEXPRESS_TRACKING_URL || 'https://plapi.ecomexpress.in',
  
  // API Endpoints
  ENDPOINTS: {
    PINCODE_CHECK: '/apiv2/pincodes/',
    FETCH_AWB: '/apiv2/fetch_awb/',
    FETCH_AWB_V2: '/services/shipment/products/v2/fetch_awb/',
    MANIFEST: '/apiv2/manifest_awb/',
    MANIFEST_V2: '/services/expp/manifest/v2/expplus/',
    REVERSE_MANIFEST: '/apiv2/manifest_awb_rev_v2/',
    TRACKING: '/track_me/api/mawbd/',
    NDR_DATA: '/apiv2/ndr_resolutions/',
    CANCEL_AWB: '/apiv2/cancel_awb/',
    SHIPPING_LABEL: '/services/expp/shipping_label'
  },
  
  // Staging Environment
  STAGING: {
    API_BASE_URL: 'https://clbeta.ecomexpress.in',
    USERNAME: 'internaltest_staging',
    PASSWORD: '@^2%d@xhH^=9xK4U'
  },
  
  // Production Credentials (Multiple Shipper Codes)
  SHIPPERS: {
    BA: {
      CODE: process.env.ECOMEXPRESS_BA_CODE || '149441',
      USERNAME: process.env.ECOMEXPRESS_BA_USERNAME || 'ROCKETRYBOXPRIVATELIMITED-BA149441',
      PASSWORD: process.env.ECOMEXPRESS_BA_PASSWORD || 'DTpMlWcgDL'
    },
    EXSPLUS: {
      CODE: process.env.ECOMEXPRESS_EXSPLUS_CODE || '949442',
      USERNAME: process.env.ECOMEXPRESS_EXSPLUS_USERNAME || 'ROCKETRYBOXPRIVATELIMITED-EXSPLUS949442',
      PASSWORD: process.env.ECOMEXPRESS_EXSPLUS_PASSWORD || 'q1ZeRwUj9C'
    },
    EGS: {
      CODE: process.env.ECOMEXPRESS_EGS_CODE || '549443',
      USERNAME: process.env.ECOMEXPRESS_EGS_USERNAME || 'ROCKETRYBOXPRIVATELIMITED-BA-EGS549443',
      PASSWORD: process.env.ECOMEXPRESS_EGS_PASSWORD || 'OlZRxS0Fxa'
    }
  },
  
  // Service Configuration
  SERVICES: {
    STANDARD: 'BA',      // Basic service
    EXPRESS: 'EXSPLUS',  // Express Plus service
    ECONOMY: 'EGS'       // Economy service
  },
  
  // Rate Configuration
  DIMENSIONAL_FACTOR: 5000, // (L*W*H)/5000 for volumetric weight calculation
  BASE_RATE: 40,
  WEIGHT_RATE: 15,
  COD_CHARGE: 25,
  
  // Timeouts
  REQUEST_TIMEOUT: 30000, // 30 seconds
  
  // Environment specific settings
  IS_DEVELOPMENT: process.env.NODE_ENV === 'development',
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
  
  // Get shipper details based on service type
  getShipperDetails(serviceType = 'standard') {
    const serviceMap = {
      'express': this.SHIPPERS.EXSPLUS,
      'standard': this.SHIPPERS.BA,
      'economy': this.SHIPPERS.EGS
    };
    
    return serviceMap[serviceType] || this.SHIPPERS.BA;
  },
  
  // Get API Headers
  getHeaders() {
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
  },
  
  // Get tracking URL
  getTrackingUrl(awb) {
    return `https://www.ecomexpress.in/tracking/?awb=${awb}`;
  },
  
  // Validation
  validate() {
    const requiredShippers = ['BA', 'EXSPLUS', 'EGS'];
    const missingShippers = requiredShippers.filter(shipper => 
      !this.SHIPPERS[shipper].USERNAME || !this.SHIPPERS[shipper].PASSWORD
    );
    
    if (missingShippers.length > 0) {
      throw new Error(`Missing Ecom Express credentials for: ${missingShippers.join(', ')}`);
    }
    
    return true;
  }
};

// Validate configuration on import
try {
  ECOMEXPRESS_CONFIG.validate();
  console.log('✅ Ecom Express configuration loaded successfully');
} catch (error) {
  console.warn('⚠️ Ecom Express configuration warning:', error.message);
}

export default ECOMEXPRESS_CONFIG; 