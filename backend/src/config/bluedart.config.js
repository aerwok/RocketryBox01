import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Blue Dart API Configuration
 */
export const BLUEDART_CONFIG = {
  // API Endpoint
  API_URL: process.env.BLUEDART_API_URL || 'https://netconnect.bluedart.com/Ver1.8/API',
  
  // API Credentials
  USER: process.env.BLUEDART_USER || '',
  LICENSE_KEY: process.env.BLUEDART_LICENSE_KEY || '',
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

// Validate configuration on import
try {
  BLUEDART_CONFIG.validate();
  console.log('✅ Blue Dart configuration loaded successfully');
} catch (error) {
  console.warn('⚠️ Blue Dart configuration warning:', error.message);
}

export default BLUEDART_CONFIG; 