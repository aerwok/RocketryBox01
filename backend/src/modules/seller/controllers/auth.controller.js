import Seller from '../models/seller.model.js';
import { AppError } from '../../../middleware/errorHandler.js';
import { sendEmail } from '../../../utils/email.js';
import { sendSMS } from '../../../utils/sms.js';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { emitEvent, EVENT_TYPES } from '../../../utils/eventEmitter.js';
import VerificationToken from '../models/verificationToken.model.js';

// Helper to generate OTP
function generateOTP(length = 6) {
  return crypto.randomInt(Math.pow(10, length - 1), Math.pow(10, length)).toString();
}

// Login
export const login = async (req, res, next) => {
  try {
    const { emailOrPhone, password, otp, rememberMe } = req.body;
    const seller = await Seller.findOne({
      $or: [
        { email: emailOrPhone.toLowerCase() },
        { phone: emailOrPhone }
      ]
    }).select('+password');
    if (!seller) return next(new AppError('Seller not found', 404));

    // Password login
    if (password) {
      const isMatch = await seller.comparePassword(password);
      if (!isMatch) return next(new AppError('Invalid credentials', 401));
    } else if (otp) {
      // OTP login
      if (!seller.otp || seller.otp.code !== otp || seller.otp.expiresAt < new Date()) {
        return next(new AppError('Invalid or expired OTP', 401));
      }
      seller.otp = undefined;
    } else {
      return next(new AppError('Password or OTP required', 400));
    }

    seller.lastLogin = new Date();
    await seller.save();

    const accessToken = seller.generateAuthToken();
    const refreshToken = seller.generateRefreshToken();
    seller.refreshToken = refreshToken;
    await seller.save();

    // Emit seller login event for real-time dashboard updates
    emitEvent(EVENT_TYPES.SELLER_LOGIN, {
      sellerId: seller._id,
      businessName: seller.businessName,
      email: seller.email
    });

    res.status(200).json({
      success: true,
      data: {
        accessToken,
        refreshToken,
        expiresIn: rememberMe ? 604800 : 86400, // 7d or 1d
        seller: seller.toJSON()
      }
    });
  } catch (error) {
    next(new AppError(error.message, 400));
  }
};

// Send OTP
export const sendOTP = async (req, res, next) => {
  try {
    const { emailOrPhone, purpose } = req.body;
    
    // For registration purpose, we don't require the seller to exist
    if (purpose === 'register') {
      // Check if the email/phone is already registered
      const existingSeller = await Seller.findOne({
        $or: [
          { email: emailOrPhone.includes('@') ? emailOrPhone.toLowerCase() : undefined },
          { phone: !emailOrPhone.includes('@') ? emailOrPhone : undefined }
        ]
      });
      
      if (existingSeller) {
        return next(new AppError('Email or phone already registered', 409));
      }
      
      // Generate OTP
      const otp = generateOTP();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Store OTP in VerificationToken collection
      await VerificationToken.create({
        identifier: emailOrPhone,
        token: otp,
        type: purpose,
        expiresAt
      });
      
      // In development mode, log the OTP
      if (process.env.NODE_ENV === 'development') {
        console.log('\n=========== DEVELOPMENT OTP ===========');
        console.log(`📱 ${emailOrPhone.includes('@') ? 'Email' : 'Phone'}: ${emailOrPhone}`);
        console.log(`🔐 OTP Generated: ${otp}`);
        console.log(`⏱️ Expires in: 10 minutes`);
        console.log('========================================\n');
      }
      
      // Send OTP via email or SMS
      try {
        if (emailOrPhone.includes('@')) {
          await sendEmail({
            to: emailOrPhone,
            subject: 'Your OTP for Rocketry Box Seller Registration',
            text: `Your OTP is ${otp}. It is valid for 10 minutes.`
          });
        } else {
          await sendSMS({
            to: emailOrPhone,
            message: `Your OTP for Rocketry Box Seller Registration is ${otp}. Valid for 10 min.`
          });
        }
      } catch (sendError) {
        console.error('Failed to send OTP:', sendError);
        // Continue in development mode
        if (process.env.NODE_ENV !== 'development') {
          throw sendError;
        }
      }
      
      return res.status(200).json({
        success: true,
        data: {
          message: 'OTP sent successfully',
          otp: process.env.NODE_ENV === 'development' ? otp : undefined,
          expiresIn: 600 // 10 minutes
        }
      });
    }
    
    // For login/reset purposes, find the existing seller
    const seller = await Seller.findOne({
      $or: [
        { email: emailOrPhone.toLowerCase() },
        { phone: emailOrPhone }
      ]
    });
    if (!seller) return next(new AppError('Seller not found', 404));

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    // Store OTP in VerificationToken collection
    await VerificationToken.create({
      identifier: emailOrPhone,
      token: otp,
      type: purpose,
      expiresAt
    });

    // Send OTP via email or SMS
    if (emailOrPhone.includes('@')) {
      await sendEmail({
        to: seller.email,
        subject: 'Your OTP for Rocketry Box Seller Login',
        text: `Your OTP is ${otp}. It is valid for 10 minutes.`
      });
    } else {
      await sendSMS({
        to: seller.phone,
        message: `Your OTP for Rocketry Box Seller Login is ${otp}. Valid for 10 min.`
      });
    }

    res.status(200).json({
      success: true,
      data: {
        message: 'OTP sent successfully',
        otp: process.env.NODE_ENV === 'development' ? otp : undefined,
        expiresIn: 600
      }
    });
  } catch (error) {
    next(new AppError(error.message, 400));
  }
};

