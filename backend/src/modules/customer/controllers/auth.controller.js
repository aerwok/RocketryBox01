import Customer from '../models/customer.model.js';
import { AppError } from '../../../middleware/errorHandler.js';
import { sendEmail } from '../../../utils/email.js';
import { sendSMS, SMS_TEMPLATES } from '../../../utils/sms.js';
import { generateOTP } from '../../../utils/otp.js';

// Register new customer
export const register = async (req, res, next) => {
  try {
    const { name, email, phone, password, confirmPassword, acceptTerms } = req.body;

    // Validate terms acceptance
    if (!acceptTerms) {
      return next(new AppError('You must accept the terms and conditions', 400));
    }

    // Check if passwords match
    if (password !== confirmPassword) {
      return next(new AppError('Passwords do not match', 400));
    }

    // Check if customer already exists
    const existingCustomer = await Customer.findOne({
      $or: [{ email }, { phone }]
    });

    if (existingCustomer) {
      return next(new AppError('Email or phone number already registered', 400));
    }

    // Create new customer
    const customer = await Customer.create({
      name,
      email,
      phone,
      password
    });

    // Generate OTP for email verification
    const emailOTP = generateOTP();
    customer.emailVerificationOTP = emailOTP;
    customer.emailVerificationOTPExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes
    await customer.save();

    // Send verification email
    await sendEmail({
      to: email,
      subject: 'Verify Your Email - RocketryBox',
      text: `Your verification code is: ${emailOTP}. This code will expire in 10 minutes.`
    });

    // Generate OTP for phone verification
    const phoneOTP = generateOTP();
    customer.phoneVerificationOTP = phoneOTP;
    customer.phoneVerificationOTPExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes
    await customer.save();

    // Send verification SMS
    await sendSMS({
      to: phone,
      templateId: SMS_TEMPLATES.OTP.templateId,
      variables: {
        otp: phoneOTP,
        expiry: '10 minutes'
      }
    });

    // Generate tokens
    const accessToken = customer.generateAuthToken();
    const refreshToken = customer.generateRefreshToken();

    res.status(201).json({
      success: true,
      data: {
        message: 'Registration successful. Please verify your email and phone number.',
        user: customer,
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    next(new AppError(error.message, 400));
  }
};

// Login customer
export const login = async (req, res, next) => {
  try {
    const { phoneOrEmail, password, otp, rememberMe } = req.body;

    // Find customer by email or phone
    const customer = await Customer.findOne({
      $or: [
        { email: phoneOrEmail },
        { phone: phoneOrEmail }
      ]
    }).select('+password');

    if (!customer) {
      return next(new AppError('Invalid credentials', 401));
    }

    // Check if password is correct
    const isPasswordCorrect = await customer.comparePassword(password);
    if (!isPasswordCorrect) {
      return next(new AppError('Invalid credentials', 401));
    }

    // If OTP is required (for password reset)
    if (otp) {
      if (!customer.resetPasswordOTP || customer.resetPasswordOTP !== otp) {
        return next(new AppError('Invalid OTP', 400));
      }
      if (Date.now() > customer.resetPasswordOTPExpiry) {
        return next(new AppError('OTP has expired', 400));
      }
      // Clear OTP after successful verification
      customer.resetPasswordOTP = undefined;
      customer.resetPasswordOTPExpiry = undefined;
    }

    // Update last login
    customer.lastLogin = Date.now();
    await customer.save();

    // Generate tokens
    const accessToken = customer.generateAuthToken();
    const refreshToken = customer.generateRefreshToken();

    res.status(200).json({
      success: true,
      data: {
        accessToken,
        refreshToken,
        expiresIn: rememberMe ? '30d' : '1d',
        user: customer
      }
    });
  } catch (error) {
    next(new AppError(error.message, 400));
  }
};

// Send OTP
export const sendOTP = async (req, res, next) => {
  try {
    const { phoneOrEmail, purpose } = req.body;

    // Find customer by email or phone
    const customer = await Customer.findOne({
      $or: [
        { email: phoneOrEmail },
        { phone: phoneOrEmail }
      ]
    });

    if (!customer) {
      return next(new AppError('No account found with this email or phone number', 404));
    }

    const otp = generateOTP();
    const expiry = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Set OTP based on purpose
    switch (purpose) {
      case 'login':
        customer.resetPasswordOTP = otp;
        customer.resetPasswordOTPExpiry = expiry;
        break;
      case 'reset':
        customer.resetPasswordOTP = otp;
        customer.resetPasswordOTPExpiry = expiry;
        break;
      case 'verify':
        if (phoneOrEmail.includes('@')) {
          customer.emailVerificationOTP = otp;
          customer.emailVerificationOTPExpiry = expiry;
        } else {
          customer.phoneVerificationOTP = otp;
          customer.phoneVerificationOTPExpiry = expiry;
        }
        break;
      default:
        return next(new AppError('Invalid purpose', 400));
    }

    await customer.save();

    // Send OTP via email or SMS
    if (phoneOrEmail.includes('@')) {
      await sendEmail({
        to: phoneOrEmail,
        subject: 'Your OTP - RocketryBox',
        text: `Your OTP is: ${otp}. This code will expire in 10 minutes.`
      });
    } else {
      await sendSMS({
        to: phoneOrEmail,
        templateId: SMS_TEMPLATES.OTP.templateId,
        variables: {
          otp,
          expiry: '10 minutes'
        }
      });
    }

    res.status(200).json({
      success: true,
      data: {
        message: 'OTP sent successfully',
        otp: process.env.NODE_ENV === 'development' ? otp : undefined,
        expiresIn: 600 // 10 minutes in seconds
      }
    });
  } catch (error) {
    next(new AppError(error.message, 400));
  }
}; 