const { Schema, model, Types } = require('mongoose');

const quoteSchema = new Schema(
  {
    vendor: {
      type: Types.ObjectId,
      ref: 'Vendor',
      required: true
    },
    institution: {
      type: Types.ObjectId,
      ref: 'Institution',
      required: true
    },
    tierPhase: {
      type: String,
      enum: ['gold', 'silver', 'platinum'],
      required: true
    },
    vendorAmount: {
      type: Number,
      required: true
    },
    institutionExpectation: {
      type: Number,
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending'
    },
    notes: {
      type: String,
      trim: true
    }
  },
  { timestamps: true }
);

module.exports = model('Quote', quoteSchema);

