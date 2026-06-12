const mongoose = require('mongoose');

const stockSchema = new mongoose.Schema({
  ticker: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
  },
  companyName: {
    type: String,
  },
  addedAt: {
    type: Date,
    default: Date.now,
  }
});

module.exports = mongoose.model('Stock', stockSchema);
