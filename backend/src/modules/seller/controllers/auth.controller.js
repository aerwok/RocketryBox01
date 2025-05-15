import Seller from '../models/seller.model.js';
import { AppError } from '../../../middleware/errorHandler.js';
import { sendEmail } from '../../../utils/email.js';
import { sendSMS } from '../../../utils/sms.js';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { emitEvent, EVENT_TYPES } from '../../../utils/eventEmitter.js';

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
    const seller = await Seller.findOne({
      $or: [
        { email: emailOrPhone.toLowerCase() },
        { phone: emailOrPhone }
      ]
    });
    if (!seller) return next(new AppError('Seller not found', 404));

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min
    seller.otp = { code: otp, expiresAt };
    await seller.save();

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
    const { emailOrPhone, otp } = req.body;
    const seller = await Seller.findOne({
      $or: [
        { email: emailOrPhone.toLowerCase() },
        { phone: emailOrPhone }
      ]
    });
    if (!seller) return next(new AppError('Seller not found', 404));
    if (!seller.otp || seller.otp.code !== otp || seller.otp.expiresAt < new Date()) {
      return next(new AppError('Invalid or expired OTP', 401));
    }
    seller.otp = undefined;
    await seller.save();
    res.status(200).json({ success: true, data: { message: 'OTP verified successfully' } });
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
    const { name, email, phone, password, businessName, companyCategory, brandName, website, supportContact, supportEmail, operationsEmail, financeEmail, gstin, documents } = req.body;
    if (!name || !email || !phone || !password || !businessName) {
      return next(new AppError('All required fields must be provided', 400));
    }
    const existingSeller = await Seller.findOne({ $or: [ { email: email.toLowerCase() }, { phone } ] });
    if (existingSeller) {
      return next(new AppError('Email or phone already registered', 409));
    }
    const seller = await Seller.create({
      name,
      email: email.toLowerCase(),
      phone,
      password,
      businessName,
      companyCategory,
      brandName,
      website,
      supportContact,
      supportEmail,
      operationsEmail,
      financeEmail,
      gstin,
      documents,
      status: 'pending'
    });

    // Emit seller registered event for real-time dashboard updates
    emitEvent(EVENT_TYPES.SELLER_REGISTERED, {
      sellerId: seller._id,
      businessName: seller.businessName,
      email: seller.email
    });

    await sendEmail({
      to: seller.email,
      subject: 'Welcome to Rocketry Box',
      text: `Hi ${seller.name},\n\nYour seller account has been created.\n\nThank you for joining Rocketry Box!`
    });
    const accessToken = seller.generateAuthToken();
    const refreshToken = seller.generateRefreshToken();
    seller.refreshToken = refreshToken;
    await seller.save();
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
    next(new AppError(error.message, 400));
  }
}; 