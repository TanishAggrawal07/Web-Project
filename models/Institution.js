const { Schema, model } = require('mongoose');

const tierSchema = new Schema(
  {
    phase: {
      type: String,
      enum: ['gold', 'silver', 'platinum'],
      required: true
    },
    askingPrice: {
      type: Number,
      required: true
    },
    capacity: {
      type: Number,
      default: 1
    },
    perks: {
      type: String,
      trim: true
    },
    expiresAt: Date
  },
  { _id: false }
);

const institutionSchema = new Schema(
  {
    institutionName: {
      type: String,
      required: true,
      trim: true
    },
    contactName: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      trim: true
    },
    tiers: {
      type: [tierSchema],
      default: []
    }
  },
  { timestamps: true }
);

module.exports = model('Institution', institutionSchema);

