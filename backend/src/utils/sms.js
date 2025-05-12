import axios from 'axios';
import { logger } from './logger.js';

// Create Fast2SMS client
const fast2smsClient = axios.create({
  baseURL: 'https://www.fast2sms.com/dev/bulkV2',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': process.env.FAST2SMS_API_KEY
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

    const params = {
      route: 'v3', // Using route v3 for better delivery
      sender_id: process.env.FAST2SMS_SENDER_ID,
      message: finalMessage,
      language: 'english',
      numbers: phoneNumber,
      flash: 0 // Normal SMS (not flash)
    };

    const response = await fast2smsClient.post('', params);
    
    if (response.data.return === true) {
      logger.info('SMS sent successfully', { 
        requestId: response.data.request_id,
        mobileNumber: phoneNumber
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
      mobileNumber: to
    });
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