const mongoose = require('mongoose');

const clickSchema = new mongoose.Schema({
  timestamp: {
    type: Date,
    default: Date.now,
  },
  ipAddress: String,
  country: String,
  city: String,
  userAgent: String,
  referer: String,
});

const urlSchema = new mongoose.Schema({
  originalUrl: {
    type: String,
    required: true,
  },
  shortCode: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  clicks: [clickSchema],
  totalClicks: {
    type: Number,
    default: 0,
    index: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
  lastAccessed: {
    type: Date,
  },
  customAlias: {
    type: String,
    sparse: true,
    unique: true,
  },
  expiresAt: {
    type: Date,
  },
});

// Compound index for efficient queries
urlSchema.index({ shortCode: 1, createdAt: -1 });

// Index for analytics queries
urlSchema.index({ totalClicks: -1, createdAt: -1 });

module.exports = mongoose.model('Url', urlSchema);
