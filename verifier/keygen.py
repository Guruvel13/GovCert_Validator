#!/usr/bin/env python3
"""
keygen.py — Generate RSA key pairs for mock Certificate Authorities
Run: python3 verifier/keygen.py
Output: writes .priv.pem and .pub.pem to verifier/keys/ for each CA
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.backends import default_backend

MOCK_CAS = [
    "anna_university",
    "iit_madras",
    "cbse",
    "nic",
    "ugc",
]

def generate_rsa_keypair(name: str, keys_dir: str):
    priv_path = os.path.join(keys_dir, f"{name}.priv.pem")
    pub_path  = os.path.join(keys_dir, f"{name}.pub.pem")

    if os.path.isfile(priv_path) and os.path.isfile(pub_path):
        print(f"  [SKIP] Keys already exist for {name}")
        return

    private_key = rsa.generate_private_key(
        public_exponent=65537,
        key_size=2048,
        backend=default_backend()
    )

    # Write private key
    with open(priv_path, "wb") as f:
        f.write(private_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.TraditionalOpenSSL,
            encryption_algorithm=serialization.NoEncryption()
        ))

    # Write public key
    with open(pub_path, "wb") as f:
        f.write(private_key.public_key().public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo
        ))

    print(f"  [OK]   Generated keys for {name}")


def main():
    keys_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "keys")
    os.makedirs(keys_dir, exist_ok=True)

    print("GovCert Key Generator — generating RSA 2048 key pairs...")
    for ca in MOCK_CAS:
        generate_rsa_keypair(ca, keys_dir)

    print(f"\nDone. Keys stored in: {keys_dir}")


if __name__ == "__main__":
    main()
