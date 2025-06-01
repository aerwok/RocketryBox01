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
    
    // Transit Time API - OFFICIAL ENDPOINT from Transit-Time_3.yaml
    TRANSIT_TIME: process.env.BLUEDART_TRANSIT_TIME_URL || 'https://apigateway.bluedart.com/in/transportation/transit/v1/GetDomesticTransitTimeForPinCodeandProduct',
    
    // Alternative for sandbox testing
    TRANSIT_TIME_SANDBOX: 'https://apigateway-sandbox.bluedart.com/in/transportation/transit/v1/GetDomesticTransitTimeForPinCodeandProduct',
    
    // Product and Services
    PRODUCT_PICKUP_DETAIL: process.env.BLUEDART_PRODUCT_URL || 'https://apigateway.bluedart.com/in/transportation/pickup/v1',
    
    // Tracking
    TRACKING: process.env.BLUEDART_TRACKING_URL || 'https://apigateway.bluedart.com/in/transportation/track/v1',
    
    // Alternative Instructions
    ALT_INSTRUCTION: process.env.BLUEDART_ALT_INSTRUCTION_URL || 'https://apigateway.bluedart.com/in/transportation/instruction/v1',
    
    // Cancel Pickup
    CANCEL_PICKUP: process.env.BLUEDART_CANCEL_PICKUP_URL || 'https://apigateway.bluedart.com/in/transportation/pickup/cancel/v1',
    
    // Waybill Generation
    WAYBILL: process.env.BLUEDART_WAYBILL_URL || 'https://apigateway.bluedart.com/in/transportation/waybill/v1',
    
    // E-Way Bill Generation (Production)
    GENERATE_EWAY_BILL: process.env.BLUEDART_EWAY_BILL_URL || 'https://apigateway.bluedart.com/in/transportation/waybill/v1/GenerateWayBill',
    
    // E-Way Bill Generation (Sandbox)
    GENERATE_EWAY_BILL_SANDBOX: 'https://apigateway-sandbox.bluedart.com/in/transportation/waybill/v1/GenerateWayBill',
    
    // Master Download
    MASTER_DOWNLOAD: process.env.BLUEDART_MASTER_URL || 'https://apigateway.bluedart.com/in/transportation/master/v1',
    
    // Location Finder
    LOCATION_FINDER: process.env.BLUEDART_LOCATION_URL || 'https://apigateway.bluedart.com/in/transportation/location/v1'
  },
  
  // Legacy endpoint mappings for backward compatibility
  AUTH_URL: process.env.BLUEDART_AUTH_URL || 'https://apigateway.bluedart.com/in/transportation/token/v1/login',
  PICKUP_URL: process.env.BLUEDART_PICKUP_URL || 'https://apigateway.bluedart.com/in/transportation/pickup/v1',
  RATE_FINDER_URL: process.env.BLUEDART_TRANSIT_TIME_URL || 'https://apigateway.bluedart.com/in/transportation/transit/v1/GetDomesticTransitTimeForPinCodeandProduct',
  BOOKING_URL: process.env.BLUEDART_WAYBILL_URL || 'https://apigateway.bluedart.com/in/transportation/waybill/v1',
  TRACKING_URL: process.env.BLUEDART_TRACKING_URL || 'https://apigateway.bluedart.com/in/transportation/track/v1',
  
  // API Credentials
  USER: process.env.BLUEDART_USER || 'PAT94651',
  LICENSE_KEY: process.env.BLUEDART_LICENSE_KEY || 'trjierrkjkspo8hkzqv1mjfoimnksito',
  CONSUMER_KEY: process.env.BLUEDART_CONSUMER_KEY || 'dyfUBL4U0YN8l7iDwwyWrcVBxXYD9s8o',
  CONSUMER_SECRET: process.env.BLUEDART_CONSUMER_SECRET || 'AsUfm29jvf7GrhBw',
  VERSION: process.env.BLUEDART_VERSION || '1.3',
  API_TYPE: process.env.BLUEDART_API_TYPE || 'S',
  
  // Service Configuration
  DEFAULT_PRODUCT_CODE: 'A',
  DEFAULT_SUB_PRODUCT_CODE: 'P',
  
  // Rate Configuration
  DIMENSIONAL_FACTOR: 5000, // (L*W*H)/5000 for volumetric weight calculation
  BASE_RATE: 50,
  WEIGHT_RATE: 20,
  COD_CHARGE: 35,
  
  // Timeouts
  REQUEST_TIMEOUT: 30000, // 30 seconds
  TOKEN_EXPIRY: 3600000, // 1 hour in milliseconds
  
  // Environment specific settings
  IS_DEVELOPMENT: process.env.NODE_ENV === 'development',
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
  
  // Official API Status (Updated based on Transit-Time_3.yaml specification)
  API_STATUS: {
    AUTHENTICATION: 'AVAILABLE', // Blue Dart Authentication API
    PICKUP: 'AVAILABLE', // BD-Product and Sub-Product Pickup Detail
    TRACKING: 'AVAILABLE', // BD-Tracking Of Shipment
    TRANSIT_TIME: 'AVAILABLE', // BD-Transit Time - OFFICIAL API from Transit-Time_3.yaml
    ALT_INSTRUCTION: 'AVAILABLE', // BD-Alt-Instruction
    CANCEL_PICKUP: 'AVAILABLE', // BD-Cancel Pickup Registration
    WAYBILL: 'AVAILABLE', // BD-Waybill
    GENERATE_EWAY_BILL: 'AVAILABLE', // BD-E-Way Bill Generation
    MASTER_DOWNLOAD: 'AVAILABLE', // BD-Master Download
    LOCATION_FINDER: 'AVAILABLE' // BD-Location Finder
  },
  
  // API Descriptions
  API_DESCRIPTIONS: {
    AUTHENTICATION: 'Blue Dart Authentication API',
    PICKUP: 'BD-Product and Sub-Product Pickup Detail',
    TRACKING: 'BD-Tracking Of Shipment',
    TRANSIT_TIME: 'BD-Transit Time (Official GetDomesticTransitTimeForPinCodeandProduct)',
    ALT_INSTRUCTION: 'BD-Alt-Instruction',
    CANCEL_PICKUP: 'BD-Cancel Pickup Registration',
    WAYBILL: 'BD-Waybill',
    GENERATE_EWAY_BILL: 'BD-E-Way Bill Generation',
    MASTER_DOWNLOAD: 'BD-Master Download',
    LOCATION_FINDER: 'BD-Location Finder'
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
    console.log('✅ Blue Dart configuration loaded successfully');
    console.log(`📋 User: ${BLUEDART_CONFIG.USER}`);
    console.log(`🔑 License Key: ${BLUEDART_CONFIG.LICENSE_KEY.substring(0, 8)}...`);
    console.log(`🔐 Consumer Key: ${BLUEDART_CONFIG.CONSUMER_KEY.substring(0, 8)}...`);
    console.log('');
    console.log('📡 Official BlueDart APIs Available:');
    Object.entries(BLUEDART_CONFIG.API_DESCRIPTIONS).forEach(([key, description]) => {
      const status = BLUEDART_CONFIG.API_STATUS[key];
      console.log(`  ${status === 'AVAILABLE' ? '✅' : '❌'} ${description}`);
    });
    console.log('🎯 Using Official Transit Time API from Transit-Time_3.yaml specification');
  } else {
    console.log('⚠️ Blue Dart configuration: Using placeholder credentials');
  }
} catch (error) {
  console.warn('⚠️ Blue Dart configuration warning:', error.message);
}

export default BLUEDART_CONFIG; 