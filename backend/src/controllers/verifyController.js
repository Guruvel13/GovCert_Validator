const upload = require("../middlewares/upload");
const { spawnVerifier } = require("../services/pythonBridge");
const VerificationLog = require("../models/VerificationLog");
const CertificateAuthority = require("../models/CertificateAuthority");
const path = require("path");
const fs = require("fs");

// ── POST /api/verify ──────────────────────────────────────────────────────────
const verifyCertificate = [
  upload.single("certificate"),
  async (req, res) => {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded. Please attach a PDF or XML certificate.",
      });
    }

    const filePath = path.resolve(req.file.path);

    try {
      // Run Python verifier
      const result = await spawnVerifier(filePath);

      // Save verification log
      const log = await VerificationLog.create({
        filename:      req.file.filename,
        originalName:  req.file.originalname,
        fileHash:      result.hash,
        status:        result.status,
        message:       result.message,
        issuer:        result.issuer,
        issuedTo:      result.issuedTo,
        issuedDate:    result.issuedDate,
        expiryDate:    result.expiryDate,
        sigValid:      result.sigValid,
        issuerTrusted: result.issuerTrusted,
        ipAddress:     req.ip,
      });

      return res.status(200).json({
        success: true,
        logId:   log._id,
        result,
      });
    } catch (err) {
      console.error("Verification error:", err.message);

      // Save error log
      await VerificationLog.create({
        filename:     req.file.filename,
        originalName: req.file.originalname,
        status:       "ERROR",
        message:      err.message,
        ipAddress:    req.ip,
      }).catch(() => {});

      return res.status(500).json({
        success: false,
        message: `Verification engine error: ${err.message}`,
      });
    }
  },
];

// ── GET /api/logs ─────────────────────────────────────────────────────────────
const getLogs = async (req, res) => {
  try {
    const page  = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const skip  = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      VerificationLog.find()
        .sort({ verifiedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      VerificationLog.countDocuments(),
    ]);

    res.json({ success: true, total, page, limit, logs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/authorities ──────────────────────────────────────────────────────
const getAuthorities = async (req, res) => {
  try {
    const cas = await CertificateAuthority.find(
      { isActive: true },
      { publicKeyPem: 0 }  // Never expose private keys in API
    ).lean();
    res.json({ success: true, count: cas.length, data: cas });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/logs/:id ─────────────────────────────────────────────────────────
const getLogById = async (req, res) => {
  try {
    const log = await VerificationLog.findById(req.params.id).lean();
    if (!log) return res.status(404).json({ success: false, message: "Log not found." });
    res.json({ success: true, data: log });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { verifyCertificate, getLogs, getAuthorities, getLogById };
