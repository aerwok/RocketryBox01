import mongoose from 'mongoose';

const rateCardSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  rates: { type: Object, required: true }, // JSON structure matching the default rate card
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model('RateCard', rateCardSchema); 