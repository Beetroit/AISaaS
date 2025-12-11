import base64
import json

from cryptography.fernet import Fernet
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC

from backend.app.config import settings


class EncryptionHelper:
    def __init__(self, key: str):
        # Derive a Fernet key from the provided key string
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=b"salt_for_encryption_key_derivation",
            iterations=100000,
            backend=default_backend(),
        )
        derived_key = base64.urlsafe_b64encode(kdf.derive(key.encode()))
        self.fernet = Fernet(derived_key)

    def encrypt_data(self, data: dict) -> bytes:
        json_data = json.dumps(data).encode("utf-8")
        return self.fernet.encrypt(json_data)

    def decrypt_data(self, encrypted_data: bytes) -> dict:
        decrypted_json_data = self.fernet.decrypt(encrypted_data)
        return json.loads(decrypted_json_data.decode("utf-8"))


# Initialize the encryption helper with the key from settings
encryption_helper = EncryptionHelper(settings.encryption_key)
