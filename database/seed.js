#!/usr/bin/env node
/**
 * seed.js — Populate the MongoDB database with trusted Certificate Authorities
 * Usage: node database/seed.js  (run from project root)
 *
 * Prerequisites:
 *   1. MongoDB must be running
 *   2. Run `python3 verifier/keygen.py` first to generate public keys
 */

// Resolve node_modules from backend directory
const Module = require("module");
const backendPath = require("path").join(__dirname, "../backend/node_modules");
Module.globalPaths.push(backendPath);

require("dotenv").config({ path: require("path").join(__dirname, "../backend/.env") });

const path = require("path");
const fs = require("fs");
const mongoose = require("mongoose");
const { connect, disconnect } = require("./connection");

// Load the CA model schema inline (avoid circular requires with backend)
const CertificateAuthoritySchema = new mongoose.Schema(
  {
    name:         { type: String, required: true, unique: true, trim: true },
    shortCode:    { type: String, required: true, unique: true, lowercase: true, trim: true },
    publicKeyPem: { type: String, required: true },
    country:      { type: String, default: "India" },
    validFrom:    { type: String },
    validUntil:   { type: String },
    isActive:     { type: Boolean, default: true },
    description:  { type: String },
  },
  { timestamps: true }
);

const CertificateAuthority =
  mongoose.models.CertificateAuthority ||
  mongoose.model("CertificateAuthority", CertificateAuthoritySchema);

const KEYS_DIR = path.join(__dirname, "../verifier/keys");
const SEED_FILE = path.join(__dirname, "./seed.json");

function loadPublicKey(shortCode) {
  const keyPath = path.join(KEYS_DIR, `${shortCode}.pub.pem`);
  if (!fs.existsSync(keyPath)) {
    console.warn(`  ⚠  Public key not found for ${shortCode}: ${keyPath}`);
    console.warn(`     Run: python3 verifier/keygen.py`);
    return null;
  }
  return fs.readFileSync(keyPath, "utf-8");
}

async function seed() {
  console.log("GovCert Database Seeder");
  console.log("========================");

  await connect();

  const seedData = JSON.parse(fs.readFileSync(SEED_FILE, "utf-8"));
  let inserted = 0;
  let skipped  = 0;
  let failed   = 0;

  for (const ca of seedData) {
    const publicKeyPem = loadPublicKey(ca.shortCode);
    if (!publicKeyPem) {
      failed++;
      continue;
    }

    const doc = { ...ca, publicKeyPem };

    try {
      await CertificateAuthority.findOneAndUpdate(
        { shortCode: ca.shortCode },
        doc,
        { upsert: true, new: true }
      );
      console.log(`  ✅  Upserted: ${ca.name}`);
      inserted++;
    } catch (err) {
      console.error(`  ❌  Failed: ${ca.name} — ${err.message}`);
      failed++;
    }
  }

  console.log(`\nDone. Inserted/updated: ${inserted}, Skipped: ${skipped}, Failed: ${failed}`);
  await disconnect();
}

seed().catch((err) => {
  console.error("Seeder error:", err);
  process.exit(1);
});
