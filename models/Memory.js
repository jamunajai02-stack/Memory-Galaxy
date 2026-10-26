const mongoose = require('mongoose');
const { CATEGORIES, EMOTIONS } = require('../utils/constants');

const imageSchema = new mongoose.Schema(
  {
    filename: { type: String, required: true },
    originalName: { type: String, default: '' },
    mimeType: { type: String, default: '' }
  },
  { _id: true }
);

const memorySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 140,
      default: 'Untitled Memory'
    },
    starName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
      default: 'Unnamed Star'
    },
    content: {
      type: String,
      default: ''
    },
    plainTextContent: {
      type: String,
      default: ''
    },
    images: [imageSchema],
    date: {
      type: Date,
      default: Date.now
    },
    location: {
      type: String,
      trim: true,
      maxlength: 120,
      default: ''
    },
    category: {
      type: String,
      enum: CATEGORIES,
      default: 'Other'
    },
    emotion: {
      type: String,
      enum: Object.keys(EMOTIONS),
      default: 'Happy'
    },
    starColor: {
      type: String,
      default: '#f5d76e'
    },
    starSize: {
      type: Number,
      default: 8,
      min: 4,
      max: 18
    },
    starPosition: {
      x: { type: Number, required: true },
      y: { type: Number, required: true },
      z: { type: Number, default: 0 }
    }
  },
  { timestamps: true }
);

memorySchema.index({ user: 1, date: -1 });

module.exports = mongoose.model('Memory', memorySchema);
