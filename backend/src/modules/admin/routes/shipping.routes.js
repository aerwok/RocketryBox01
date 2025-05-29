import express from 'express';
import { authenticateToken } from '../../../middleware/auth.js';
import { authorizeRoles } from '../../../middleware/roleAuth.js';
import { BLUEDART_CONFIG } from '../../../config/bluedart.config.js';
import { logger } from '../../../utils/logger.js';
import axios from 'axios';

const router = express.Router();

/**
 * Get shipping integration status
 * Professional endpoint to monitor BlueDart API connectivity
 */
router.get('/status', authenticateToken, authorizeRoles(['admin', 'super_admin']), async (req, res) => {
  try {
    const status = {
      timestamp: new Date().toISOString(),
      bluedart: {
        configured: false,
        authenticated: false,
        apiEndpoint: BLUEDART_CONFIG.API_URL,
        authEndpoint: BLUEDART_CONFIG.AUTH_URL,
        lastChecked: new Date().toISOString(),
        error: null,
        details: {}
      }
    };

    // Check if BlueDart is configured
    if (BLUEDART_CONFIG.LICENSE_KEY && BLUEDART_CONFIG.USER) {
      status.bluedart.configured = true;
      status.bluedart.details = {
        hasLicenseKey: !!BLUEDART_CONFIG.LICENSE_KEY,
        hasUser: !!BLUEDART_CONFIG.USER,
        apiType: BLUEDART_CONFIG.API_TYPE,
        version: BLUEDART_CONFIG.VERSION
      };

      // Test authentication
      try {
        const authResponse = await axios.post(BLUEDART_CONFIG.AUTH_URL, {
          profile: {
            Api_type: BLUEDART_CONFIG.API_TYPE,
            LicenceKey: BLUEDART_CONFIG.LICENSE_KEY,
            LoginID: BLUEDART_CONFIG.USER
          }
        }, {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          timeout: 10000 // 10 second timeout for status check
        });

        if (authResponse.data && (authResponse.data.token || authResponse.data.JWTToken || authResponse.data.access_token)) {
          status.bluedart.authenticated = true;
          status.bluedart.details.authResponseStatus = authResponse.status;
        } else {
          status.bluedart.error = 'Authentication successful but no token received';
          status.bluedart.details.authResponse = authResponse.data;
        }
      } catch (authError) {
        status.bluedart.error = authError.message;
        status.bluedart.details.authError = {
          status: authError.response?.status,
          statusText: authError.response?.statusText,
          data: authError.response?.data
        };
      }
    } else {
      status.bluedart.error = 'BlueDart API credentials not configured';
      status.bluedart.details = {
        hasLicenseKey: !!BLUEDART_CONFIG.LICENSE_KEY,
        hasUser: !!BLUEDART_CONFIG.USER,
        missingCredentials: [
          !BLUEDART_CONFIG.LICENSE_KEY && 'BLUEDART_LICENSE_KEY',
          !BLUEDART_CONFIG.USER && 'BLUEDART_USER'
        ].filter(Boolean)
      };
    }

    res.json({
      success: true,
      data: status
    });

  } catch (error) {
    logger.error('Error checking shipping status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check shipping integration status',
      details: error.message
    });
  }
});

/**
 * Test BlueDart rate calculation
 * Professional endpoint to test BlueDart API functionality
 */
router.post('/test/bluedart/rates', authenticateToken, authorizeRoles(['admin', 'super_admin']), async (req, res) => {
  try {
    const { pickupPincode = '110001', deliveryPincode = '400001', weight = 1 } = req.body;

    // Import BlueDart utility
    const { calculateRate } = await import('../../../utils/bluedart.js');

    const packageDetails = {
      weight: weight,
      dimensions: { length: 10, width: 10, height: 10 },
      serviceType: 'express',
      declaredValue: 100
    };

    const deliveryDetails = {
      pickupPincode,
      deliveryPincode
    };

    const result = await calculateRate(packageDetails, deliveryDetails, {});

    res.json({
      success: true,
      message: 'BlueDart rate calculation test successful',
      data: {
        testParameters: { pickupPincode, deliveryPincode, weight },
        result
      }
    });

  } catch (error) {
    logger.error('BlueDart rate calculation test failed:', error);
    res.status(400).json({
      success: false,
      error: 'BlueDart rate calculation test failed',
      details: {
        message: error.message,
        code: error.code,
        partner: error.partner,
        timestamp: error.timestamp,
        details: error.details
      }
    });
  }
});

/**
 * Get BlueDart configuration (sanitized)
 * Professional endpoint to view current BlueDart configuration
 */
router.get('/config/bluedart', authenticateToken, authorizeRoles(['admin', 'super_admin']), (req, res) => {
  try {
    const config = {
      apiUrl: BLUEDART_CONFIG.API_URL,
      authUrl: BLUEDART_CONFIG.AUTH_URL,
      apiType: BLUEDART_CONFIG.API_TYPE,
      version: BLUEDART_CONFIG.VERSION,
      hasLicenseKey: !!BLUEDART_CONFIG.LICENSE_KEY,
      hasUser: !!BLUEDART_CONFIG.USER,
      hasConsumerKey: !!BLUEDART_CONFIG.CONSUMER_KEY,
      hasConsumerSecret: !!BLUEDART_CONFIG.CONSUMER_SECRET,
      requestTimeout: BLUEDART_CONFIG.REQUEST_TIMEOUT,
      tokenExpiry: BLUEDART_CONFIG.TOKEN_EXPIRY,
      // Don't expose actual credentials
      userMasked: BLUEDART_CONFIG.USER ? BLUEDART_CONFIG.USER.substring(0, 3) + '***' : null,
      licenseKeyMasked: BLUEDART_CONFIG.LICENSE_KEY ? '***' + BLUEDART_CONFIG.LICENSE_KEY.slice(-4) : null
    };

    res.json({
      success: true,
      data: config
    });

  } catch (error) {
    logger.error('Error getting BlueDart configuration:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get BlueDart configuration',
      details: error.message
    });
  }
});

export default router; 