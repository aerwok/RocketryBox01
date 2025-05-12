import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { logger } from './logger.js';

// Create SES client
const sesClient = new SESClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

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
      Source: `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_FROM_ADDRESS}>`,
      Destination: {
        ToAddresses: Array.isArray(to) ? to : [to]
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

    const command = new SendEmailCommand(params);
    const result = await sesClient.send(command);
    
    logger.info('Email sent successfully', { 
      messageId: result.MessageId,
      recipient: to
    });

    return {
      success: true,
      messageId: result.MessageId,
      message: 'Email sent successfully'
    };
  } catch (error) {
    logger.error('Error sending email', { 
      error: error.message,
      recipient: to,
      subject
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