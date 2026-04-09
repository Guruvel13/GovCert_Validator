#!/usr/bin/env python3
"""
sign_demo_cert.py — Generate signed demo PDF certificates for testing
Run: python3 verifier/sign_demo_cert.py
Output: uploads/demo_cert_valid.pdf, uploads/demo_cert_expired.pdf
"""
import os
import sys
import base64
from datetime import datetime, timedelta, timezone

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER
from reportlab.pdfgen import canvas
import PyPDF2
from utils.crypto_utils import sign_data
from utils.hash_utils import compute_sha256

KEYS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "keys")
UPLOADS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads")


def load_private_key(ca_name: str) -> str:
    path = os.path.join(KEYS_DIR, f"{ca_name}.priv.pem")
    if not os.path.isfile(path):
        raise FileNotFoundError(f"Private key not found: {path}. Run keygen.py first.")
    with open(path, "r") as f:
        return f.read()


def create_cert_pdf(output_path: str, holder_name: str, degree: str,
                    issuer_name: str, issued_date: str, expiry_date: str):
    """Create a styled certificate PDF without signature (raw content for signing)."""
    doc = SimpleDocTemplate(
        output_path, pagesize=A4,
        rightMargin=2*cm, leftMargin=2*cm,
        topMargin=2*cm, bottomMargin=2*cm
    )
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        "CertTitle", parent=styles["Title"],
        fontSize=26, textColor=colors.HexColor("#1a237e"),
        spaceAfter=0.3*cm, alignment=TA_CENTER, fontName="Helvetica-Bold"
    )
    subtitle_style = ParagraphStyle(
        "Subtitle", parent=styles["Normal"],
        fontSize=13, textColor=colors.HexColor("#37474f"),
        alignment=TA_CENTER, spaceAfter=0.2*cm
    )
    body_style = ParagraphStyle(
        "Body", parent=styles["Normal"],
        fontSize=11, textColor=colors.HexColor("#212121"),
        alignment=TA_CENTER, spaceAfter=0.3*cm
    )
    label_style = ParagraphStyle(
        "Label", parent=styles["Normal"],
        fontSize=10, textColor=colors.HexColor("#546e7a"),
        alignment=TA_CENTER
    )

    story = [
        Spacer(1, 0.5*cm),
        Paragraph("GOVERNMENT OF INDIA", subtitle_style),
        Paragraph("Ministry of Education", subtitle_style),
        Spacer(1, 0.3*cm),
        HRFlowable(width="100%", thickness=2, color=colors.HexColor("#1a237e")),
        Spacer(1, 0.5*cm),
        Paragraph("CERTIFICATE OF ACHIEVEMENT", title_style),
        Spacer(1, 0.4*cm),
        Paragraph("This is to certify that", body_style),
        Paragraph(f"<b>{holder_name}</b>", ParagraphStyle(
            "HolderName", parent=styles["Normal"],
            fontSize=20, textColor=colors.HexColor("#b71c1c"),
            alignment=TA_CENTER, fontName="Helvetica-Bold", spaceAfter=0.2*cm
        )),
        Paragraph("has successfully completed", body_style),
        Paragraph(f"<b>{degree}</b>", ParagraphStyle(
            "Degree", parent=styles["Normal"],
            fontSize=16, textColor=colors.HexColor("#1565c0"),
            alignment=TA_CENTER, fontName="Helvetica-Bold", spaceAfter=0.3*cm
        )),
        Spacer(1, 0.5*cm),
        HRFlowable(width="80%", thickness=1, color=colors.HexColor("#90a4ae")),
        Spacer(1, 0.5*cm),
    ]

    # Details table
    data = [
        ["Issuing Authority:", issuer_name],
        ["Date of Issue:", issued_date],
        ["Valid Until:", expiry_date],
    ]
    table = Table(data, colWidths=[5*cm, 10*cm])
    table.setStyle(TableStyle([
        ("FONTNAME",    (0, 0), (-1, -1), "Helvetica"),
        ("FONTSIZE",    (0, 0), (-1, -1), 11),
        ("FONTNAME",    (0, 0), (0, -1), "Helvetica-Bold"),
        ("TEXTCOLOR",   (0, 0), (0, -1), colors.HexColor("#37474f")),
        ("TEXTCOLOR",   (1, 0), (1, -1), colors.HexColor("#212121")),
        ("ROWBACKGROUNDS", (0, 0), (-1, -1), [colors.HexColor("#f5f5f5"), colors.white]),
        ("ALIGN",       (0, 0), (-1, -1), "LEFT"),
        ("VALIGN",      (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING",  (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
    ]))
    story.append(table)
    story.append(Spacer(1, 1*cm))
    story.append(HRFlowable(width="100%", thickness=2, color=colors.HexColor("#1a237e")))
    story.append(Spacer(1, 0.3*cm))
    story.append(Paragraph(
        "⚠ This certificate contains a digital signature. Verify authenticity at the GovCert portal.",
        label_style
    ))

    doc.build(story)


def sign_and_embed(pdf_path: str, ca_key_name: str, issuer_name: str,
                   issued_to: str, issued_date: str, expiry_date: str):
    """Read PDF, sign its text content, and write metadata fields."""
    # Extract text content for signing
    reader = PyPDF2.PdfReader(pdf_path)
    content = "".join(page.extract_text() or "" for page in reader.pages)
    content_bytes = content.encode("utf-8")

    # Sign
    private_key_pem = load_private_key(ca_key_name)
    signature = sign_data(content_bytes, private_key_pem)

    # Write new PDF with metadata
    writer = PyPDF2.PdfWriter()
    for page in reader.pages:
        writer.add_page(page)

    writer.add_metadata({
        "/GovCert-Issuer":     issuer_name,
        "/GovCert-IssuedTo":   issued_to,
        "/GovCert-IssuedDate": issued_date,
        "/GovCert-ExpiryDate": expiry_date,
        "/GovCert-Signature":  signature,
        "/Author":             issuer_name,
        "/Subject":            issued_to,
    })

    with open(pdf_path, "wb") as f:
        writer.write(f)

    print(f"  [SIGNED] {pdf_path}")


def main():
    os.makedirs(UPLOADS_DIR, exist_ok=True)

    now = datetime.now(timezone.utc)
    future = (now + timedelta(days=365 * 3)).strftime("%Y-%m-%d")
    past   = (now - timedelta(days=30)).strftime("%Y-%m-%d")
    today  = now.strftime("%Y-%m-%d")

    certs = [
        {
            "filename":    "demo_cert_valid.pdf",
            "holder":      "Ravi Kumar",
            "degree":      "Bachelor of Engineering in Computer Science",
            "issuer_name": "Anna University",
            "ca_key":      "anna_university",
            "issued_date": today,
            "expiry_date": future,
        },
        {
            "filename":    "demo_cert_expired.pdf",
            "holder":      "Priya Sharma",
            "degree":      "Master of Technology in Data Science",
            "issuer_name": "IIT Madras",
            "ca_key":      "iit_madras",
            "issued_date": (now - timedelta(days=400)).strftime("%Y-%m-%d"),
            "expiry_date": past,
        },
        {
            "filename":    "demo_cert_cbse.pdf",
            "holder":      "Arjun Singh",
            "degree":      "Senior Secondary Certificate (Class XII)",
            "issuer_name": "CBSE",
            "ca_key":      "cbse",
            "issued_date": today,
            "expiry_date": future,
        },
    ]

    print("GovCert Demo Certificate Generator")
    print("=" * 40)
    for cert in certs:
        out_path = os.path.join(UPLOADS_DIR, cert["filename"])
        print(f"\nGenerating: {cert['filename']}")
        create_cert_pdf(
            out_path,
            cert["holder"], cert["degree"],
            cert["issuer_name"], cert["issued_date"], cert["expiry_date"]
        )
        sign_and_embed(
            out_path, cert["ca_key"], cert["issuer_name"],
            cert["holder"], cert["issued_date"], cert["expiry_date"]
        )

    print(f"\nAll demo certificates written to: {UPLOADS_DIR}")


if __name__ == "__main__":
    main()
