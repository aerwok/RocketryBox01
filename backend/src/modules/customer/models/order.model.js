import mongoose from 'mongoose';

const packageItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Item name is required']
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [1, 'Quantity must be at least 1']
  },
  value: {
    type: Number,
    required: [true, 'Value is required'],
    min: [0, 'Value cannot be negative']
  }
});

const orderSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  awb: {
    type: String,
    required: true,
    unique: true
  },
  status: {
    type: String,
    enum: ['Booked', 'Processing', 'In Transit', 'Out for Delivery', 'Delivered', 'Failed', 'Cancelled'],
    default: 'Booked'
  },
  pickupAddress: {
    name: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      required: true
    },
    address1: {
      type: String,
      required: true
    },
    address2: String,
    city: {
      type: String,
      required: true
    },
    state: {
      type: String,
      required: true
    },
    pincode: {
      type: String,
      required: true
    },
    country: {
      type: String,
      required: true,
      default: 'India'
    }
  },
  deliveryAddress: {
    name: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      required: true
    },
    address1: {
      type: String,
      required: true
    },
    address2: String,
    city: {
      type: String,
      required: true
    },
    state: {
      type: String,
      required: true
    },
    pincode: {
      type: String,
      required: true
    },
    country: {
      type: String,
      required: true,
      default: 'India'
    }
  },
  package: {
    weight: {
      type: Number,
      required: [true, 'Weight is required'],
      min: [0.1, 'Weight must be at least 0.1 kg']
    },
    dimensions: {
      length: {
        type: Number,
        required: [true, 'Length is required'],
        min: [1, 'Length must be at least 1 cm']
      },
      width: {
        type: Number,
        required: [true, 'Width is required'],
        min: [1, 'Width must be at least 1 cm']
      },
      height: {
        type: Number,
        required: [true, 'Height is required'],
        min: [1, 'Height must be at least 1 cm']
      }
    },
    items: [packageItemSchema]
  },
  serviceType: {
    type: String,
    enum: ['standard', 'express', 'cod'],
    required: true
  },
  paymentMethod: {
    type: String,
    required: true
  },
  paymentId: {
    type: String,
    select: false
  },
  amount: {
    type: Number,
    required: true,
    min: [0, 'Amount cannot be negative']
  },
  estimatedDelivery: {
    type: Date,
    required: true
  },
  tracking: {
    status: String,
    currentLocation: String,
    timeline: [{
      status: String,
      location: String,
      timestamp: Date,
      description: String,
      code: String
    }]
  },
  courier: {
    name: String,
    trackingUrl: String,
    phone: String
  },
  instructions: String,
  pickupDate: {
    type: Date,
    required: true
  },
  label: {
    type: String,
    select: false
  },
  refund: {
    id: String,
    amount: Number,
    status: String,
    createdAt: Date
  }
}, {
  timestamps: true
});

// Generate AWB number before saving
orderSchema.pre('save', async function(next) {
  if (this.isNew) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    this.awb = `RB${year}${month}${random}`;
  }
  next();
});

// Calculate volumetric weight
orderSchema.methods.calculateVolumetricWeight = function() {
  const { length, width, height } = this.package.dimensions;
  return (length * width * height) / 5000; // Standard volumetric weight calculation
};

// Get order status timeline
orderSchema.methods.getStatusTimeline = function() {
  return this.tracking.timeline.sort((a, b) => b.timestamp - a.timestamp);
};

const Order = mongoose.model('Order', orderSchema);

export default Order; 