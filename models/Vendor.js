const { Schema, model } = require('mongoose');

const vendorSchema = new Schema(
  {
    businessName: {
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
    companyUrl: {
      type: String,
      trim: true
    }
  },
  { timestamps: true }
);

module.exports = model('Vendor', vendorSchema);
