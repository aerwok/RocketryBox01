import Customer from '../models/customer.model.js';
import { AppError } from '../../../middleware/errorHandler.js';
import { sendEmail } from '../../../utils/email.js';
import { sendSMS, SMS_TEMPLATES } from '../../../utils/sms.js';
import { generateOTP } from '../../../utils/otp.js';
import { setOTP, verifyOTP, setSession } from '../../../utils/redis.js';
import { emitEvent, EVENT_TYPES } from '../../../utils/eventEmitter.js';
import { logger } from '../../../utils/logger.js';

// Register new customer
export const register = async (req, res, next) => {
  try {
    const { name, email, mobile, password, confirmPassword, acceptTerms } = req.body;

    // Validate terms acceptance
    if (!acceptTerms) {
      return next(new AppError('You must accept the terms and conditions', 400));
    }

    // Check if passwords match
    if (password !== confirmPassword) {
      return next(new AppError('Passwords do not match', 400));
    }
    
    // Validate mobile number
    if (!mobile || mobile.trim() === '') {
      return next(new AppError('Mobile number is required', 400));
    }

    // For backwards compatibility, map mobile to phone field
    const phone = mobile;

    // Check if customer already exists
    const existingCustomer = await Customer.findOne({
      $or: [
        { email: email },
        { mobile: mobile },
        { phone: phone }
      ]
    });

    if (existingCustomer) {
      if (existingCustomer.email === email) {
        return next(new AppError('Email is already registered', 400));
      }
      if (existingCustomer.mobile === mobile || existingCustomer.phone === phone) {
        return next(new AppError('Mobile number is already registered', 400));
      }
      return next(new AppError('Email or phone number already registered', 400));
    }

    // Create new customer
    const customer = await Customer.create({
      name,
      email,
      mobile,
      phone,  // Set phone field to same value as mobile for consistency
      password
    });

    // Log the created customer for debugging
    console.log("Customer created successfully:", {
      id: customer._id,
      name: customer.name,
      email: customer.email,
      mobile: customer.mobile,
      phone: customer.phone
    });

    // Generate OTP for email verification
    const emailOTP = generateOTP();
    customer.emailVerificationOTP = emailOTP;
    customer.emailVerificationOTPExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes
    await customer.save();

    // Send verification email
    try {
      await sendEmail({
        to: email,
        subject: 'Verify Your Email - RocketryBox',
        text: `Your verification code is: ${emailOTP}. This code will expire in 10 minutes.`
      });
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      // Continue with registration process even if email fails
    }

    // Generate OTP for mobile verification
    const mobileOTP = generateOTP();
    customer.mobileVerificationOTP = mobileOTP;
    customer.mobileVerificationOTPExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes
    await customer.save();

    // Send verification SMS
    try {
      await sendSMS({
        to: mobile,
        templateId: SMS_TEMPLATES.OTP.templateId,
        variables: {
          otp: mobileOTP,
          expiry: '10 minutes'
        }
      });
    } catch (smsError) {
      console.error('Failed to send verification SMS:', smsError);
      // Continue with registration process even if SMS fails
    }

    // Generate tokens
    const accessToken = customer.generateAuthToken();
    const refreshToken = customer.generateRefreshToken();

    // Emit customer registered event for real-time dashboard updates
    emitEvent(EVENT_TYPES.CUSTOMER_REGISTERED, {
      customerId: customer._id,
      name: customer.name,
      email: customer.email
    });

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
    console.error('Registration error:', error);
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
        { mobile: phoneOrEmail }
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

    // Set up session in Redis
    await setSession(customer._id.toString(), {
      user: {
        id: customer._id,
        role: 'customer',
        name: customer.name,
        email: customer.email
      },
      lastActivity: Date.now()
    });

    // Emit customer login event for real-time dashboard updates
    emitEvent(EVENT_TYPES.CUSTOMER_LOGIN, {
      customerId: customer._id,
      name: customer.name,
      email: customer.email
    });

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

// Helper function to generate OTP
const generateOTPHelper = () => {
    const digits = process.env.OTP_LENGTH || 6;
    return Math.floor(Math.random() * Math.pow(10, digits)).toString().padStart(digits, '0');
};

// Send OTP
export const sendOTP = async (req, res, next) => {
    try {
        const { phoneOrEmail, purpose } = req.body;

        // Check if customer exists
        const customer = await Customer.findOne({
            $or: [
                { email: phoneOrEmail },
                { mobile: phoneOrEmail }
            ]
        });

        // For verification purpose during registration, we shouldn't check if account exists
        if (purpose === 'verify' && !customer) {
            // Generate OTP for new registration
            const otp = generateOTPHelper();
            
            // Log OTP for development purposes
            console.log('\n=========== DEVELOPMENT OTP ===========');
            console.log(`📱 Phone/Email: ${phoneOrEmail}`);
            console.log(`🔐 OTP Generated: ${otp}`);
            console.log(`⏱️ Expires in: 10 minutes`);
            console.log('========================================\n');
            
            // Store OTP in Redis with a temporary key
            const tempKey = `temp_${phoneOrEmail}`;
            const stored = await setOTP(tempKey, otp);
            console.log(`OTP Storage Status: ${stored ? 'Successfully Stored' : 'Storage Failed'}`);

            try {
                // Send OTP via email or SMS
                if (phoneOrEmail.includes('@')) {
                    await sendEmail({
                        to: phoneOrEmail,
                        subject: 'Verify Your Email - RocketryBox',
                        text: `Your verification code is: ${otp}. This code will expire in 10 minutes.`
                    });
                } else {
                    await sendSMS({
                        to: phoneOrEmail,
                        templateId: SMS_TEMPLATES.OTP.templateId,
                        variables: {
                            otp: otp,
                            expiry: '10 minutes'
                        }
                    });
                }
            } catch (sendError) {
                // In development mode, ignore sending errors
                if (process.env.NODE_ENV !== 'development') {
                    throw sendError;
                }
                logger.warn('Development mode: Ignoring SMS/Email sending error', {
                    error: sendError.message,
                    phoneOrEmail: phoneOrEmail.includes('@') ? 
                        '***' + phoneOrEmail.slice(-10) : 
                        '***' + phoneOrEmail.slice(-4)
                });
            }

            return res.status(200).json({
                success: true,
                data: {
                    message: 'OTP sent successfully',
                    expiresIn: 600 // 10 minutes in seconds
                }
            });
        }

        // For login/reset purposes, we need an existing account
        if ((purpose === 'login' || purpose === 'reset') && !customer) {
            return next(new AppError('No account found with this email or phone number', 404));
        }

        const otp = generateOTPHelper();
        
        // Log OTP for development purposes
        console.log('\n=========== DEVELOPMENT OTP ===========');
        console.log(`📱 Phone/Email: ${phoneOrEmail}`);
        console.log(`🔐 OTP Generated: ${otp}`);
        console.log(`⏱️ Expires in: 10 minutes`);
        console.log('========================================\n');
        
        // Store OTP in Redis
        const key = customer ? customer._id.toString() : `temp_${phoneOrEmail}`;
        const stored = await setOTP(key, otp);
        console.log(`OTP Storage Status: ${stored ? 'Successfully Stored' : 'Storage Failed'}`);

        try {
            // Send OTP via email or SMS
            if (phoneOrEmail.includes('@')) {
                await sendEmail({
                    to: phoneOrEmail,
                    subject: 'Verify Your Email - RocketryBox',
                    text: `Your verification code is: ${otp}. This code will expire in 10 minutes.`
                });
            } else {
                await sendSMS({
                    to: phoneOrEmail,
                    templateId: SMS_TEMPLATES.OTP.templateId,
                    variables: {
                        otp: otp,
                        expiry: '10 minutes'
                    }
                });
            }
        } catch (sendError) {
            // In development mode, ignore sending errors
            if (process.env.NODE_ENV !== 'development') {
                throw sendError;
            }
            logger.warn('Development mode: Ignoring SMS/Email sending error', {
                error: sendError.message,
                phoneOrEmail: phoneOrEmail.includes('@') ? 
                    '***' + phoneOrEmail.slice(-10) : 
                    '***' + phoneOrEmail.slice(-4)
            });
        }

        res.status(200).json({
            success: true,
            data: {
                message: 'OTP sent successfully',
                expiresIn: 600 // 10 minutes in seconds
            }
        });
    } catch (error) {
        next(new AppError(error.message, 400));
    }
};

// Verify OTP
export const verifyOTPHandler = async (req, res, next) => {
    try {
        const { phoneOrEmail, otp } = req.body;

        // Find customer
        const customer = await Customer.findOne({
            $or: [
                { email: phoneOrEmail },
                { mobile: phoneOrEmail }
            ]
        });

        if (!customer) {
            return next(new AppError('No account found with this email or phone number', 404));
        }

        // Verify OTP using Redis
        const result = await verifyOTP(customer._id.toString(), otp);

        if (!result.valid) {
            return next(new AppError(result.message, 400));
        }

        // Generate tokens
        const accessToken = customer.generateAuthToken();
        const refreshToken = customer.generateRefreshToken();

        // Update customer
        customer.lastLogin = new Date();
        await customer.save();

        res.status(200).json({
            success: true,
            data: {
                message: 'OTP verified successfully',
                accessToken,
                refreshToken,
                user: customer
            }
        });
    } catch (error) {
        next(new AppError(error.message, 400));
    }
}; 