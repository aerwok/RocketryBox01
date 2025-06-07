// OTP Routes - Email-based OTP verification for Customer/Seller Registration
// This will work seamlessly once AWS SES production access is approved

import { SendEmailCommand } from '@aws-sdk/client-ses';
import express from 'express';
import { AWS_CONFIG, sesClient } from '../config/aws.js';
import VerificationToken from '../modules/seller/models/verificationToken.model.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

/**
 * Generate OTP for customer registration
 *
 * Route: POST /otp/send-customer-registration
 * Body: { email, name?, phone? }
 *
 * Sends OTP to customer email for registration verification
 */
router.post('/send-customer-registration', async (req, res) => {
  try {
    const { email, name, phone } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }

    // Validate email format
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a valid email address'
      });
    }

    // Check for recent OTP to prevent rapid requests
    const recentOTP = await VerificationToken.findOne({
      identifier: email.toLowerCase(),
      type: 'register',
      createdAt: { $gt: new Date(Date.now() - 2 * 60 * 1000) } // Within last 2 minutes
    });

    if (recentOTP) {
      return res.status(429).json({
        success: false,
        error: 'Please wait 2 minutes before requesting another OTP'
      });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Delete any existing OTP for this email and type
    await VerificationToken.deleteMany({
      identifier: email.toLowerCase(),
      type: 'register'
    });

    // Store OTP in database
    await VerificationToken.create({
      identifier: email.toLowerCase(),
      token: otp,
      type: 'register',
      expiresAt
    });

    logger.info(`Customer registration OTP generated for: ${email}`);

    // Send OTP email
    const result = await sendOTPEmail(email, otp, name || 'Customer', 'customer registration');

    res.json({
      success: true,
      message: 'OTP sent successfully',
      data: {
        email,
        expiresAt: expiresAt.toISOString(),
        messageId: result.MessageId,
        // Include OTP in development for testing
        ...(process.env.NODE_ENV === 'development' && { otp })
      }
    });

  } catch (error) {
    logger.error('Error sending customer registration OTP:', {
      error: error.message,
      stack: error.stack,
      email: req.body?.email
    });

    res.status(500).json({
      success: false,
      error: 'Failed to send OTP',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * Generate OTP for seller registration
 *
 * DISABLED: This route is now handled by /seller/auth/otp/send
 * to prevent duplicate OTP emails
 *
 * Route: POST /otp/send-seller-registration (DISABLED)
 * Body: { email, businessName?, contactName?, phone? }
 *
 * Sends OTP to seller email for registration verification
 */
router.post('/send-seller-registration-DISABLED', async (req, res) => {
  return res.status(410).json({
    success: false,
    error: 'This endpoint is disabled. Please use /api/v2/seller/auth/otp/send instead'
  });
});

/**
 * Verify OTP
 *
 * Route: POST /otp/verify
 * Body: { email, otp }
 *
 * Verifies the OTP and returns success if valid
 */
router.post('/verify', async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        error: 'Email and OTP are required'
      });
    }

    // Validate email format
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a valid email address'
      });
    }

    // Find the verification token in database
    const verificationToken = await VerificationToken.findOne({
      identifier: email.toLowerCase(),
      token: otp.trim(),
      expiresAt: { $gt: new Date() }
    });

    if (!verificationToken) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired OTP'
      });
    }

    // Check if this is for registration (which doesn't need user verification)
    if (verificationToken.type === 'register') {
      // Delete the used OTP
      await VerificationToken.deleteOne({ _id: verificationToken._id });

      logger.info(`Customer registration OTP verified for: ${email}`);

      return res.status(200).json({
        success: true,
        data: {
          message: 'Email verified successfully',
          verified: true,
          email: email.toLowerCase(),
          type: verificationToken.type,
          verifiedAt: new Date().toISOString()
        }
      });
    }

    // For other types, we might need additional verification logic here
    // Delete the used verification token
    await VerificationToken.deleteOne({ _id: verificationToken._id });

    logger.info(`OTP verified successfully for: ${email}, type: ${verificationToken.type}`);

    res.status(200).json({
      success: true,
      data: {
        message: 'OTP verified successfully',
        verified: true,
        email: email.toLowerCase(),
        type: verificationToken.type,
        verifiedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Error verifying OTP:', {
      error: error.message,
      stack: error.stack,
      email: req.body?.email
    });

    res.status(500).json({
      success: false,
      error: 'Failed to verify OTP'
    });
  }
});

