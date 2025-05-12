import mongoose from 'mongoose';

const dimensionsSchema = new mongoose.Schema({
  length: Number,
  width: Number,
  height: Number
}, { _id: false });

const variantSchema = new mongoose.Schema({
  name: String,
  sku: String,
  price: Number,
  quantity: Number
}, { _id: false });

const inventorySchema = new mongoose.Schema({
  quantity: { type: Number, default: 0 },
  lowStockThreshold: { type: Number, default: 5 },
  reorderPoint: { type: Number, default: 10 }
}, { _id: false });

const productSchema = new mongoose.Schema({
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Seller',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  sku: {
    type: String,
    required: true,
    index: true
  },
  description: String,
  category: {
    type: String
  },
  price: {
    type: Number,
    required: true
  },
  weight: Number,
  dimensions: dimensionsSchema,
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active',
    index: true
  },
  stock: {
    type: Number,
    required: true,
    default: 0
  },
  images: [String],
  inventory: inventorySchema,
  variants: [variantSchema],
  attributes: { type: mongoose.Schema.Types.Mixed },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

export default mongoose.model('Product', productSchema); 