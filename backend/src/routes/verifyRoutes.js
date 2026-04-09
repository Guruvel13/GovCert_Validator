const express = require("express");
const router = express.Router();
const {
  verifyCertificate,
  getLogs,
  getAuthorities,
  getLogById,
} = require("../controllers/verifyController");

// Certificate verification
router.post("/verify", verifyCertificate);

// Verification history
router.get("/logs", getLogs);
router.get("/logs/:id", getLogById);

// Trusted certificate authorities
router.get("/authorities", getAuthorities);

module.exports = router;
