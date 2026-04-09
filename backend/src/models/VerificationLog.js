const mongoose = require("mongoose");

const VerificationLogSchema = new mongoose.Schema(
  {
    filename: {
      type: String,
      required: true,
    },
    originalName: {
      type: String,
    },
    fileHash: {
      type: String,
    },
    status: {
      type: String,
      enum: ["VALID", "INVALID", "EXPIRED", "ERROR"],
      required: true,
    },
    message: {
      type: String,
    },
    issuer: {
      type: String,
    },
    issuedTo: {
      type: String,
    },
    issuedDate: {
      type: String,
    },
    expiryDate: {
      type: String,
    },
    sigValid: {
      type: Boolean,
    },
    issuerTrusted: {
      type: Boolean,
    },
    ipAddress: {
      type: String,
    },
    verifiedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("VerificationLog", VerificationLogSchema);
