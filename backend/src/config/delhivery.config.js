/**
 * Delhivery API Configuration
 * Professional Integration with Complete API Suite
 *
 * Features:
 * - B2C and B2B Shipment Services
 * - Real-time Rate Calculation
 * - Waybill Generation (Bulk and Individual)
 * - Shipment Booking and Tracking
 * - Pincode Serviceability Check
 * - NDR (Non-Delivery Report) Management
 * - Pickup Request Creation
 * - Warehouse Management
 * - E-Way Bill Support (for shipments > ₹50,000)
 * - JWT Authentication for B2B
 * - LR/AWB Management
 *
 * Contact: business@delhivery.com | Phone: 1800-209-0032
 */

// Load environment variables from .env file
import 'dotenv/config';

// Environment variables - now properly loaded from .env file
const {
  // B2C Configuration
  DELHIVERY_API_URL,
  DELHIVERY_STAGING_API_URL,
  DELHIVERY_API_TOKEN,
  DELHIVERY_CLIENT_NAME,

  // B2B Configuration
  DELHIVERY_B2B_API_URL,
  DELHIVERY_B2B_STAGING_API_URL,
  DELHIVERY_B2B_USERNAME,
  DELHIVERY_B2B_PASSWORD,

  // General Configuration
  DELHIVERY_API_VERSION,
  NODE_ENV
} = process.env;

