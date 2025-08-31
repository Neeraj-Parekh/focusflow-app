import jwt
import bcrypt
from cryptography.fernet import Fernet
import secrets
import hashlib
from datetime import datetime, timedelta
from typing import Dict, Optional, Any
from passlib.context import CryptContext
from jose import JWTError, jwt as jose_jwt

from .config import settings


class SecurityManager:
    def __init__(self):
        self.jwt_secret = settings.SECRET_KEY
        self.algorithm = settings.ALGORITHM
        self.access_token_expire_minutes = settings.ACCESS_TOKEN_EXPIRE_MINUTES

        # Initialize Fernet for data encryption
        try:
            self.fernet = Fernet(settings.ENCRYPTION_KEY.encode())
        except Exception:
            # Generate a new key if the provided one is invalid
            key = Fernet.generate_key()
            self.fernet = Fernet(key)
            print(f"Generated new encryption key: {key.decode()}")

        # Password hashing context
        self.pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

    def create_access_token(
        self, data: Dict[str, Any], expires_delta: Optional[timedelta] = None
    ) -> str:
        """Create JWT access token"""
        to_encode = data.copy()

        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(
                minutes=self.access_token_expire_minutes
            )

        to_encode.update({"exp": expire, "iat": datetime.utcnow()})

        encoded_jwt = jose_jwt.encode(
            to_encode, self.jwt_secret, algorithm=self.algorithm
        )
        return encoded_jwt

    def verify_token(self, token: str) -> Optional[Dict[str, Any]]:
        """Verify and decode JWT token"""
        try:
            payload = jose_jwt.decode(
                token, self.jwt_secret, algorithms=[self.algorithm]
            )
            return payload
        except JWTError:
            return None

    def hash_password(self, password: str) -> str:
        """Securely hash a password"""
        return self.pwd_context.hash(password)

    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """Verify a password against its hash"""
        return self.pwd_context.verify(plain_password, hashed_password)

    def encrypt_sensitive_data(self, data: str) -> str:
        """Encrypt sensitive data"""
        if isinstance(data, str):
            data = data.encode()
        encrypted = self.fernet.encrypt(data)
        return encrypted.decode()

    def decrypt_sensitive_data(self, encrypted_data: str) -> str:
        """Decrypt sensitive data"""
        if isinstance(encrypted_data, str):
            encrypted_data = encrypted_data.encode()
        decrypted = self.fernet.decrypt(encrypted_data)
        return decrypted.decode()

    def validate_password_strength(self, password: str) -> Dict[str, Any]:
        """Validate password strength and return requirements"""
        requirements = {
            "min_length": len(password) >= 8,
            "has_uppercase": any(c.isupper() for c in password),
            "has_lowercase": any(c.islower() for c in password),
            "has_digit": any(c.isdigit() for c in password),
            "has_special": any(c in "!@#$%^&*()_+-=[]{}|;:,.<>?" for c in password),
        }

        is_valid = all(requirements.values())

        return {
            "is_valid": is_valid,
            "requirements": requirements,
            "score": sum(requirements.values()) / len(requirements),
            "feedback": self._get_password_feedback(requirements),
        }

    def _get_password_feedback(self, requirements: Dict[str, bool]) -> list[str]:
        """Generate password improvement feedback"""
        feedback = []

        if not requirements["min_length"]:
            feedback.append("Password must be at least 8 characters long")
        if not requirements["has_uppercase"]:
            feedback.append("Include at least one uppercase letter")
        if not requirements["has_lowercase"]:
            feedback.append("Include at least one lowercase letter")
        if not requirements["has_digit"]:
            feedback.append("Include at least one number")
        if not requirements["has_special"]:
            feedback.append("Include at least one special character")

        return feedback

    def generate_secure_token(self, length: int = 32) -> str:
        """Generate a secure random token"""
        return secrets.token_urlsafe(length)

    def generate_api_key(self, user_id: str) -> str:
        """Generate API key for a user"""
        # Combine user ID with timestamp and random data
        data = f"{user_id}:{datetime.utcnow().isoformat()}:{secrets.token_hex(16)}"

        # Hash the data
        api_key = hashlib.sha256(data.encode()).hexdigest()

        return f"ff_{api_key[:40]}"  # FocusFlow prefix + 40 chars

    def hash_api_key(self, api_key: str) -> str:
        """Hash API key for storage"""
        return hashlib.sha256(api_key.encode()).hexdigest()

    def verify_api_key(self, api_key: str, stored_hash: str) -> bool:
        """Verify API key against stored hash"""
        return hashlib.sha256(api_key.encode()).hexdigest() == stored_hash

    def sanitize_input(self, input_data: str) -> str:
        """Sanitize user input to prevent injection attacks"""
        if not isinstance(input_data, str):
            return input_data

        # Remove potentially dangerous characters
        dangerous_chars = ["<", ">", '"', "'", "&", ";", "(", ")", "|", "`"]
        sanitized = input_data

        for char in dangerous_chars:
            sanitized = sanitized.replace(char, "")

        # Limit length
        sanitized = sanitized[:1000]  # Prevent extremely long inputs

        return sanitized.strip()

    def rate_limit_key(self, identifier: str, endpoint: str) -> str:
        """Generate rate limiting key"""
        return f"rate_limit:{endpoint}:{identifier}"

    def create_csrf_token(self, session_id: str) -> str:
        """Create CSRF token for form protection"""
        data = f"{session_id}:{datetime.utcnow().isoformat()}:{secrets.token_hex(16)}"
        return hashlib.sha256(data.encode()).hexdigest()

    def verify_csrf_token(
        self, token: str, session_id: str, max_age: int = 3600
    ) -> bool:
        """Verify CSRF token (simplified implementation)"""
        # In a real implementation, you'd store the token with timestamp
        # and verify it hasn't expired and matches the session
        return len(token) == 64 and token.isalnum()  # Basic validation

    def mask_sensitive_data(
        self, data: str, mask_char: str = "*", visible_chars: int = 4
    ) -> str:
        """Mask sensitive data for logging/display"""
        if not data or len(data) <= visible_chars:
            return mask_char * len(data) if data else ""

        return data[:visible_chars] + mask_char * (len(data) - visible_chars)

    def generate_2fa_secret(self) -> str:
        """Generate 2FA secret key"""
        return secrets.token_hex(16)

    def verify_2fa_token(self, secret: str, token: str) -> bool:
        """Verify 2FA token (TOTP)"""
        # This is a simplified implementation
        # In production, use a proper TOTP library like pyotp
        import time
        import hmac

        # Get current time window (30 seconds)
        time_window = int(time.time()) // 30

        # Generate expected token for current window
        message = str(time_window).encode()
        expected = hmac.new(secret.encode(), message, hashlib.sha256).hexdigest()[:6]

        return token == expected


# Create global security manager instance
security = SecurityManager()
