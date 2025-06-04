import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Blue Dart API Configuration
 * Based on Official BlueDart API Documentation (Transit-Time_3.yaml)
 */
export const BLUEDART_CONFIG = {
  // BlueDart API Gateway Base URLs
  API_URL: process.env.BLUEDART_API_URL || 'https://apigateway.bluedart.com',
  SANDBOX_URL: 'https://apigateway-sandbox.bluedart.com',

  // Official BlueDart API Endpoints - Updated according to Transit-Time_3.yaml
  ENDPOINTS: {
    // Authentication (Official JWT Generation API)
    AUTHENTICATION: process.env.BLUEDART_AUTH_URL || 'https://apigateway.bluedart.com/in/transportation/token/v1/login',

    // Product and Services (Updated to working RegisterPickup endpoint)
    PRODUCT_PICKUP_DETAIL: process.env.BLUEDART_PRODUCT_URL || 'https://apigateway.bluedart.com/in/transportation/pickup/v1/RegisterPickup',

    // Transit Time (Updated to working endpoint found during testing)
    TRANSIT_TIME: process.env.BLUEDART_TRANSIT_TIME_URL || 'https://apigateway.bluedart.com/in/transportation/transit/v1/GetDomesticTransitTimeForPinCodeandProduct',

    // Tracking
    TRACKING: process.env.BLUEDART_TRACKING_URL || 'https://apigateway.bluedart.com/in/transportation/tracking/v1',

    // Alternative Instructions
    ALT_INSTRUCTION: process.env.BLUEDART_ALT_INSTRUCTION_URL || 'https://apigateway.bluedart.com/in/transportation/instruction/v1',

    // Cancel Pickup (Updated to match official documentation)
    CANCEL_PICKUP: process.env.BLUEDART_CANCEL_PICKUP_URL || 'https://apigateway.bluedart.com/in/transportation/cancel-pickup/v1/CancelPickup',

    // Waybill Generation
    WAYBILL: process.env.BLUEDART_WAYBILL_URL || 'https://apigateway.bluedart.com/in/transportation/waybill/v1',

    // E-Way Bill Generation (Production)
    GENERATE_EWAY_BILL: process.env.BLUEDART_EWAY_BILL_URL || 'https://apigateway.bluedart.com/in/transportation/waybill/v1/GenerateWayBill',

    // Import Multiple Waybills
    IMPORT_WAYBILL_DATA: process.env.BLUEDART_IMPORT_WAYBILL_URL || 'https://apigateway.bluedart.com/in/transportation/waybill/v1/ImportData',

    // Cancel Waybill
    CANCEL_WAYBILL: process.env.BLUEDART_CANCEL_WAYBILL_URL || 'https://apigateway.bluedart.com/in/transportation/waybill/v1/CancelWaybill',

    // Update E-Waybill
    UPDATE_EWAY_BILL: process.env.BLUEDART_UPDATE_EWAY_BILL_URL || 'https://apigateway.bluedart.com/in/transportation/waybill/v1/UpdateEwayBill',

    // E-Way Bill Generation (Sandbox)
    GENERATE_EWAY_BILL_SANDBOX: 'https://apigateway-sandbox.bluedart.com/in/transportation/waybill/v1/GenerateWayBill',

    // Master Download
    MASTER_DOWNLOAD: process.env.BLUEDART_MASTER_URL || 'https://apigateway.bluedart.com/in/transportation/master/v1',

    // Location Finder (Updated to match official documentation)
    LOCATION_FINDER_BASE: process.env.BLUEDART_LOCATION_URL || 'https://apigateway.bluedart.com/in/transportation/finder/v1',
    LOCATION_FINDER_PINCODE: process.env.BLUEDART_LOCATION_URL || 'https://apigateway.bluedart.com/in/transportation/finder/v1/GetServicesforPincode',
    LOCATION_FINDER_PRODUCT: process.env.BLUEDART_LOCATION_URL || 'https://apigateway.bluedart.com/in/transportation/finder/v1/GetServicesforProduct',
    LOCATION_FINDER_PINCODE_PRODUCT: process.env.BLUEDART_LOCATION_URL || 'https://apigateway.bluedart.com/in/transportation/finder/v1/GetServicesforPincodeAndProduct',

    // Legacy Location Finder endpoint for backward compatibility
    LOCATION_FINDER: process.env.BLUEDART_LOCATION_URL || 'https://apigateway.bluedart.com/in/transportation/finder/v1/GetServicesforPincode'
  },

  // Legacy endpoint mappings for backward compatibility
  AUTH_URL: process.env.BLUEDART_AUTH_URL || 'https://apigateway.bluedart.com/in/transportation/token/v1/login',
  PICKUP_URL: process.env.BLUEDART_PICKUP_URL || 'https://apigateway.bluedart.com/in/transportation/pickup/v1',
  BOOKING_URL: process.env.BLUEDART_WAYBILL_URL || 'https://apigateway.bluedart.com/in/transportation/waybill/v1',
  TRACKING_URL: process.env.BLUEDART_TRACKING_URL || 'https://apigateway.bluedart.com/in/transportation/tracking/v1',

  // API Credentials
  USER: process.env.BLUEDART_USER || 'BGE60970',  // Updated to BGE60970 - has better API access than PAT94651
  LICENSE_KEY: process.env.BLUEDART_LICENSE_KEY || 'trjierrkjkspo8hkzqv1mjfoimnksito',
  CONSUMER_KEY: process.env.BLUEDART_CONSUMER_KEY || 'dyfUBL4U0YN8l7iDwwyWrcVBxXYD9s8o',
  CONSUMER_SECRET: process.env.BLUEDART_CONSUMER_SECRET || 'AsUfm29jvf7GrhBw',
  VERSION: process.env.BLUEDART_VERSION || '1.3',
  API_TYPE: process.env.BLUEDART_API_TYPE || 'S',

  // Service Configuration
  DEFAULT_PRODUCT_CODE: 'A',
  DEFAULT_SUB_PRODUCT_CODE: 'P',
  DEFAULT_AREA_CODE: 'BGE', // Added default area code based on account

  // Timeouts
  REQUEST_TIMEOUT: 30000, // 30 seconds
  TOKEN_EXPIRY: 3600000, // 1 hour in milliseconds

  // Environment specific settings
  IS_DEVELOPMENT: process.env.NODE_ENV === 'development',
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
  USE_SANDBOX: process.env.BLUEDART_USE_SANDBOX === 'true', // Added sandbox mode toggle

  // Official API Status (Updated based on API specifications)
  API_STATUS: {
    AUTHENTICATION: 'AVAILABLE', // Blue Dart Authentication API
    PICKUP: 'AVAILABLE', // BD-Product and Sub-Product Pickup Detail
    TRACKING: 'AVAILABLE', // BD-Tracking Of Shipment
    ALT_INSTRUCTION: 'AVAILABLE', // BD-Alt-Instruction
    CANCEL_PICKUP: 'AVAILABLE', // BD-Cancel Pickup Registration
    WAYBILL: 'AVAILABLE', // BD-Waybill
    GENERATE_EWAY_BILL: 'AVAILABLE', // BD-E-Way Bill Generation
    IMPORT_WAYBILL_DATA: 'AVAILABLE', // BD-Import Multiple Waybills
    CANCEL_WAYBILL: 'AVAILABLE', // BD-Cancel Waybill
    UPDATE_EWAY_BILL: 'AVAILABLE', // BD-Update E-Waybill
    MASTER_DOWNLOAD: 'AVAILABLE', // BD-Master Download
    LOCATION_FINDER: 'AVAILABLE', // BD-Location Finder
    TRANSIT_TIME: 'AVAILABLE' // BD-Transit Time
  },

  // API Descriptions
  API_DESCRIPTIONS: {
    AUTHENTICATION: 'Blue Dart Authentication API',
    PICKUP: 'BD-Product and Sub-Product Pickup Detail',
    TRACKING: 'BD-Tracking Of Shipment',
    ALT_INSTRUCTION: 'BD-Alt-Instruction',
    CANCEL_PICKUP: 'BD-Cancel Pickup Registration',
    WAYBILL: 'BD-Waybill',
    GENERATE_EWAY_BILL: 'BD-E-Way Bill Generation',
    IMPORT_WAYBILL_DATA: 'BD-Import Multiple Waybills',
    CANCEL_WAYBILL: 'BD-Cancel Waybill',
    UPDATE_EWAY_BILL: 'BD-Update E-Waybill',
    MASTER_DOWNLOAD: 'BD-Master Download',
    LOCATION_FINDER: 'BD-Location Finder',
    TRANSIT_TIME: 'BD-Transit Time'
  },

  // Validation
  validate() {
    const requiredFields = ['LICENSE_KEY', 'USER'];
    const missingFields = requiredFields.filter(field => !this[field]);

    if (missingFields.length > 0) {
      throw new Error(`Missing Blue Dart configuration: ${missingFields.join(', ')}`);
    }

    return true;
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
    return `https://www.bluedart.com/tracking/${awb}`;
  }
};

