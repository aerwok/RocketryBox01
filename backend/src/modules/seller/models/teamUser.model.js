import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

const teamUserSchema = new mongoose.Schema({
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Seller',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters long'],
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    index: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
  },
  phone: {
    type: String,
    trim: true,
    match: [/^\d{10}$/, 'Phone number must be 10 digits']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long'],
    select: false // Don't include password in queries by default
  },
  role: {
    type: String,
    enum: {
      values: ['Owner', 'Manager', 'Staff'],
      message: 'Role must be one of: Owner, Manager, Staff'
    },
    default: 'Staff'
  },
  status: {
    type: String,
    enum: {
      values: ['Active', 'Inactive', 'Suspended', 'Pending'],
      message: 'Status must be one of: Active, Inactive, Suspended, Pending'
    },
    default: 'Pending',
    index: true
  },
  permissions: {
    type: Object,
    default: {}
  },
  invitedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Seller'
  },
  lastLogin: {
    type: Date
  },
  lastActive: {
    type: Date,
    default: Date.now
  },
  refreshToken: {
    type: String,
    select: false
  }
}, {
  timestamps: true
});

// Compound indexes for better query performance
teamUserSchema.index({ seller: 1, email: 1 });
teamUserSchema.index({ seller: 1, status: 1 });
teamUserSchema.index({ email: 1, status: 1 });

// Hash password before saving
teamUserSchema.pre('save', async function (next) {
  try {
    if (!this.isModified('password')) {
      return next();
    }

    this.password = await bcrypt.hash(this.password, 10);
    next();
  } catch (error) {
    next(error);
  }
});

// Update lastActive on save
teamUserSchema.pre('save', function (next) {
  if (this.isModified('lastLogin')) {
    this.lastActive = new Date();
  }
  next();
});

// Compare password method
teamUserSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

// Generate JWT token
teamUserSchema.methods.generateAuthToken = function () {
  return jwt.sign(
    {
      id: this._id,
      role: 'team_member',
      sellerId: this.seller
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    }
  );
};

// Generate refresh token
teamUserSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      id: this._id,
      role: 'team_member',
      sellerId: this.seller
    },
    process.env.JWT_REFRESH_SECRET,
    {
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d'
    }
  );
};

// Remove sensitive data from JSON output
teamUserSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.refreshToken;
  return obj;
};

// Static method to find by email and seller
teamUserSchema.statics.findByEmailAndSeller = async function (email, sellerId) {
  return await this.findOne({
    email: email.toLowerCase(),
    seller: sellerId,
    status: { $ne: 'Suspended' }
  }).select('+password');
};

export default mongoose.model('TeamUser', teamUserSchema);
