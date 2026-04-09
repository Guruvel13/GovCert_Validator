"""
file_utils.py — File reading and metadata extraction utilities
"""
import os
import json
import base64
import PyPDF2


def read_file_bytes(path: str) -> bytes:
    """Read raw bytes of a file."""
    with open(path, "rb") as f:
        return f.read()


def extract_cert_data_from_pdf(path: str) -> dict:
    """
    Extract the GovCert metadata block embedded in a PDF.
    Returns a dict with: issuer, issuedTo, issuedDate, expiryDate, signature
    Falls back to None values if not a signed GovCert PDF.
    """
    result = {
        "issuer": None,
        "issuedTo": None,
        "issuedDate": None,
        "expiryDate": None,
        "signature": None,
        "content_bytes": None,
    }

    try:
        reader = PyPDF2.PdfReader(path)
        meta = reader.metadata or {}

        # Try reading from PDF custom metadata fields (set during signing)
        result["issuer"]     = meta.get("/GovCert-Issuer") or meta.get("/Author")
        result["issuedTo"]   = meta.get("/GovCert-IssuedTo") or meta.get("/Subject")
        result["issuedDate"] = meta.get("/GovCert-IssuedDate") or meta.get("/CreationDate", "")
        result["expiryDate"] = meta.get("/GovCert-ExpiryDate")
        result["signature"]  = meta.get("/GovCert-Signature")

        # Extract the content bytes (all page text joined) to recompute hash
        content = ""
        for page in reader.pages:
            content += page.extract_text() or ""
        result["content_bytes"] = content.encode("utf-8")

    except Exception as e:
        result["error"] = str(e)

    return result


def extract_cert_data_from_xml(path: str) -> dict:
    """Extract metadata from an XML-based certificate."""
    import xml.etree.ElementTree as ET

    result = {
        "issuer": None,
        "issuedTo": None,
        "issuedDate": None,
        "expiryDate": None,
        "signature": None,
        "content_bytes": None,
    }

    try:
        tree = ET.parse(path)
        root = tree.getroot()

        def find(tag):
            el = root.find(tag)
            if el is None:
                el = root.find(f".//{tag}")
            return el.text.strip() if el is not None and el.text else None

        result["issuer"]       = find("Issuer") or find("issuer")
        result["issuedTo"]     = find("IssuedTo") or find("subject") or find("Subject")
        result["issuedDate"]   = find("IssuedDate") or find("issuedDate")
        result["expiryDate"]   = find("ExpiryDate") or find("expiryDate")
        result["signature"]    = root.attrib.get("signature") or find("Signature")
        result["content_bytes"] = ET.tostring(root, encoding="unicode").encode("utf-8")

    except Exception as e:
        result["error"] = str(e)

    return result


def extract_cert_data(path: str) -> dict:
    """Auto-detect file type and extract cert data."""
    ext = os.path.splitext(path)[1].lower()
    if ext == ".xml":
        return extract_cert_data_from_xml(path)
    else:
        return extract_cert_data_from_pdf(path)
