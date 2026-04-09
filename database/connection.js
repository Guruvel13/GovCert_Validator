const mongoose = require("mongoose");

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/govcert";

const connect = async () => {
  await mongoose.connect(MONGO_URI);
  console.log("✅  Connected to MongoDB:", MONGO_URI);
};

const disconnect = async () => {
  await mongoose.disconnect();
};

module.exports = { connect, disconnect };
