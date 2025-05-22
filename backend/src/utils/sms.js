import axios from 'axios';
import { logger } from './logger.js';

// Create Fast2SMS client
const fast2smsClient = axios.create({
  baseURL: 'https://www.fast2sms.com/dev/bulkV2',
  headers: {
    'content-type': 'application/json',
    'cache-control': 'no-cache'
  }
});

/**
 * Send SMS using Fast2SMS
 * @param {Object} params
 * @param {string} params.to - Phone number to send SMS to
 * @param {string} params.message - Message text (for non-template messages)
 * @param {string} [params.templateId] - Template ID for template-based messages
 * @param {Object} [params.variables] - Variables for template-based messages
 */
export const sendSMS = async ({ to, message, templateId, variables }) => {
  try {
    // In development mode, bypass actual SMS sending
    if (process.env.NODE_ENV === 'development') {
      logger.info('Development mode: Bypassing actual SMS sending', {
        to: '***' + to.toString().slice(-4),
        message: message || (templateId ? `Template: ${templateId}` : 'No message provided'),
        variables
      });
      
      return {
        success: true,
        requestId: 'dev-mode-' + Date.now(),
        message: 'SMS sending bypassed in development mode'
      };
    }
    
    // Format phone number (remove +91 if present)
    const phoneNumber = to.toString().replace('+91', '');

    // Prepare message based on template or direct message
    let finalMessage = message;
    if (templateId && SMS_TEMPLATES[templateId]) {
      finalMessage = SMS_TEMPLATES[templateId].message;
      // Replace variables in template
      if (variables) {
        Object.keys(variables).forEach(key => {
          finalMessage = finalMessage.replace(`{{${key}}}`, variables[key]);
        });
      }
    }

    // New Fast2SMS API format
    const requestBody = {
      route: "dlt", // Use DLT route for transactional messages
      sender_id: "TXTIND", // Default sender ID
      message: finalMessage,
      variables_values: variables ? Object.values(variables).join("|") : "",
      language: "english",
      numbers: phoneNumber
    };

    // Log request details for debugging
    logger.info('Sending SMS request', {
      url: fast2smsClient.defaults.baseURL,
      headers: {
        'content-type': 'application/json',
        'Authorization': process.env.FAST2SMS_API_KEY ? 'Present' : 'Missing'
      },
      body: { ...requestBody, numbers: '***' + phoneNumber.slice(-4) }
    });

    // Make the request with updated headers and body
    const response = await axios({
      method: 'POST',
      url: fast2smsClient.defaults.baseURL,
      headers: {
        'content-type': 'application/json',
        'Authorization': process.env.FAST2SMS_API_KEY
      },
      data: requestBody
    });
    
    if (response.data.return === true) {
      logger.info('SMS sent successfully', { 
        requestId: response.data.request_id,
        mobileNumber: '***' + phoneNumber.slice(-4)
      });
      return {
        success: true,
        requestId: response.data.request_id,
        message: 'SMS sent successfully'
      };
    } else {
      throw new Error(response.data.message || 'Failed to send SMS');
    }
  } catch (error) {
    logger.error('Error sending SMS', { 
      error: error.response?.data || error.message,
      mobileNumber: '***' + to.toString().slice(-4),
      stack: error.stack,
      headers: {
        'content-type': 'application/json',
        'Authorization': process.env.FAST2SMS_API_KEY ? 'Present' : 'Missing'
      }
    });
    
    // For development mode, bypass SMS sending error
    if (process.env.NODE_ENV === 'development') {
      logger.info('Development mode: Bypassing SMS sending failure');
      return {
        success: true,
        requestId: 'dev-mode-' + Date.now(),
        message: 'SMS sending bypassed in development mode'
      };
    }
    
    throw new Error('Failed to send SMS: ' + (error.response?.data?.message || error.message));
  }
};

// Predefined SMS templates
export const SMS_TEMPLATES = {
  OTP: {
    message: 'Your OTP for RocketryBox is {{otp}}. Valid for {{expiry}}. Do not share this OTP with anyone.'
  },
  TRACKING_UPDATE: {
    message: 'Your shipment {{trackingId}} has been {{status}} at {{location}}. Track your order on RocketryBox.'
  },
  ORDER_CONFIRMATION: {
    message: 'Your order #{{orderId}} has been confirmed. Track your shipment with tracking ID {{trackingId}} on RocketryBox.'
  },
  DELIVERY_CONFIRMATION: {
    message: 'Your order #{{orderId}} has been delivered. Thank you for using RocketryBox!'
  },
  PAYMENT_CONFIRMATION: {
    message: 'Payment of ₹{{amount}} received for order #{{orderId}}. Thank you for using RocketryBox!'
  }
}; 