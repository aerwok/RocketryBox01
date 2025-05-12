import Joi from 'joi';

export const loginSchema = Joi.object({
  emailOrPhone: Joi.string().required().messages({
    'string.empty': 'Email or phone is required'
  }),
  password: Joi.string(),
  otp: Joi.string().length(6),
  rememberMe: Joi.boolean().default(false)
}).or('password', 'otp').messages({
  'object.missing': 'Password or OTP is required'
});

export const sendOTPSchema = Joi.object({
  emailOrPhone: Joi.string().required().messages({
    'string.empty': 'Email or phone is required'
  }),
  purpose: Joi.string().valid('login', 'reset', 'verify').required().messages({
    'any.only': 'Purpose must be login, reset, or verify',
    'string.empty': 'Purpose is required'
  })
});

export const verifyOTPSchema = Joi.object({
  emailOrPhone: Joi.string().required().messages({
    'string.empty': 'Email or phone is required'
  }),
  otp: Joi.string().length(6).required().messages({
    'string.empty': 'OTP is required',
    'string.length': 'OTP must be 6 digits'
  })
});

export const resetPasswordSchema = Joi.object({
  emailOrPhone: Joi.string().required().messages({
    'string.empty': 'Email or phone is required'
  }),
  otp: Joi.string().length(6).required().messages({
    'string.empty': 'OTP is required',
    'string.length': 'OTP must be 6 digits'
  }),
  newPassword: Joi.string().min(6).required().messages({
    'string.empty': 'New password is required',
    'string.min': 'Password must be at least 6 characters'
  }),
  confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required().messages({
    'any.only': 'Passwords do not match',
    'string.empty': 'Confirm password is required'
  })
});

export const registerSchema = Joi.object({
  name: Joi.string().min(2).max(50).required().messages({
    'string.empty': 'Name is required',
    'string.min': 'Name must be at least 2 characters',
    'string.max': 'Name cannot exceed 50 characters'
  }),
  email: Joi.string().email().required().messages({
    'string.empty': 'Email is required',
    'string.email': 'Invalid email format'
  }),
  phone: Joi.string().pattern(/^[6-9]\d{9}$/).required().messages({
    'string.empty': 'Phone number is required',
    'string.pattern.base': 'Please provide a valid Indian phone number'
  }),
  password: Joi.string().min(6).required().messages({
    'string.empty': 'Password is required',
    'string.min': 'Password must be at least 6 characters'
  }),
  businessName: Joi.string().min(2).max(100).required().messages({
    'string.empty': 'Business name is required',
    'string.min': 'Business name must be at least 2 characters',
    'string.max': 'Business name cannot exceed 100 characters'
  }),
  companyCategory: Joi.string().max(100),
  brandName: Joi.string().max(100),
  website: Joi.string().uri().max(200),
  supportContact: Joi.string().pattern(/^[6-9]\d{9}$/),
  supportEmail: Joi.string().email(),
  operationsEmail: Joi.string().email(),
  financeEmail: Joi.string().email(),
  gstin: Joi.string().length(15).pattern(/^[0-9A-Z]{15}$/),
  documents: Joi.object({
    gstin: Joi.string().length(15).pattern(/^[0-9A-Z]{15}$/),
    pan: Joi.string().length(10),
    cin: Joi.string().length(21),
    tradeLicense: Joi.string(),
    msmeRegistration: Joi.string(),
    aadhaar: Joi.string().length(12),
    documents: Joi.array().items(
      Joi.object({
        name: Joi.string().required(),
        type: Joi.string().required(),
        url: Joi.string().uri().required(),
        status: Joi.string().valid('verified', 'pending', 'rejected').default('pending')
      })
    )
  })
}); 