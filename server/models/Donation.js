const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema({
  donor: {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      lowercase: true
    },
    phone: String
  },
  amount: {
    type: Number,
    required: true,
    min: 1
  },
  currency: {
    type: String,
    default: 'USD'
  },
  paymentMethod: {
    type: String,
    enum: ['credit_card', 'paypal', 'bank_transfer'],
    default: 'credit_card'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  },
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurrence: {
    type: String,
    enum: ['monthly', 'quarterly', 'yearly']
  },
  notes: String
}, {
  timestamps: true
});

module.exports = mongoose.model('Donation', donationSchema);