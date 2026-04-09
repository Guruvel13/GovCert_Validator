"""
hash_utils.py — SHA-256 hashing utilities
"""
import hashlib


def compute_sha256(data: bytes) -> str:
    """Compute SHA-256 hex digest of given bytes."""
    return hashlib.sha256(data).hexdigest()


def compute_file_hash(path: str) -> str:
    """Compute SHA-256 of a file at the given path, streaming for large files."""
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(8192), b""):
            h.update(chunk)
    return h.hexdigest()
