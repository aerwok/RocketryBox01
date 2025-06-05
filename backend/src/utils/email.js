import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { logger } from './logger.js';

// Debug log all environment variables (without sensitive values)
logger.info('Checking AWS environment variables:', {
  AWS_REGION: process.env.AWS_REGION ? 'Set' : 'Not set',
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID ? 'Set' : 'Not set',
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY ? 'Set' : 'Not set',
  SES_FROM_EMAIL: process.env.SES_FROM_EMAIL ? 'Set' : 'Not set',
  NODE_ENV: process.env.NODE_ENV
});

// Create SES client
let sesClient = null;

const initializeSESClient = () => {
  try {
    // Check if required environment variables are present
    if (!process.env.AWS_REGION || !process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY || !process.env.SES_FROM_EMAIL) {
      // Don't log error - AWS email is optional
      logger.info('AWS Email service not configured (optional). Email functionality will be disabled.');
      return false;
    }

    // Validate AWS credentials format
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID.trim();
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY.trim();
    const region = process.env.AWS_REGION.trim();

    // Validate region format
    if (!region.match(/^[a-z]{2}-[a-z]+-\d{1}$/)) {
      logger.error('Invalid AWS Region format. Expected format: xx-xxxxx-x (e.g., ap-south-1)');
      return false;
    }

    // Log detailed region information
    logger.info('AWS Region details:', {
      region,
      format: region.match(/^[a-z]{2}-[a-z]+-\d{1}$/) ? 'Valid' : 'Invalid',
      expectedFormat: 'xx-xxxxx-x (e.g., ap-south-1)'
    });

    if (!accessKeyId.match(/^[A-Z0-9]{20}$/)) {
      logger.error('Invalid AWS Access Key ID format');
      return false;
    }

    if (!secretAccessKey.match(/^[A-Za-z0-9/+=]{40}$/)) {
      logger.error('Invalid AWS Secret Access Key format');
      return false;
    }

    // Log AWS region and credentials presence (without sensitive data)
    logger.info('Initializing AWS SES client with:', {
      region,
      hasAccessKey: true,
      hasSecretKey: true,
      fromEmail: process.env.SES_FROM_EMAIL.trim()
    });

    // Create SES client with explicit credentials and additional configuration
    sesClient = new SESClient({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey
      },
      maxAttempts: 3,
      endpoint: `https://email.${region}.amazonaws.com`,
      forcePathStyle: false,
      signatureVersion: 'v4'
    });

    logger.info('AWS SES client initialized successfully');
    return true;
  } catch (error) {
    logger.error('Failed to initialize AWS SES client:', {
      error: error.message,
      stack: error.stack,
      region: process.env.AWS_REGION
    });
    sesClient = null;
    return false;
  }
};

// Initialize the client immediately
initializeSESClient();

/**
 * Send email using AWS SES
 * @param {Object} params
 * @param {string|string[]} params.to - Email recipient(s)
 * @param {string} params.subject - Email subject
 * @param {string} [params.text] - Plain text content
 * @param {string} [params.html] - HTML content
 * @param {string} [params.templateId] - Template ID for template-based emails
 * @param {Object} [params.variables] - Variables for template-based emails
 */
