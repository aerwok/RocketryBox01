import Pincode from '../models/pincode.model.js';

export async function getPincodeDetails(pincode) {
  return await Pincode.findOne({ pincode: pincode.toString() });
} 