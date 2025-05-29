import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Blue Dart API Configuration
 */
export const BLUEDART_CONFIG = {
  // BlueDart API Gateway Endpoints (Based on Official User Guide)
  API_URL: process.env.BLUEDART_API_URL || 'https://apigateway.bluedart.com',
  AUTH_URL: process.env.BLUEDART_AUTH_URL || 'https://apigateway.bluedart.com/in/transportation/authenticate/v1',
  PICKUP_URL: process.env.BLUEDART_PICKUP_URL || 'https://apigateway.bluedart.com/in/transportation/pickup/v1',
  RATE_FINDER_URL: process.env.BLUEDART_RATE_FINDER_URL || 'https://apigateway.bluedart.com/in/transportation/rates/v1',
  BOOKING_URL: process.env.BLUEDART_BOOKING_URL || 'https://apigateway.bluedart.com/in/transportation/waybill/v1',
  TRACKING_URL: process.env.BLUEDART_TRACKING_URL || 'https://apigateway.bluedart.com/in/transportation/track/v1',
  
  // API Credentials
  USER: process.env.BLUEDART_USER || 'BGE60970',
  LICENSE_KEY: process.env.BLUEDART_LICENSE_KEY || '',
  CONSUMER_KEY: process.env.BLUEDART_CONSUMER_KEY || process.env.BLUEDART_USER || '',
  CONSUMER_SECRET: process.env.BLUEDART_CONSUMER_SECRET ||  '',
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

// Validate configuration on import (only check if credentials are provided)
try {
  if (BLUEDART_CONFIG.USER && BLUEDART_CONFIG.LICENSE_KEY) {
    BLUEDART_CONFIG.validate();
    console.log('✅ Blue Dart configuration loaded successfully');
  } else {
    console.log('⚠️ Blue Dart configuration: Using placeholder credentials');
  }
} catch (error) {
  console.warn('⚠️ Blue Dart configuration warning:', error.message);
}

export default BLUEDART_CONFIG; 