// Verify OTP (for password reset or verification)
export const verifyOTP = async (req, res, next) => {
  try {
    const { emailOrPhone, otp, purpose } = req.body;
    
    // Find the verification token
    const verificationToken = await VerificationToken.findOne({
      identifier: emailOrPhone,
      token: otp,
      type: purpose,
      expiresAt: { $gt: new Date() }
    });

    if (!verificationToken) {
      return next(new AppError('Invalid or expired OTP', 401));
    }

    // For registration verification, we don't need to check against a stored user
    if (purpose === 'register') {
      return res.status(200).json({ 
        success: true, 
        data: { 
          message: 'OTP verified successfully',
          verified: true
        } 
      });
    }
    
    // For other purposes, verify the seller exists
    const seller = await Seller.findOne({
      $or: [
        { email: emailOrPhone.toLowerCase() },
        { phone: emailOrPhone }
      ]
    });

    if (!seller) {
      return next(new AppError('Seller not found', 404));
    }

    // Delete the used verification token
    await VerificationToken.deleteOne({ _id: verificationToken._id });

    res.status(200).json({ 
      success: true, 
      data: { 
        message: 'OTP verified successfully' 
      } 
    });
  } catch (error) {
    next(new AppError(error.message, 400));
  }
};

// Reset Password
export const resetPassword = async (req, res, next) => {
  try {
    const { emailOrPhone, otp, newPassword, confirmPassword } = req.body;
    if (newPassword !== confirmPassword) {
      return next(new AppError('Passwords do not match', 400));
    }
    const seller = await Seller.findOne({
      $or: [
        { email: emailOrPhone.toLowerCase() },
        { phone: emailOrPhone }
      ]
    }).select('+password');
    if (!seller) return next(new AppError('Seller not found', 404));
    if (!seller.otp || seller.otp.code !== otp || seller.otp.expiresAt < new Date()) {
      return next(new AppError('Invalid or expired OTP', 401));
    }
    seller.password = newPassword;
    seller.otp = undefined;
    await seller.save();
    res.status(200).json({ success: true, data: { message: 'Password reset successful' } });
  } catch (error) {
    next(new AppError(error.message, 400));
  }
};

// Refresh Token
export const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return next(new AppError('Refresh token required', 400));
    let payload;
    try {
      payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch {
      return next(new AppError('Invalid refresh token', 401));
    }
    const seller = await Seller.findById(payload.id);
    if (!seller || seller.refreshToken !== refreshToken) {
      return next(new AppError('Invalid refresh token', 401));
    }
    const newAccessToken = seller.generateAuthToken();
    const newRefreshToken = seller.generateRefreshToken();
    seller.refreshToken = newRefreshToken;
    await seller.save();
    res.status(200).json({
      success: true,
      data: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        expiresIn: 86400
      }
    });
  } catch (error) {
    next(new AppError(error.message, 400));
  }
};