export const sendEmail = async ({ to, subject, text, html, templateId, variables }) => {
  try {
    // Try to reinitialize the client if it's not available
    if (!sesClient && !initializeSESClient()) {
      console.error('AWS SES client initialization failed');
      throw new Error('AWS SES client not initialized. Please check your AWS credentials.');
    }

    // Validate email parameters
    if (!to || !subject) {
      console.error('Missing required email parameters:', { to, subject });
      throw new Error('Recipient email and subject are required');
    }

    // Prepare content based on template or direct content
    let finalHtml = html;
    let finalText = text;

    if (templateId && EMAIL_TEMPLATES[templateId]) {
      const template = EMAIL_TEMPLATES[templateId];
      finalHtml = template.html;
      finalText = template.text;

      // Replace variables in template
      if (variables) {
        Object.keys(variables).forEach(key => {
          const value = variables[key];
          finalHtml = finalHtml.replace(new RegExp(`{{${key}}}`, 'g'), value);
          finalText = finalText.replace(new RegExp(`{{${key}}}`, 'g'), value);
        });
      }
    }

    const params = {
      Source: process.env.SES_FROM_EMAIL.trim(),
      Destination: {
        ToAddresses: Array.isArray(to) ? to.map(email => email.trim()) : [to.trim()]
      },
      Message: {
        Subject: {
          Data: subject,
          Charset: 'UTF-8'
        },
        Body: {
          ...(finalHtml && {
            Html: {
              Data: finalHtml,
              Charset: 'UTF-8'
            }
          }),
          ...(finalText && {
            Text: {
              Data: finalText,
              Charset: 'UTF-8'
            }
          })
        }
      }
    };

    console.log('Email parameters:', {
      from: process.env.SES_FROM_EMAIL,
      to,
      subject,
      hasHtml: !!finalHtml,
      hasText: !!finalText,
      templateId,
      variables
    });

    const command = new SendEmailCommand(params);
    const result = await sesClient.send(command);

    console.log('Email sent successfully:', {
      messageId: result.MessageId,
      recipient: to
    });

    return {
      success: true,
      messageId: result.MessageId,
      message: 'Email sent successfully'
    };
  } catch (error) {
    console.error('Detailed email error:', {
      error: error.message,
      code: error.code,
      requestId: error.$metadata?.requestId,
      cfId: error.$metadata?.cfId,
      extendedRequestId: error.$metadata?.extendedRequestId,
      attempts: error.$metadata?.attempts,
      totalRetryDelay: error.$metadata?.totalRetryDelay,
      recipient: to,
      subject,
      from: process.env.SES_FROM_EMAIL,
      sesClient: !!sesClient
    });
    throw new Error(`Failed to send email: ${error.message}`);
  }
};

// Predefined email templates
export const EMAIL_TEMPLATES = {
  OTP: {
    subject: 'Your OTP for RocketryBox',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Your OTP for RocketryBox</h2>
        <p>Your OTP is: <strong>{{otp}}</strong></p>
        <p>This OTP will expire in {{expiry}}.</p>
        <p>Please do not share this OTP with anyone.</p>
        <hr>
        <p style="color: #666; font-size: 12px;">
          This is an automated message, please do not reply to this email.
        </p>
      </div>
    `,
    text: `Your OTP for RocketryBox is {{otp}}. Valid for {{expiry}}. Do not share this OTP with anyone.`
  },
  ORDER_CONFIRMATION: {
    subject: 'Order Confirmation - RocketryBox',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Order Confirmation</h2>
        <p>Thank you for your order!</p>
        <p>Order ID: <strong>{{orderId}}</strong></p>
        <p>Tracking ID: <strong>{{trackingId}}</strong></p>
        <p>You can track your shipment using the tracking ID above.</p>
        <hr>
        <p style="color: #666; font-size: 12px;">
          This is an automated message, please do not reply to this email.
        </p>
      </div>
    `,
    text: `Thank you for your order! Order ID: {{orderId}}, Tracking ID: {{trackingId}}. Track your shipment using the tracking ID.`
  },
  DELIVERY_CONFIRMATION: {
    subject: 'Order Delivered - RocketryBox',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Order Delivered</h2>
        <p>Your order has been delivered!</p>
        <p>Order ID: <strong>{{orderId}}</strong></p>
        <p>Thank you for using RocketryBox!</p>
        <hr>
        <p style="color: #666; font-size: 12px;">
          This is an automated message, please do not reply to this email.
        </p>
      </div>
    `,
    text: `Your order has been delivered! Order ID: {{orderId}}. Thank you for using RocketryBox!`
  },
  PAYMENT_CONFIRMATION: {
    subject: 'Payment Confirmation - RocketryBox',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Payment Confirmation</h2>
        <p>Payment received successfully!</p>
        <p>Order ID: <strong>{{orderId}}</strong></p>
        <p>Amount: <strong>₹{{amount}}</strong></p>
        <p>Thank you for using RocketryBox!</p>
        <hr>
        <p style="color: #666; font-size: 12px;">
          This is an automated message, please do not reply to this email.
        </p>
      </div>
    `,
    text: `Payment of ₹{{amount}} received for order #{{orderId}}. Thank you for using RocketryBox!`
  }
};