/**
 * Helper function to send OTP emails
 */
async function sendOTPEmail(email, otp, recipientName, registrationType) {
  const subject = `Your RocketryBox OTP - ${otp}`;

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1>🚀 RocketryBox</h1>
        <p>Email Verification Required</p>
      </div>

      <div style="background: #ffffff; padding: 40px; border: 1px solid #e0e0e0;">
        <h2>Hello ${recipientName}!</h2>
        <p>Thank you for starting your ${registrationType} with RocketryBox. To complete the process, please verify your email address using the OTP below:</p>

        <div style="background: #f8f9fa; border: 2px dashed #667eea; padding: 30px; text-align: center; margin: 30px 0; border-radius: 8px;">
          <p style="margin: 0; font-size: 18px; color: #666;">Your OTP Code:</p>
          <div style="font-size: 36px; font-weight: bold; color: #667eea; letter-spacing: 8px; margin: 10px 0;">${otp}</div>
          <p style="margin: 0; font-size: 14px; color: #666;">Valid for 10 minutes</p>
        </div>

        <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h4 style="margin: 0 0 10px 0;">🔒 Security Information:</h4>
          <ul style="margin: 0; padding-left: 20px;">
            <li>This OTP will expire in 10 minutes</li>
            <li>Do not share this code with anyone</li>
            <li>If you didn't request this, please ignore this email</li>
            <li>Each OTP can only be used once</li>
          </ul>
        </div>

        <p>If you have any questions, please contact our support team.</p>
        <p>Best regards,<br>The RocketryBox Team</p>
      </div>

      <div style="background: #f8f9fa; padding: 20px; text-align: center; font-size: 14px; color: #666; border-radius: 0 0 8px 8px;">
        <p>This email was sent from RocketryBox Registration System</p>
        <p>Email: ${email} | Type: ${registrationType}</p>
      </div>
    </div>
  `;

  const textContent = `
Hello ${recipientName}!

Thank you for starting your ${registrationType} with RocketryBox. To complete the process, please verify your email address using the OTP below:

Your OTP Code: ${otp}
Valid for: 10 minutes

Security Information:
- This OTP will expire in 10 minutes
- Do not share this code with anyone
- If you didn't request this, please ignore this email
- Each OTP can only be used once

If you have any questions, please contact our support team.

Best regards,
The RocketryBox Team

---
This email was sent from RocketryBox Registration System
Email: ${email} | Type: ${registrationType}
  `;

  const command = new SendEmailCommand({
    Source: AWS_CONFIG.sesSenderEmail,
    Destination: { ToAddresses: [email] },
    Message: {
      Subject: { Data: subject, Charset: 'UTF-8' },
      Body: {
        Html: { Data: htmlContent, Charset: 'UTF-8' },
        Text: { Data: textContent, Charset: 'UTF-8' }
      }
    }
  });

  return await sesClient.send(command);
}

/**
 * USAGE EXAMPLES (After SES Production Access):
 *
 * 1. Customer Registration:
 *    POST /api/v2/otp/send-customer-registration
 *    { "email": "customer@gmail.com", "name": "John Doe" }
 *
 * 2. Seller Registration (Use /api/v2/seller/auth/otp/send instead):
 *    This endpoint is disabled to prevent conflicts
 *
 * 3. Verify OTP:
 *    POST /api/v2/otp/verify
 *    { "email": "customer@gmail.com", "otp": "123456" }
 *
 * IMPORTANT:
 * - All OTP data is now stored securely in MongoDB database
 * - No in-memory storage used - fully database-driven
 * - Works with ANY email address once SES production access is approved
 * - No need to manually verify each customer/seller email
 * - Perfect for scalable registration system
 * - Automatic cleanup of expired OTPs via MongoDB TTL indexes
 */

export default router;
