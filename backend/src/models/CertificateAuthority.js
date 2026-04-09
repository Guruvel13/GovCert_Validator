const mongoose = require("mongoose");

const CertificateAuthoritySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    shortCode: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    publicKeyPem: {
      type: String,
      required: true,
    },
    country: {
      type: String,
      default: "India",
    },
    validFrom: {
      type: String,
    },
    validUntil: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    description: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CertificateAuthority", CertificateAuthoritySchema);