// Seller Registration
export const register = async (req, res, next) => {
  try {
    console.log('Registration request received:', {
      ...req.body,
      password: '[REDACTED]' // Don't log the actual password
    });

    const { firstName, lastName, email, phone, password, companyName, monthlyShipments, otp } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !phone || !password || !companyName || !monthlyShipments || !otp) {
      console.log('Missing required fields:', {
        hasFirstName: !!firstName,
        hasLastName: !!lastName,
        hasEmail: !!email,
        hasPhone: !!phone,
        hasPassword: !!password,
        hasCompanyName: !!companyName,
        hasMonthlyShipments: !!monthlyShipments,
        hasOTP: !!otp
      });
      return next(new AppError('All required fields must be provided', 400));
    }

    // Check if email or phone is already registered
    console.log('Checking for existing seller:', { email, phone });
    const existingSeller = await Seller.findOne({ 
      $or: [
        { email: email.toLowerCase() }, 
        { phone }
      ]
    });

    if (existingSeller) {
      console.log('Seller already exists:', {
        existingEmail: existingSeller.email,
        existingPhone: existingSeller.phone
      });
      return next(new AppError('Email or phone already registered', 409));
    }

    // Verify OTP
    console.log('Verifying OTP for:', { email, phone });
    const verificationRecord = await VerificationToken.findOne({
      $or: [
        { identifier: email },
        { identifier: phone }
      ],
      token: otp,
      type: 'register',
      expiresAt: { $gt: new Date() }
    });

    if (!verificationRecord) {
      console.log('Invalid or expired OTP');
      return next(new AppError('Invalid or expired OTP', 400));
    }

    console.log('OTP verified successfully');

    // Create seller account with new structure
    console.log('Creating seller account');
    const seller = await Seller.create({
      // Basic Info
      name: `${firstName} ${lastName}`.trim(),
      firstName,
      lastName,
      email: email.toLowerCase(),
      phone,
      password,
      
      // Business Info
      businessName: companyName,
      monthlyShipments,
      
      // Initialize empty structures for later updates
      address: {
        country: 'India'
      },
      documents: {
        gstin: { status: 'pending' },
        pan: { status: 'pending' },
        aadhaar: { status: 'pending' }
      },
      bankDetails: {},
      
      // System status
      status: 'pending'
    });

    console.log('Seller account created:', {
      sellerId: seller._id,
      name: seller.name,
      email: seller.email,
      phone: seller.phone,
      businessName: seller.businessName
    });

    // Delete the used OTP
    await VerificationToken.deleteOne({ _id: verificationRecord._id });
    console.log('OTP record deleted');

    // Generate tokens
    console.log('Generating auth tokens');
    const accessToken = seller.generateAuthToken();
    const refreshToken = seller.generateRefreshToken();
    seller.refreshToken = refreshToken;
    await seller.save();
    console.log('Auth tokens generated and saved');

    // Send welcome email
    try {
      await sendEmail({
        to: seller.email,
        subject: 'Welcome to Rocketry Box',
        text: `Hi ${seller.name},\n\nYour seller account has been created successfully. Please complete your company and bank details to start using our services.\n\nThank you for joining Rocketry Box!`
      });
      console.log('Welcome email sent');
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
      // Don't fail registration if email fails
    }

    // Emit seller registered event
    emitEvent(EVENT_TYPES.SELLER_REGISTERED, {
      sellerId: seller._id,
      businessName: seller.businessName,
      email: seller.email
    });
    console.log('Seller registered event emitted');

    res.status(201).json({
      success: true,
      data: {
        accessToken,
        refreshToken,
        expiresIn: 86400,
        seller: seller.toJSON()
      }
    });
  } catch (error) {
    console.error('Registration error:', {
      error: error.message,
      stack: error.stack,
      code: error.code,
      name: error.name
    });
    next(new AppError(error.message || 'Registration failed', 400));
  }
};

// Logout
export const logout = async (req, res, next) => {
  try {
    // Get the seller ID from the request (set by the auth middleware)
    const sellerId = req.user?.id;
    
    if (!sellerId) {
      return res.status(200).json({
        success: true,
        data: {
          message: 'Logged out successfully'
        }
      });
    }

    // Find the seller and clear their refresh token
    const seller = await Seller.findById(sellerId);
    
    if (seller) {
      seller.refreshToken = undefined;
      await seller.save();
      
      // Emit logout event
      emitEvent(EVENT_TYPES.SELLER_LOGOUT, {
        sellerId: seller._id,
        businessName: seller.businessName,
        email: seller.email
      });
    }

    res.status(200).json({
      success: true,
      data: {
        message: 'Logged out successfully'
      }
    });
  } catch (error) {
    next(new AppError(error.message, 400));
  }
}; 