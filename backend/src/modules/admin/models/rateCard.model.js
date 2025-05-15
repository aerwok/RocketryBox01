import mongoose from 'mongoose';

const courierRateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Courier name is required'],
    trim: true
  },
  rates: {
    withinCity: {
      type: Number,
      required: [true, 'Within city rate is required'],
      min: [0, 'Rate cannot be negative']
    },
    withinState: {
      type: Number,
      required: [true, 'Within state rate is required'],
      min: [0, 'Rate cannot be negative']
    },
    metroToMetro: {
      type: Number,
      required: [true, 'Metro to metro rate is required'],
      min: [0, 'Rate cannot be negative']
    },
    restOfIndia: {
      type: Number,
      required: [true, 'Rest of India rate is required'],
      min: [0, 'Rate cannot be negative']
    },
    northEastJK: {
      type: Number,
      required: [true, 'North East & J&K rate is required'],
      min: [0, 'Rate cannot be negative']
    }
  },
  codCharge: {
    type: Number,
    required: [true, 'COD charge is required'],
    min: [0, 'COD charge cannot be negative']
  },
  codPercent: {
    type: Number,
    required: [true, 'COD percent is required'],
    min: [0, 'COD percent cannot be negative'],
    max: [100, 'COD percent cannot exceed 100']
  }
});

const rateCardSchema = new mongoose.Schema({
  rateBand: {
    type: String,
    required: [true, 'Rate band is required'],
    unique: true,
    trim: true
  },
  couriers: [courierRateSchema],
  isActive: {
    type: Boolean,
    default: true
  },
  description: {
    type: String,
    trim: true
  },
  eligibleWeight: {
    min: {
      type: Number,
      required: [true, 'Minimum eligible weight is required'],
      min: [0, 'Minimum weight cannot be negative']
    },
    max: {
      type: Number,
      required: [true, 'Maximum eligible weight is required']
    }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  }
}, {
  timestamps: true
});

// Ensure at least one courier is defined
rateCardSchema.path('couriers').validate(function(couriers) {
  return couriers.length > 0;
}, 'At least one courier must be defined');

// Index for faster querying
rateCardSchema.index({ rateBand: 1 });
rateCardSchema.index({ isActive: 1 });
rateCardSchema.index({ 'couriers.name': 1 });

const RateCard = mongoose.model('RateCard', rateCardSchema);

export default RateCard; 