#!/usr/bin/env python3
"""
verify.py — Main GovCert Verification Engine
Usage: python3 verify.py <path_to_certificate>
Output: JSON to stdout
"""
import sys
import os
import json

# Allow imports from parent verifier directory
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from utils.file_utils import extract_cert_data, read_file_bytes
from utils.hash_utils import compute_sha256, compute_file_hash
from utils.crypto_utils import verify_signature
from utils.cert_utils import check_expiry, normalize_issuer_name

# ── DB connection (pymongo direct) ────────────────────────────────────────────
import pymongo

MONGO_URI = os.environ.get("MONGO_URI", "mongodb://localhost:27017/govcert")

def get_ca_public_key(issuer_name: str) -> str | None:
    """Look up the public key PEM for an issuer in the trusted CA database."""
    try:
        client = pymongo.MongoClient(MONGO_URI, serverSelectionTimeoutMS=3000)
        db = client["govcert"]
        normalized = normalize_issuer_name(issuer_name)
        ca = db.certificateauthorities.find_one({
            "$or": [
                {"name": {"$regex": issuer_name, "$options": "i"}},
                {"shortCode": {"$regex": normalized, "$options": "i"}},
            ]
        })
        client.close()
        return ca["publicKeyPem"] if ca else None
    except Exception:
        return None  # DB unavailable — fall to key file fallback

def get_ca_public_key_from_file(issuer_name: str) -> str | None:
    """Fallback: read public key from verifier/keys/<issuer>.pub.pem"""
    keys_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "keys")
    if not os.path.isdir(keys_dir):
        return None
    normalized = issuer_name.lower().replace(" ", "_").replace("/", "_")
    candidates = [
        os.path.join(keys_dir, f"{normalized}.pub.pem"),
        os.path.join(keys_dir, f"{normalized}.pem"),
    ]
    for path in candidates:
        if os.path.isfile(path):
            with open(path, "r") as f:
                return f.read()
    return None

# ── Main verification logic ───────────────────────────────────────────────────

def verify_certificate(file_path: str) -> dict:
    if not os.path.isfile(file_path):
        return {"status": "ERROR", "message": f"File not found: {file_path}"}

    # Step 1 — Extract cert metadata
    cert_data = extract_cert_data(file_path)
    if "error" in cert_data:
        return {"status": "ERROR", "message": cert_data["error"]}

    issuer      = cert_data.get("issuer") or "Unknown"
    issued_to   = cert_data.get("issuedTo") or "Unknown"
    issued_date = cert_data.get("issuedDate") or ""
    expiry_date = cert_data.get("expiryDate") or ""
    signature   = cert_data.get("signature")
    content_bytes = cert_data.get("content_bytes") or b""

    # Step 2 — Compute hash (whole file for integrity)
    file_hash = compute_file_hash(file_path)

    # Step 3 — Issuer validation
    pub_key = get_ca_public_key(issuer)
    if pub_key is None:
        pub_key = get_ca_public_key_from_file(issuer)

    issuer_trusted = pub_key is not None

    # Step 4 — Signature verification
    sig_valid = False
    if signature and pub_key and content_bytes:
        sig_valid = verify_signature(content_bytes, signature, pub_key)
    elif not signature:
        sig_valid = False  # No signature embedded

    # Step 5 — Expiry check
    expiry_status = check_expiry(expiry_date) if expiry_date else "UNKNOWN"

    # Step 6 — Final decision
    if not issuer_trusted:
        final_status = "INVALID"
        message = "Issuer is not in the trusted CA list."
    elif not sig_valid:
        final_status = "INVALID"
        message = "Digital signature verification failed — certificate may be tampered."
    elif expiry_status == "EXPIRED":
        final_status = "EXPIRED"
        message = "Certificate has expired."
    elif expiry_status == "UNKNOWN":
        final_status = "VALID"
        message = "Certificate is valid. (Expiry date could not be determined.)"
    else:
        final_status = "VALID"
        message = "Certificate is authentic, untampered, and within validity period."

    return {
        "status":      final_status,
        "message":     message,
        "issuer":      issuer,
        "issuedTo":    issued_to,
        "issuedDate":  issued_date,
        "expiryDate":  expiry_date,
        "hash":        file_hash,
        "sigValid":    sig_valid,
        "issuerTrusted": issuer_trusted,
    }


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"status": "ERROR", "message": "Usage: python3 verify.py <file_path>"}))
        sys.exit(1)

    result = verify_certificate(sys.argv[1])
    print(json.dumps(result, indent=2))
    sys.exit(0 if result["status"] == "VALID" else 1)
