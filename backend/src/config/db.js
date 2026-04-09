/**
 * db.js — Mongoose connection helper
 */
const mongoose = require("mongoose");

const connectDB = async () => {
  const uri = process.env.MONGO_URI || "mongodb://localhost:27017/govcert";
  try {
    await mongoose.connect(uri);
    console.log(`✅  MongoDB connected: ${uri}`);
  } catch (err) {
    console.error("❌  MongoDB connection error:", err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
