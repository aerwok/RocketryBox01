import 'dotenv/config';

/**
 * Ecom Express API Configuration
 * Live API Only - No Fallback Values
 */
export const ECOMEXPRESS_CONFIG = {
  // Production API Endpoints (Fixed URLs to match documentation exactly)
  API_BASE_URL: process.env.ECOMEXPRESS_API_URL || 'https://api.ecomexpress.in',
  SHIPMENT_BASE_URL: 'https://Shipment.ecomexpress.in', // FIXED: Force correct uppercase 'S' - confirmed working in tests
  TRACKING_BASE_URL: process.env.ECOMEXPRESS_TRACKING_URL || 'https://plapi.ecomexpress.in',

  // API Endpoints (Fixed to match provided documentation)
  ENDPOINTS: {
    PINCODE_CHECK: '/apiv2/pincode/', // Fixed: Changed from 'pincodes' to 'pincode' to match docs
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
    PASSWORD: '@^2%d@xhH^=9xK4U',
    ENDPOINTS: {
      PINCODE_CHECK: '/apiv2/pincodes/', // Staging uses plural
      FETCH_AWB: '/apiv2/fetch_awb/',
      MANIFEST: '/apiv2/manifest_awb/',
      REVERSE_MANIFEST: '/apiv2/manifest_awb_rev_v2/',
      TRACKING: '/track_me/api/mawbd/',
      NDR_DATA: '/apiv2/ndr_resolutions/',
      CANCEL_AWB: '/apiv2/cancel_awb/'
    }
  },

  // Production Credentials (No Fallback Values)
  SHIPPERS: {
    BA: {
      CODE: process.env.ECOMEXPRESS_BA_CODE,
      USERNAME: process.env.ECOMEXPRESS_BA_USERNAME,
      PASSWORD: process.env.ECOMEXPRESS_BA_PASSWORD
    },
    EXSPLUS: {
      CODE: process.env.ECOMEXPRESS_EXSPLUS_CODE,
      USERNAME: process.env.ECOMEXPRESS_EXSPLUS_USERNAME,
      PASSWORD: process.env.ECOMEXPRESS_EXSPLUS_PASSWORD
    },
    EGS: {
      CODE: process.env.ECOMEXPRESS_EGS_CODE,
      USERNAME: process.env.ECOMEXPRESS_EGS_USERNAME,
      PASSWORD: process.env.ECOMEXPRESS_EGS_PASSWORD
    }
  },

  // Service Configuration
  SERVICES: {
    STANDARD: 'BA',      // Basic service
    EXPRESS: 'EXSPLUS',  // Express Plus service
    ECONOMY: 'EGS'       // Economy service
  },

  // Pricing Configuration
  BASE_RATE: 40,       // Base shipping rate
  WEIGHT_RATE: 15,     // Rate per kg
  COD_CHARGE: 25,      // COD handling charge

  // Dimensional factor for volumetric weight calculation
  DIMENSIONAL_FACTOR: 5000, // (L*W*H)/5000 for volumetric weight calculation

  // Timeouts
  REQUEST_TIMEOUT: 30000, // 30 seconds

  // Environment specific settings
  IS_DEVELOPMENT: process.env.NODE_ENV === 'development',
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
  USE_STAGING: process.env.ECOMEXPRESS_USE_STAGING === 'true',

  // Get shipper details based on service type
  getShipperDetails(serviceType = 'standard') {
    const serviceMap = {
      'express': this.SHIPPERS.EXSPLUS,
      'standard': this.SHIPPERS.BA,
      'economy': this.SHIPPERS.EGS
    };

    const shipper = serviceMap[serviceType] || this.SHIPPERS.BA;

    if (!shipper || !shipper.USERNAME || !shipper.PASSWORD) {
      throw new Error(`Ecom Express credentials not configured for service type: ${serviceType}`);
    }

    return shipper;
  },

  // Get base URL based on environment
  getBaseUrl(endpoint = 'API') {
    if (this.USE_STAGING) {
      return this.STAGING.API_BASE_URL;
    }

    switch (endpoint) {
      case 'SHIPMENT':
        return this.SHIPMENT_BASE_URL;
      case 'TRACKING':
        return this.TRACKING_BASE_URL;
      default:
        return this.API_BASE_URL;
    }
  },

  // Get endpoint path based on environment
  getEndpoint(endpointName) {
    if (this.USE_STAGING && this.STAGING.ENDPOINTS[endpointName]) {
      return this.STAGING.ENDPOINTS[endpointName];
    }
    return this.ENDPOINTS[endpointName];
  },

  // Get API Headers (Updated to WORKING Format!)
  getHeaders() {
    return {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json',
      'User-Agent': 'RocketryBox-EcomExpress-Integration/1.0'
    };
  },

  // Get JSON Headers (for specific APIs that need JSON)
  getJSONHeaders() {
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': 'RocketryBox-EcomExpress-Integration/1.0'
    };
  },

  // Create form data payload (WORKING FORMAT - Use this for all API calls!)
  createFormData(params) {
    const formData = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        formData.append(key, value.toString());
      }
    });
    return formData;
  },

  // Helper method to create authenticated form data
  createAuthenticatedFormData(serviceType, additionalParams = {}) {
    const shipper = this.getShipperDetails(serviceType);
    const params = {
      username: shipper.USERNAME,
      password: shipper.PASSWORD,
      ...additionalParams
    };
    return this.createFormData(params);
  },

  // Get tracking URL
  getTrackingUrl(awb) {
    return `https://www.ecomexpress.in/tracking/?awb=${awb}`;
  },

  // Validation
  validate() {
    const requiredShippers = ['BA', 'EXSPLUS', 'EGS'];
    const missingShippers = requiredShippers.filter(shipper =>
      !this.SHIPPERS[shipper] || !this.SHIPPERS[shipper].USERNAME || !this.SHIPPERS[shipper].PASSWORD
    );

    if (missingShippers.length > 0) {
      throw new Error(`Missing Ecom Express credentials for: ${missingShippers.join(', ')}`);
    }

    return true;
  }
};

// Validate configuration on import
try {
  if (ECOMEXPRESS_CONFIG.SHIPPERS.BA.USERNAME || ECOMEXPRESS_CONFIG.SHIPPERS.EXSPLUS.USERNAME || ECOMEXPRESS_CONFIG.SHIPPERS.EGS.USERNAME) {
    ECOMEXPRESS_CONFIG.validate();
    // console.log('✅ Ecom Express configuration loaded successfully');
    // console.log('📋 Live API Only - No Fallback Values');
    // console.log(`🌐 Base URLs: API=${ECOMEXPRESS_CONFIG.API_BASE_URL}, Shipment=${ECOMEXPRESS_CONFIG.SHIPMENT_BASE_URL}, Tracking=${ECOMEXPRESS_CONFIG.TRACKING_BASE_URL}`);
  } else {
    console.log('⚠️ Ecom Express configuration: No credentials provided');
  }
} catch (error) {
  console.warn('⚠️ Ecom Express configuration warning:', error.message);
}

export default ECOMEXPRESS_CONFIG;
