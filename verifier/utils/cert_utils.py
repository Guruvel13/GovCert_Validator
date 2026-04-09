"""
cert_utils.py — Certificate validation helpers
"""
from datetime import datetime, timezone


# Accepted date string formats from PDF metadata / XML
_DATE_FORMATS = [
    "%Y-%m-%d",
    "%Y/%m/%d",
    "%d-%m-%Y",
    "%d/%m/%Y",
    "%Y-%m-%dT%H:%M:%S",
    "%Y-%m-%d %H:%M:%S",
    "D:%Y%m%d%H%M%S",   # PDF date format
    "D:%Y%m%d%H%M%SZ",
]


def parse_date(date_str: str) -> datetime | None:
    """Parse a date string using known formats. Returns UTC-aware datetime or None."""
    if not date_str:
        return None

    s = date_str.strip()

    for fmt in _DATE_FORMATS:
        try:
            dt = datetime.strptime(s, fmt)
            return dt.replace(tzinfo=timezone.utc)
        except ValueError:
            pass
        # Also try with only the first N characters matching the format
        n = len(fmt)
        if len(s) >= n:
            try:
                dt = datetime.strptime(s[:n], fmt)
                return dt.replace(tzinfo=timezone.utc)
            except ValueError:
                pass
    return None


def check_expiry(expiry_date_str: str) -> str:
    """
    Check whether a certificate is within its validity period.

    Returns:
        "VALID"   — expiry date is in the future
        "EXPIRED" — expiry date has passed
        "UNKNOWN" — date could not be parsed
    """
    dt = parse_date(expiry_date_str)
    if dt is None:
        return "UNKNOWN"
    now = datetime.now(timezone.utc)
    return "VALID" if now < dt else "EXPIRED"


def normalize_issuer_name(raw: str) -> str:
    """Normalize an issuer name for DB lookup (lowercase, strip spaces)."""
    if not raw:
        return ""
    return raw.strip().lower()
