import mongoose from 'mongoose';

const addressSchema = new mongoose.Schema({
  street: String,
  city: String,
  state: String,
  pincode: String,
  country: { type: String, default: 'India' }
}, { _id: false });

const customerSchema = new mongoose.Schema({
  name: String,
  phone: String,
  email: String,
  address: addressSchema
}, { _id: false });

const dimensionsSchema = new mongoose.Schema({
  length: Number,
  width: Number,
  height: Number
}, { _id: false });

const productSchema = new mongoose.Schema({
  name: String,
  sku: String,
  quantity: Number,
  price: Number,
  weight: String,
  dimensions: dimensionsSchema
}, { _id: false });

const paymentSchema = new mongoose.Schema({
  method: { type: String, enum: ['COD', 'Prepaid'], required: true },
  amount: String,
  codCharge: String,
  shippingCharge: String,
  gst: String,
  total: String
}, { _id: false });

const orderSchema = new mongoose.Schema({
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'Seller', required: true },
  orderId: { type: String, required: true, unique: true },
  orderDate: { type: Date, required: true },
  customer: customerSchema,
  product: productSchema,
  payment: paymentSchema,
  status: { type: String, enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Returned'], default: 'Pending' },
  orderTimeline: [
    {
      status: { type: String },
      timestamp: { type: Date, default: Date.now },
      comment: { type: String }
    }
  ],
  notes: [
    {
      note: { type: String },
      createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Seller' },
      createdAt: { type: Date, default: Date.now }
    }
  ],
  awb: String,
  courier: String,
  tracking: String,
  channel: { type: String, enum: ['MANUAL', 'EXCEL', 'SHOPIFY', 'WOOCOMMERCE', 'AMAZON', 'FLIPKART', 'OPENCART', 'API'], default: 'MANUAL' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model('SellerOrder', orderSchema); 