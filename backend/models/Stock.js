const mongoose = require('mongoose');

const stockSchema = new mongoose.Schema({
  ticker: {
    type: String,
    required: true,
    uppercase: true,
    trim: true,
  },
  companyName: {
    type: String,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  sentimentAlertThreshold: {
    type: Number,
    default: null, // No alert by default
  },
  addedAt: {
    type: Date,
    default: Date.now,
  }
});

stockSchema.index({ userId: 1, ticker: 1 }, { unique: true });

module.exports = mongoose.model('Stock', stockSchema);
