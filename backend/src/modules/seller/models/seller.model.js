import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

const addressSchema = new mongoose.Schema({
  address1: { type: String },
  address2: { type: String },
  city: { type: String },
  state: { type: String },
  pincode: { type: String },
  country: { type: String, default: 'India' }
}, { _id: false });

const bankDetailsSchema = new mongoose.Schema({
  accountType: { type: String },
  bankName: { type: String },
  accountNumber: { type: String },
  accountHolderName: { type: String },
  ifscCode: { type: String },
  cancelledCheque: {
    url: { type: String },
    status: { type: String, enum: ['verified', 'pending', 'rejected'], default: 'pending' }
  }
}, { _id: false });

const sellerSchema = new mongoose.Schema({
  // RB User ID (short, readable ID)
  rbUserId: {
    type: String,
    unique: true,
    index: true,
    // Will be auto-generated in pre-save hook
  },
  // Basic Info
  name: { type: String, required: true, index: true },
  firstName: { type: String },  // For display purposes
  lastName: { type: String },   // For display purposes
  email: { type: String, required: true, unique: true, lowercase: true, index: true },
  phone: { type: String, required: true, unique: true, index: true },
  password: { type: String, required: true, select: false },

  // Business Info
  businessName: { type: String, required: true, index: true },
  companyCategory: { type: String },
  brandName: { type: String },
  website: { type: String },
  monthlyShipments: { type: String, enum: ['0-100', '101-500', '501-1000', '1001-5000', '5000+'] },

  // Contact Info
  supportContact: { type: String },
  supportEmail: { type: String },
  operationsEmail: { type: String },
  financeEmail: { type: String },

  // Address
  address: addressSchema,

  // Documents
  gstin: { type: String },
  documents: {
    gstin: {
      number: { type: String },
      url: { type: String },
      status: { type: String, enum: ['verified', 'pending', 'rejected'], default: 'pending' }
    },
    pan: {
      number: { type: String },
      url: { type: String },
      status: { type: String, enum: ['verified', 'pending', 'rejected'], default: 'pending' }
    },
    aadhaar: {
      number: { type: String },
      url: { type: String },
      status: { type: String, enum: ['verified', 'pending', 'rejected'], default: 'pending' }
    },
    others: [{
      name: { type: String },
      type: { type: String },
      url: { type: String },
      status: { type: String, enum: ['verified', 'pending', 'rejected'], default: 'pending' }
    }]
  },

  // Bank Details
  bankDetails: bankDetailsSchema,

  // System Fields
  status: { type: String, enum: ['pending', 'active', 'suspended'], default: 'pending', index: true },
  otp: {
    code: { type: String },
    expiresAt: { type: Date }
  },
  lastLogin: { type: Date },
  lastActive: { type: Date, default: Date.now, index: true },
  refreshToken: { type: String, select: false },
  walletBalance: { type: String, default: '0' },
  rateCard: { type: mongoose.Schema.Types.ObjectId, ref: 'RateCard', default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Add compound indexes for common query patterns
sellerSchema.index({ status: 1, lastActive: -1 });
sellerSchema.index({ businessName: 'text', email: 'text', phone: 'text' });

// Default filter to exclude suspended sellers
sellerSchema.pre(/^find/, function (next) {
  // Check if this query should skip the default filter
  const skipDefaultFilter = this.getOptions().skipDefaultFilter;

  // Apply default filter for normal queries
  if (!skipDefaultFilter && !this._conditions.status) {
    this.find({ status: { $ne: 'suspended' } });
  }
  next();
});

// Update lastActive and timestamps
sellerSchema.pre('save', function (next) {
  if (this.isModified('lastLogin')) {
    this.lastActive = new Date();
  }
  this.updatedAt = new Date();
  next();
});

// Hash password before save
sellerSchema.pre('save', async function (next) {
  try {
    console.log('Pre-save hook triggered for seller:', {
      sellerId: this._id,
      isNew: this.isNew,
      isModified: this.isModified('password')
    });

    if (!this.isModified('password')) {
      console.log('Password not modified, skipping hash');
      return next();
    }

    console.log('Hashing password');
    this.password = await bcrypt.hash(this.password, 10);
    console.log('Password hashed successfully');
    next();
  } catch (error) {
    console.error('Error in password hashing:', error);
    next(error);
  }
});

// Auto-generate RB User ID for new sellers
sellerSchema.pre('save', async function (next) {
  // Only generate for new documents
  if (this.isNew && !this.rbUserId) {
    try {
      this.rbUserId = await generateUserId('seller');
      console.log('Generated RB User ID for seller:', this.rbUserId);
    } catch (error) {
      console.error('Error generating RB User ID for seller:', error);
      // Continue without blocking save - user can function without RB ID
    }
  }
  next();
});

// Compare password
sellerSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Generate JWT
sellerSchema.methods.generateAuthToken = function () {
  return jwt.sign({ id: this._id, role: 'seller' }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1d'
  });
};

// Generate Refresh Token
sellerSchema.methods.generateRefreshToken = function () {
  return jwt.sign({ id: this._id, role: 'seller' }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
  });
};

// Remove sensitive data
sellerSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.refreshToken;
  return obj;
};

// Static method to find a seller by ID safely
sellerSchema.statics.findByIdSafe = async function (id) {
  try {
    return await this.findById(id).lean();
  } catch (error) {
    return null;
  }
};

// Helper method for updating seller data safely
sellerSchema.methods.updateSafe = async function (updates) {
  const allowedFields = [
    'name', 'firstName', 'lastName', 'phone', 'businessName',
    'companyCategory', 'brandName', 'website', 'monthlyShipments',
    'supportContact', 'supportEmail', 'operationsEmail', 'financeEmail',
    'address', 'documents', 'bankDetails'
  ];

  Object.keys(updates).forEach(key => {
    if (allowedFields.includes(key)) {
      this[key] = updates[key];
    }
  });

  this.lastActive = new Date();
  this.updatedAt = new Date();
  return await this.save();
};

export default mongoose.model('Seller', sellerSchema);
