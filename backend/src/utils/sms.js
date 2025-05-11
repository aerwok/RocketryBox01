import axios from 'axios';
import { logger } from './logger.js';

const dltClient = axios.create({
  baseURL: process.env.DLT_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${process.env.DLT_API_KEY}`
  }
});

export const sendSMS = async ({ to, templateId, variables }) => {
  try {
    const params = {
      sender_id: process.env.DLT_SENDER_ID,
      template_id: templateId || process.env.DLT_TEMPLATE_ID,
      pe_id: process.env.DLT_PE_ID,
      mobile_number: to,
      variables: variables || {}
    };

    const response = await dltClient.post('/send', params);
    
    logger.info('SMS sent successfully', { 
      messageId: response.data.message_id,
      mobileNumber: to
    });
    
    return response.data;
  } catch (error) {
    logger.error('Error sending SMS', { 
      error: error.response?.data || error.message,
      mobileNumber: to
    });
    throw new Error('Failed to send SMS');
  }
};

// Predefined SMS templates
export const SMS_TEMPLATES = {
  OTP: {
    templateId: 'otp_template_id',
    variables: {
      otp: '{{otp}}',
      expiry: '{{expiry}}'
    }
  },
  TRACKING_UPDATE: {
    templateId: 'tracking_update_template_id',
    variables: {
      trackingId: '{{trackingId}}',
      status: '{{status}}',
      location: '{{location}}'
    }
  },
  PARTNER_STATUS: {
    templateId: 'partner_status_template_id',
    variables: {
      status: '{{status}}',
      companyName: '{{companyName}}'
    }
  }
}; 