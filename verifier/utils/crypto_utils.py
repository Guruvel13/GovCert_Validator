"""
crypto_utils.py — RSA signature verification utilities
"""
import base64
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import padding
from cryptography.hazmat.backends import default_backend
from cryptography.exceptions import InvalidSignature


def load_public_key(pem_string: str):
    """Load an RSA public key from a PEM string."""
    return serialization.load_pem_public_key(
        pem_string.encode("utf-8"),
        backend=default_backend()
    )


def verify_signature(data: bytes, signature_b64: str, public_key_pem: str) -> bool:
    """
    Verify an RSA-SHA256 signature.

    Args:
        data:           The original data that was signed (bytes)
        signature_b64:  Base64-encoded signature produced during signing
        public_key_pem: PEM string of the issuer's public key

    Returns:
        True if signature is valid, False otherwise
    """
    try:
        public_key = load_public_key(public_key_pem)
        signature = base64.b64decode(signature_b64)
        public_key.verify(
            signature,
            data,
            padding.PKCS1v15(),
            hashes.SHA256()
        )
        return True
    except (InvalidSignature, Exception):
        return False


def sign_data(data: bytes, private_key_pem: str) -> str:
    """
    Sign data with an RSA private key (used in keygen/demo tools).

    Returns:
        Base64-encoded signature string
    """
    private_key = serialization.load_pem_private_key(
        private_key_pem.encode("utf-8"),
        password=None,
        backend=default_backend()
    )
    signature = private_key.sign(
        data,
        padding.PKCS1v15(),
        hashes.SHA256()
    )
    return base64.b64encode(signature).decode("utf-8")