// Validate configuration on import
try {
  if (BLUEDART_CONFIG.USER && BLUEDART_CONFIG.LICENSE_KEY) {
    BLUEDART_CONFIG.validate();
    // console.log('✅ Blue Dart configuration loaded successfully');
    // console.log(`📋 User: ${BLUEDART_CONFIG.USER}`);
    // console.log(`🔑 License Key: ${BLUEDART_CONFIG.LICENSE_KEY.substring(0, 8)}...`);
    // console.log(`🔐 Consumer Key: ${BLUEDART_CONFIG.CONSUMER_KEY.substring(0, 8)}...`);
    // console.log('');
    // console.log('📡 Official BlueDart APIs Available:');
    // Object.entries(BLUEDART_CONFIG.API_DESCRIPTIONS).forEach(([key, description]) => {
    //   const status = BLUEDART_CONFIG.API_STATUS[key];
    //   console.log(`  ${status === 'AVAILABLE' ? '✅' : '❌'} ${description}`);
    // });
    // console.log('🎯 BlueDart APIs ready for integration');
  } else {
    console.log('⚠️ Blue Dart configuration: Using placeholder credentials');
  }
} catch (error) {
  console.warn('⚠️ Blue Dart configuration warning:', error.message);
}

export default BLUEDART_CONFIG;
