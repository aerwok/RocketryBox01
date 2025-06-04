import 'dotenv/config';

/**
 * Ekart Logistics API Configuration
 * Based on official API documentation v3.8.1
 */
export const EKART_CONFIG = {
  // API Base Configuration
  BASE_URL: 'https://app.elite.ekartlogistics.in',
  CLIENT_ID: process.env.EKART_CLIENT_ID || 'EKART_68222515d9cfb913b0c8dc30',

  // Authentication Credentials
  USERNAME: process.env.EKART_USERNAME || 'raushankumardwivedi@rediffmail.com',
  PASSWORD: process.env.EKART_PASSWORD || 'Sunny@1996',

  // API Endpoints
  ENDPOINTS: {
    // Authentication
    AUTH_TOKEN: '/integrations/v2/auth/token',

    // Shipment Management
    CREATE_SHIPMENT: '/api/v1/package/create',
    CANCEL_SHIPMENT: '/api/v1/package/cancel',

    // Labels & Manifest
    DOWNLOAD_LABEL: '/api/v1/package/label',
    GENERATE_MANIFEST: '/data/v2/generate/manifest',

    // Tracking
    TRACK_SHIPMENT: '/api/v1/track',

    // Serviceability
    SERVICEABILITY_V2: '/api/v2/serviceability',
    SERVICEABILITY_V3: '/data/v3/serviceability',

    // NDR Management
    NDR_ACTION: '/api/v2/package/ndr',

    // Address Management
    ADD_ADDRESS: '/api/v2/address',
    GET_ADDRESSES: '/api/v2/addresses',

    // Webhook Management
    WEBHOOK: '/api/v2/webhook',

    // Pricing
    ESTIMATE_PRICING: '/data/pricing/estimate'
  },

  // Service Types
  SERVICE_TYPES: {
    SURFACE: 'SURFACE',
    EXPRESS: 'EXPRESS'
  },

  // Payment Modes
  PAYMENT_MODES: {
    COD: 'COD',
    PREPAID: 'Prepaid',
    PICKUP: 'Pickup' // For reverse shipments
  },

  // NDR Actions
  NDR_ACTIONS: {
    RE_ATTEMPT: 'Re-Attempt',
    RTO: 'RTO',
    EDIT: 'Edit'
  },

  // Webhook Topics
  WEBHOOK_TOPICS: {
    TRACK_UPDATED: 'track_updated',
    SHIPMENT_CREATED: 'shipment_created',
    SHIPMENT_RECREATED: 'shipment_recreated'
  },

  // Request Configuration
  REQUEST_TIMEOUT: 30000, // 30 seconds
  MAX_RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 2000, // 2 seconds

  // Token Management
  TOKEN_CACHE_KEY: 'ekart_access_token',
  TOKEN_EXPIRY_BUFFER: 300, // 5 minutes buffer before token expiry

  // File Upload Limits
  MAX_LABEL_IDS: 100,
  MAX_MANIFEST_IDS: 100,

  // COD Limits
  MAX_COD_AMOUNT: 49999,

  // Dimension Limits (in cm)
  DIMENSION_LIMITS: {
    MIN_LENGTH: 1,
    MIN_WIDTH: 1,
    MIN_HEIGHT: 1,
    MIN_WEIGHT: 1 // in grams
  },

  /**
   * Get full API endpoint URL
   * @param {string} endpoint - Endpoint key
   * @returns {string} - Full URL
   */
  getEndpointUrl(endpoint) {
    const endpointPath = this.ENDPOINTS[endpoint];
    if (!endpointPath) {
      throw new Error(`Unknown Ekart endpoint: ${endpoint}`);
    }
    return `${this.BASE_URL}${endpointPath}`;
  },

  /**
   * Get authentication URL with client ID
   * @returns {string} - Authentication URL
   */
  getAuthUrl() {
    return `${this.BASE_URL}${this.ENDPOINTS.AUTH_TOKEN}/${this.CLIENT_ID}`;
  },

  /**
   * Get tracking URL for public tracking
   * @param {string} trackingId - Ekart tracking ID
   * @returns {string} - Public tracking URL
   */
  getTrackingUrl(trackingId) {
    return `${this.BASE_URL}/track/${trackingId}`;
  },

  /**
   * Get standard headers for API requests
   * @param {string} token - Access token (optional)
   * @returns {Object} - Headers object
   */
  getHeaders(token = null) {
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': 'RocketryBox-Ekart-Integration/1.0'
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  },

  /**
   * Validate shipment data according to Ekart requirements
   * @param {Object} shipmentData - Shipment data to validate
   * @returns {Object} - Validation result
   */
  validateShipmentData(shipmentData) {
    const errors = [];

    // Required fields validation
    const requiredFields = [
      'seller_name', 'seller_address', 'seller_gst_tin', 'consignee_name',
      'payment_mode', 'category_of_goods', 'products_desc', 'total_amount',
      'taxable_amount', 'commodity_value', 'quantity', 'weight',
      'drop_location', 'pickup_location', 'return_location',
      'length', 'height', 'width', 'order_number', 'invoice_number', 'invoice_date'
    ];

    requiredFields.forEach(field => {
      if (!shipmentData[field]) {
        errors.push(`Missing required field: ${field}`);
      }
    });

    // COD amount validation
    if (shipmentData.payment_mode === this.PAYMENT_MODES.COD) {
      if (!shipmentData.cod_amount) {
        errors.push('COD amount is required for COD shipments');
      } else if (shipmentData.cod_amount > this.MAX_COD_AMOUNT) {
        errors.push(`COD amount cannot exceed ${this.MAX_COD_AMOUNT}`);
      }
    }

    // Weight validation
    if (shipmentData.weight < this.DIMENSION_LIMITS.MIN_WEIGHT) {
      errors.push(`Weight must be at least ${this.DIMENSION_LIMITS.MIN_WEIGHT} grams`);
    }

    // Dimension validation
    ['length', 'width', 'height'].forEach(dim => {
      if (shipmentData[dim] < this.DIMENSION_LIMITS[`MIN_${dim.toUpperCase()}`]) {
        errors.push(`${dim} must be at least ${this.DIMENSION_LIMITS[`MIN_${dim.toUpperCase()}`]} cm`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  },

  /**
   * Transform shipment data to Ekart API format
   * @param {Object} shipmentDetails - Standard shipment details
   * @returns {Object} - Ekart API formatted data
   */
  transformShipmentData(shipmentDetails) {
    return {
      seller_name: shipmentDetails.shipper.name,
      seller_address: shipmentDetails.shipper.address.line1,
      seller_gst_tin: shipmentDetails.shipper.gstNumber || '',
      seller_gst_amount: 0,
      consignee_gst_amount: 0,
      integrated_gst_amount: 0,
      order_number: shipmentDetails.orderNumber || `ORD${Date.now()}`,
      invoice_number: shipmentDetails.invoiceNumber || `INV${Date.now()}`,
      invoice_date: new Date().toISOString().split('T')[0],
      consignee_name: shipmentDetails.consignee.name,
      consignee_gst_tin: shipmentDetails.consignee.gstNumber || '',
      products_desc: shipmentDetails.commodity || 'General Goods',
      payment_mode: shipmentDetails.cod ? this.PAYMENT_MODES.COD : this.PAYMENT_MODES.PREPAID,
      category_of_goods: shipmentDetails.category || 'General',
      hsn_code: shipmentDetails.hsnCode || '',
      total_amount: shipmentDetails.declaredValue || shipmentDetails.codAmount || 100,
      tax_value: 0, // Will be calculated based on total_amount
      taxable_amount: shipmentDetails.declaredValue || shipmentDetails.codAmount || 100,
      commodity_value: String(shipmentDetails.declaredValue || shipmentDetails.codAmount || 100),
      cod_amount: shipmentDetails.cod ? (shipmentDetails.codAmount || 0) : 0,
      quantity: 1,
      weight: Math.round(shipmentDetails.weight * 1000), // Convert kg to grams
      length: Math.round(shipmentDetails.dimensions?.length || 10),
      height: Math.round(shipmentDetails.dimensions?.height || 10),
      width: Math.round(shipmentDetails.dimensions?.width || 10),
      return_reason: shipmentDetails.returnReason || '',
      drop_location: {
        name: shipmentDetails.consignee.name,
        address: shipmentDetails.consignee.address.line1,
        city: shipmentDetails.consignee.address.city,
        state: shipmentDetails.consignee.address.state,
        country: 'India',
        phone: parseInt(shipmentDetails.consignee.phone),
        pin: parseInt(shipmentDetails.consignee.address.pincode)
      },
      pickup_location: {
        name: shipmentDetails.shipper.name,
        address: shipmentDetails.shipper.address.line1,
        city: shipmentDetails.shipper.address.city,
        state: shipmentDetails.shipper.address.state,
        country: 'India',
        phone: parseInt(shipmentDetails.shipper.phone),
        pin: parseInt(shipmentDetails.shipper.address.pincode)
      },
      return_location: {
        name: shipmentDetails.shipper.name,
        address: shipmentDetails.shipper.address.line1,
        city: shipmentDetails.shipper.address.city,
        state: shipmentDetails.shipper.address.state,
        country: 'India',
        phone: parseInt(shipmentDetails.shipper.phone),
        pin: parseInt(shipmentDetails.shipper.address.pincode)
      }
    };
  },

  /**
   * Validate configuration
   * @returns {boolean} - True if valid
   */
  validate() {
    const requiredFields = ['USERNAME', 'PASSWORD', 'CLIENT_ID'];
    const missingFields = requiredFields.filter(field => !this[field]);

    if (missingFields.length > 0) {
      throw new Error(`Missing Ekart credentials: ${missingFields.join(', ')}`);
    }

    return true;
  }
};

// Validate configuration on import
try {
  if (EKART_CONFIG.USERNAME || EKART_CONFIG.PASSWORD) {
    EKART_CONFIG.validate();
    // console.log('✅ Ekart configuration loaded successfully');
    // console.log(`🌐 Base URL: ${EKART_CONFIG.BASE_URL}`);
    // console.log(`🆔 Client ID: ${EKART_CONFIG.CLIENT_ID}`);
  } else {
    console.log('⚠️ Ekart configuration: No credentials provided');
  }
} catch (error) {
  console.warn('⚠️ Ekart configuration warning:', error.message);
}

export default EKART_CONFIG;
