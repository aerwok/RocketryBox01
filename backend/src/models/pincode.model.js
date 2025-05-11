import mongoose from 'mongoose';

const pincodeSchema = new mongoose.Schema({
  pincode: { type: String, required: true, index: true },
  officeName: String,
  district: String,
  state: String,
  region: String,
  circle: String,
  taluk: String
  // Add more fields as needed
});

export default mongoose.model('Pincode', pincodeSchema); 