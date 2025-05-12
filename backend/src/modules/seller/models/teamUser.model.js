import mongoose from 'mongoose';

const teamUserSchema = new mongoose.Schema({
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Seller',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    index: true
  },
  phone: {
    type: String
  },
  role: {
    type: String,
    enum: ['Owner', 'Manager', 'Staff'],
    default: 'Staff'
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Suspended', 'Pending'],
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
  }
}, {
  timestamps: true
});

export default mongoose.model('TeamUser', teamUserSchema); 