// Validate required environment variables
const validateRequiredEnvVars = () => {
  const requiredVars = {
    'DELHIVERY_API_TOKEN': DELHIVERY_API_TOKEN,
    'DELHIVERY_CLIENT_NAME': DELHIVERY_CLIENT_NAME,
    'DELHIVERY_API_URL': DELHIVERY_API_URL,
    'DELHIVERY_STAGING_API_URL': DELHIVERY_STAGING_API_URL
  };

  const missingVars = Object.entries(requiredVars)
    .filter(([key, value]) => !value || value === '')
    .map(([key]) => key);

  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}\nPlease check your .env file.`);
  }
};

// Validate environment variables on import
validateRequiredEnvVars();

// Determine base URLs based on environment
const B2C_BASE_URL = NODE_ENV === 'production' ? DELHIVERY_API_URL : DELHIVERY_STAGING_API_URL;
const B2B_BASE_URL = NODE_ENV === 'production' ? DELHIVERY_B2B_API_URL : DELHIVERY_B2B_STAGING_API_URL;

export const DELHIVERY_CONFIG = {
  // Authentication - B2C (Static Token)
  API_TOKEN: DELHIVERY_API_TOKEN,
  CLIENT_NAME: DELHIVERY_CLIENT_NAME,
  API_VERSION: DELHIVERY_API_VERSION,

  // Authentication - B2B (JWT Token)
  B2B_USERNAME: DELHIVERY_B2B_USERNAME,
  B2B_PASSWORD: DELHIVERY_B2B_PASSWORD,
  B2B_JWT_TOKEN: null, // Will be set after login
  B2B_TOKEN_EXPIRY: null, // 24 hours validity

  // Base URLs
  BASE_URL: B2C_BASE_URL,
  B2B_BASE_URL,
  PRODUCTION_URL: DELHIVERY_API_URL,
  STAGING_URL: DELHIVERY_STAGING_API_URL,
  B2B_PRODUCTION_URL: DELHIVERY_B2B_API_URL,
  B2B_STAGING_URL: DELHIVERY_B2B_STAGING_API_URL,

  // API Endpoints - B2C Services
  ENDPOINTS: {
    // Pincode Serviceability
    PINCODE_SERVICEABILITY: `${B2C_BASE_URL}/c/api/pin-codes/json/`,

    // Waybill Management
    BULK_WAYBILL: `${B2C_BASE_URL}/waybill/api/bulk/json/`,

    // Order/Shipment Management
    CREATE_ORDER: `${B2C_BASE_URL}/api/cmu/create.json`,
    EDIT_ORDER: `${B2C_BASE_URL}/api/p/edit`,
    CANCEL_ORDER: `${B2C_BASE_URL}/api/p/edit`,

    // Tracking
    TRACK_SHIPMENT: `${B2C_BASE_URL}/api/v1/packages/json/`,

    // Rate Calculation
    CALCULATE_RATES: `${B2C_BASE_URL}/api/kinko/v1/invoice/charges/.json`,

    // Shipping Labels
    GENERATE_LABEL: `${B2C_BASE_URL}/api/p/packing_slip`,

    // Pickup Management
    CREATE_PICKUP: `${B2C_BASE_URL}/fm/request/new/`,

    // Warehouse Management
    CREATE_WAREHOUSE: `${B2C_BASE_URL}/api/backend/clientwarehouse/create/`,
    EDIT_WAREHOUSE: `${B2C_BASE_URL}/api/backend/clientwarehouse/edit/`,

    // NDR Management
    NDR_ACTION: `${B2C_BASE_URL}/api/p/update`,
    NDR_STATUS: `${B2C_BASE_URL}/api/cmu/get_bulk_upl/`,

    // Transit Time (if available)
    TRANSIT_TIME: `${B2C_BASE_URL}/api/kinko/v1/transit-time/`
  },

  // B2B API Endpoints
  B2B_ENDPOINTS: {
    // Authentication
    LOGIN: `${B2B_BASE_URL}/login`,
    LOGOUT: `${B2B_BASE_URL}/logout`,

    // Serviceability & Rates
    SERVICEABILITY: `${B2B_BASE_URL}/serviceability`,
    EXPECTED_TAT: `${B2B_BASE_URL}/expected_tat`,
    FREIGHT_ESTIMATOR: `${B2B_BASE_URL}/freight_estimator`,
    FREIGHT_CHARGES: `${B2B_BASE_URL}/freight_charges`,

    // Warehouse Management
    CREATE_WAREHOUSE: `${B2B_BASE_URL}/warehouse`,
    UPDATE_WAREHOUSE: `${B2B_BASE_URL}/warehouse/update`,

    // Shipment Management
    CREATE_SHIPMENT: `${B2B_BASE_URL}/manifest`,
    SHIPMENT_STATUS: `${B2B_BASE_URL}/manifest/status`,
    UPDATE_SHIPMENT: `${B2B_BASE_URL}/lrn/update`,
    UPDATE_SHIPMENT_STATUS: `${B2B_BASE_URL}/lrn/update/status`,
    CANCEL_SHIPMENT: `${B2B_BASE_URL}/lrn/cancel`,

    // Tracking
    TRACK_SHIPMENT: `${B2B_BASE_URL}/track`,

    // Appointment & Pickup
    BOOK_APPOINTMENT: `${B2B_BASE_URL}/appointment`,
    CREATE_PICKUP_REQUEST: `${B2B_BASE_URL}/pickup`,
    CANCEL_PICKUP_REQUEST: `${B2B_BASE_URL}/pickup/cancel`,

    // Document Generation
    GENERATE_SHIPPING_LABEL: `${B2B_BASE_URL}/shipping_label`,
    GENERATE_LR_COPY: `${B2B_BASE_URL}/lr_copy`,
    GENERATE_DOCUMENT: `${B2B_BASE_URL}/generate`,
    GENERATE_DOCUMENT_STATUS: `${B2B_BASE_URL}/generate/status`,
    DOWNLOAD_DOCUMENT: `${B2B_BASE_URL}/download`
  },

  // Service Types
  SERVICE_TYPES: {
    SURFACE: {
      code: 'Surface',
      name: 'Surface Delivery',
      description: 'Standard surface delivery - cost effective',
      deliveryTime: '4-7 days',
      codSupported: true,
      maxCodAmount: 50000,
      maxWeight: 50,
      minWeight: 0.1
    },
    EXPRESS: {
      code: 'Express',
      name: 'Express Delivery',
      description: 'Fast express delivery - time critical',
      deliveryTime: '1-3 days',
      codSupported: true,
      maxCodAmount: 50000,
      maxWeight: 50,
      minWeight: 0.1
    }
  },

  // Payment Modes
  PAYMENT_MODES: {
    PREPAID: 'Pre-paid',
    COD: 'COD',
    PICKUP: 'Pickup',      // For reverse shipments
    REPLACEMENT: 'REPL'    // For replacement shipments
  },

  // B2B Payment Modes
  B2B_PAYMENT_MODES: {
    COD: 'cod',
    PREPAID: 'prepaid'
  },

  // B2B Freight Modes
  B2B_FREIGHT_MODES: {
    FOP: 'fop', // Freight on pickup
    FOD: 'fod'  // Freight on delivery
  },

  // Package Types
  PACKAGE_TYPES: {
    FORWARD: 'forward',
    REVERSE: 'reverse',
    REPLACEMENT: 'replacement'
  },

  // Weight and Dimension Limits
  LIMITS: {
    // Weight limits (in kg)
    MIN_WEIGHT: 0.1,
    MAX_WEIGHT: 50,

    // Dimension limits (in cm)
    MAX_LENGTH: 120,
    MAX_WIDTH: 80,
    MAX_HEIGHT: 80,
    MAX_DIMENSION_SUM: 280,

    // COD limits (in INR)
    MAX_COD_AMOUNT: 50000,
    MIN_COD_AMOUNT: 1,

    // Waybill bulk limits
    MAX_WAYBILL_COUNT: 10000,
    MAX_WAYBILL_5MIN: 50000,

    // B2B Limits
    B2B_MAX_LRN_PER_REQUEST: 25,
    B2B_MAX_DOCUMENT_SIZE: 20 // MB
  },

  // Rate calculation parameters
  RATE_PARAMS: {
    BILLING_MODES: {
      EXPRESS: 'E',
      SURFACE: 'S'
    },
    SHIPMENT_STATUS: {
      DELIVERED: 'Delivered',
      RTO: 'RTO',
      DTO: 'DTO'
    }
  },

  // B2B Shipment Statuses
  B2B_SHIPMENT_STATUSES: {
    MANIFESTED: 'MANIFESTED',
    PICKED_UP: 'PICKED_UP',
    LEFT_ORIGIN: 'LEFT_ORIGIN',
    REACH_DESTINATION: 'REACH_DESTINATION',
    UNDEL_REATTEMPT: 'UNDEL_REATTEMPT',
    PART_DEL: 'PART_DEL',
    OFD: 'OFD',
    DELIVERED: 'DELIVERED',
    RETURNED_INTRANSIT: 'RETURNED_INTRANSIT',
    RECEIVED_AT_RETURN_CENTER: 'RECEIVED_AT_RETURN_CENTER',
    RETURN_OFD: 'RETURN_OFD',
    RETURN_DELIVERED: 'RETURN_DELIVERED',
    NOT_PICKED: 'NOT_PICKED',
    LOST: 'LOST'
  },

  // NDR Action Codes
  NDR_ACTIONS: {
    RE_ATTEMPT: 'RE-ATTEMPT',
    PICKUP_RESCHEDULE: 'PICKUP_RESCHEDULE'
  },

  // NDR Status Codes for Re-attempt
  NDR_REATTEMPT_CODES: [
    'EOD-74', 'EOD-15', 'EOD-104', 'EOD-43',
    'EOD-86', 'EOD-11', 'EOD-69', 'EOD-6'
  ],

  // NDR Status Codes for Pickup Reschedule
  NDR_RESCHEDULE_CODES: ['EOD-777', 'EOD-21'],

  // Request Configuration
  REQUEST_CONFIG: {
    TIMEOUT: 30000, // 30 seconds
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000, // 1 second

    // Rate limiting - B2C
    RATE_LIMIT: {
      TRACKING: {
        requests: 750,
        window: 300000 // 5 minutes
      },
      RATE_CALCULATION: {
        requests: 40,
        window: 60000 // 1 minute
      }
    },

    // Rate limiting - B2B
    B2B_RATE_LIMIT: {
      LOGIN: {
        requests: 100,
        window: 300000 // 5 minutes
      },
      MANIFEST: {
        requests: 500,
        window: 300000 // 5 minutes
      },
      TRACKING: {
        requests: 500,
        window: 300000 // 5 minutes
      },
      SERVICEABILITY: {
        requests: 500,
        window: 300000 // 5 minutes
      },
      FREIGHT_ESTIMATOR: {
        requests: 100,
        window: 300000 // 5 minutes
      },
      WAREHOUSE: {
        requests: 300,
        window: 300000 // 5 minutes
      },
      PICKUP: {
        requests: 300,
        window: 300000 // 5 minutes
      },
      DOCUMENT_GENERATION: {
        requests: 500,
        window: 300000 // 5 minutes
      }
    }
  },

  // Default Headers - B2C
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': `Token ${DELHIVERY_API_TOKEN}`,
    'User-Agent': 'RocketryBox-Delhivery-Integration/1.0'
  },

  // Default Headers - B2B (will be updated with JWT token)
  B2B_DEFAULT_HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'User-Agent': 'RocketryBox-Delhivery-B2B-Integration/1.0'
  },

  // Error Codes
  ERROR_CODES: {
    AUTHENTICATION_FAILED: 'AUTH_FAILED',
    INVALID_PINCODE: 'INVALID_PINCODE',
    SERVICE_NOT_AVAILABLE: 'SERVICE_NA',
    WEIGHT_EXCEEDED: 'WEIGHT_EXCEEDED',
    DIMENSION_EXCEEDED: 'DIMENSION_EXCEEDED',
    COD_LIMIT_EXCEEDED: 'COD_EXCEEDED',
    WAYBILL_EXHAUSTED: 'WAYBILL_EXHAUSTED',
    RATE_LIMIT_EXCEEDED: 'RATE_LIMIT',
    NETWORK_ERROR: 'NETWORK_ERROR',
    VALIDATION_ERROR: 'VALIDATION_ERROR',

    // B2B Specific
    B2B_LOGIN_FAILED: 'B2B_LOGIN_FAILED',
    B2B_TOKEN_EXPIRED: 'B2B_TOKEN_EXPIRED',
    B2B_WAREHOUSE_NOT_FOUND: 'B2B_WAREHOUSE_NOT_FOUND',
    B2B_LRN_NOT_FOUND: 'B2B_LRN_NOT_FOUND',
    B2B_INVALID_DOCUMENT_TYPE: 'B2B_INVALID_DOCUMENT_TYPE'
  },

  // Country Codes (for international shipments)
  COUNTRY_CODES: {
    INDIA: 'IN',
    BANGLADESH: 'BD'
  },

  // E-Way Bill Configuration
  EWAY_BILL: {
    MANDATORY_AMOUNT: 50000, // INR - E-way bill mandatory above this amount
    REQUIRED_FIELDS: ['ewaybill_number', 'invoice_reference', 'invoice_date']
  },

  // Manifest Configuration
  MANIFEST: {
    PICKUP_TYPES: ['scheduled', 'on_demand'],
    TIME_SLOTS: [
      { slot: '09:00-12:00', code: '1' },
      { slot: '12:00-15:00', code: '2' },
      { slot: '15:00-18:00', code: '3' },
      { slot: '18:00-21:00', code: '4' }
    ]
  },

  // B2B Document Types
  B2B_DOCUMENT_TYPES: {
    SHIPPING_LABEL: 'shipping_label',
    LR_COPY: 'lr_copy',
    INVOICE_COPY: 'INVOICE_COPY'
  },

  // B2B Label Sizes
  B2B_LABEL_SIZES: {
    SMALL: 'sm',      // 4" x 2"
    MEDIUM: 'md',     // 4" x 2.5"
    A4: 'a4',         // 11.7" x 8.3"
    STANDARD: 'std'   // 3" x 2"
  },

  // B2B LR Copy Types
  B2B_LR_COPY_TYPES: [
    'SHIPPER COPY',
    'ORIGIN ACCOUNTS COPY',
    'REGULATORY COPY',
    'LM POD',
    'RECIPIENT COPY'
  ],

  // Fragile Shipment Configuration
  FRAGILE_SHIPMENT: {
    KEY: 'fragile_shipment',
    VALUE: true,
    EXTRA_CHARGE_PERCENTAGE: 10 // 10% extra charge for fragile items
  },

  // B2B Time Slots for Appointments
  B2B_TIME_SLOTS: [
    '00:00', '00:30', '01:00', '01:30', '02:00', '02:30',
    '03:00', '03:30', '04:00', '04:30', '05:00', '05:30',
    '06:00', '06:30', '07:00', '07:30', '08:00', '08:30',
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
    '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
    '18:00', '18:30', '19:00', '19:30', '20:00', '20:30',
    '21:00', '21:30', '22:00', '22:30', '23:00', '23:30'
  ]
};

// Enhanced validation function
export const validateDelhiveryConfig = () => {
  // Log configuration status
  console.log('🚚 Delhivery Configuration Status:');

  // Check B2C Configuration
  const b2cConfigured = DELHIVERY_API_TOKEN && DELHIVERY_CLIENT_NAME;
  console.log(`   B2C Service: ${b2cConfigured ? '✅ Configured' : '❌ Missing credentials'}`);

  // Check B2B Configuration
  const b2bConfigured = DELHIVERY_B2B_USERNAME && DELHIVERY_B2B_PASSWORD;
  console.log(`   B2B Service: ${b2bConfigured ? '✅ Configured' : '⚠️ Optional - Missing credentials'}`);

  // Check Environment
  console.log(`   Environment: ${NODE_ENV || 'development'}`);
  console.log(`   Base URL: ${B2C_BASE_URL}`);

  if (b2bConfigured) {
    console.log(`   B2B Base URL: ${B2B_BASE_URL}`);
  }

  // Return configuration status
  return {
    b2cReady: b2cConfigured,
    b2bReady: b2bConfigured,
    environment: NODE_ENV || 'development',
    baseUrl: B2C_BASE_URL,
    b2bBaseUrl: B2B_BASE_URL
  };
};

// Export configuration and validation
export default {
  ...DELHIVERY_CONFIG,
  validateConfig: validateDelhiveryConfig,

  // Additional helper methods
  isB2CReady: () => !!(DELHIVERY_API_TOKEN && DELHIVERY_CLIENT_NAME),
  isB2BReady: () => !!(DELHIVERY_B2B_USERNAME && DELHIVERY_B2B_PASSWORD),
  getEnvironment: () => NODE_ENV || 'development',
  getBaseUrl: () => B2C_BASE_URL,
  getB2BBaseUrl: () => B2B_BASE_URL
};
