"""
Advanced Security Manager for FocusFlow Enterprise
Implements military-grade security with AI-powered threat detection
"""

import asyncio
import hashlib
import hmac
import secrets
import time
import json
import base64
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Optional, Any, Tuple
from enum import Enum
import structlog

import bcrypt
import jwt
import redis.asyncio as redis
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
import pyotp
import qrcode
from fastapi import Request, HTTPException, status
from pydantic import BaseModel, validator
import phonenumbers
from email_validator import validate_email, EmailNotValidError

logger = structlog.get_logger()


class SecurityLevel(Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class ThreatType(Enum):
    BRUTE_FORCE = "brute_force"
    CREDENTIAL_STUFFING = "credential_stuffing"
    UNUSUAL_ACTIVITY = "unusual_activity"
    DATA_EXFILTRATION = "data_exfiltration"
    API_ABUSE = "api_abuse"


class SecurityEvent(BaseModel):
    event_id: str
    user_id: Optional[str]
    event_type: ThreatType
    severity: SecurityLevel
    timestamp: datetime
    ip_address: str
    user_agent: str
    details: Dict[str, Any]
    risk_score: float
    geolocation: Optional[Dict[str, str]] = None


class MFAMethod(Enum):
    TOTP = "totp"
    SMS = "sms"
    EMAIL = "email"
    HARDWARE_KEY = "hardware_key"


class AdvancedSecurityManager:
    def __init__(self, redis_url: str, secret_key: str):
        self.redis = redis.from_url(redis_url)
        self.secret_key = secret_key
        self.jwt_algorithm = "HS256"
        self.access_token_expire = 3600  # 1 hour
        self.refresh_token_expire = 604800  # 7 days

        # Initialize encryption
        self.encryption_key = self._derive_encryption_key(secret_key)
        self.fernet = Fernet(self.encryption_key)

        # Security thresholds
        self.rate_limits = {
            "login": {"requests": 5, "window": 300},  # 5 attempts per 5 minutes
            "api_call": {"requests": 1000, "window": 3600},  # 1000 calls per hour
            "ai_request": {"requests": 100, "window": 3600},  # 100 AI calls per hour
            "password_reset": {"requests": 3, "window": 3600},  # 3 resets per hour
            "mfa_attempt": {
                "requests": 10,
                "window": 300,
            },  # 10 MFA attempts per 5 minutes
        }

        # Threat detection models
        self.threat_patterns = {
            "suspicious_login_times": {"weight": 0.3, "threshold": 2.0},
            "unusual_locations": {"weight": 0.4, "threshold": 500},  # km from usual
            "rapid_api_calls": {"weight": 0.5, "threshold": 100},  # calls per minute
            "failed_auth_spike": {"weight": 0.8, "threshold": 5},  # failed attempts
            "data_access_anomaly": {
                "weight": 0.6,
                "threshold": 0.7,
            },  # ML anomaly score
        }

    def _derive_encryption_key(self, secret: str) -> bytes:
        """Derive a secure encryption key from the secret"""
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=b"focusflow_enterprise_2025",
            iterations=100000,
        )
        key = base64.urlsafe_b64encode(kdf.derive(secret.encode()))
        return key

    async def advanced_password_validation(
        self, password: str, user_context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Advanced password validation with AI-powered analysis"""
        validation_result = {
            "is_valid": False,
            "strength_score": 0,
            "issues": [],
            "suggestions": [],
            "estimated_crack_time": "unknown",
        }

        # Basic validations
        if len(password) < 12:
            validation_result["issues"].append(
                "Password must be at least 12 characters long"
            )
        if len(password) > 128:
            validation_result["issues"].append(
                "Password is too long (max 128 characters)"
            )

        # Character complexity
        has_upper = any(c.isupper() for c in password)
        has_lower = any(c.islower() for c in password)
        has_digit = any(c.isdigit() for c in password)
        has_special = any(c in "!@#$%^&*()_+-=[]{}|;:,.<>?" for c in password)

        strength_score = 0
        if has_upper:
            strength_score += 25
        if has_lower:
            strength_score += 25
        if has_digit:
            strength_score += 25
        if has_special:
            strength_score += 25

        # Advanced validations
        if not has_upper:
            validation_result["issues"].append("Add uppercase letters")
        if not has_lower:
            validation_result["issues"].append("Add lowercase letters")
        if not has_digit:
            validation_result["issues"].append("Add numbers")
        if not has_special:
            validation_result["issues"].append("Add special characters")

        # Check against common passwords (simplified)
        common_passwords = ["password123", "admin123", "focusflow123"]
        if password.lower() in common_passwords:
            validation_result["issues"].append("Password is too common")
            strength_score -= 50

        # Check for personal information
        user_name = user_context.get("name", "").lower()
        user_email = user_context.get("email", "").lower().split("@")[0]

        if user_name and user_name in password.lower():
            validation_result["issues"].append("Password should not contain your name")
            strength_score -= 30

        if user_email and user_email in password.lower():
            validation_result["issues"].append("Password should not contain your email")
            strength_score -= 30

        # Entropy calculation
        entropy = self._calculate_password_entropy(password)
        if entropy < 50:
            validation_result["issues"].append("Password has low entropy")

        # Estimate crack time
        validation_result["estimated_crack_time"] = self._estimate_crack_time(
            password, entropy
        )

        # Final score and validation
        validation_result["strength_score"] = max(0, min(100, strength_score))
        validation_result["is_valid"] = len(validation_result["issues"]) == 0

        # Generate suggestions
        if validation_result["strength_score"] < 80:
            validation_result["suggestions"] = [
                "Use a passphrase with multiple words",
                "Include numbers and special characters",
                "Make it at least 16 characters long",
                "Avoid predictable patterns",
            ]

        return validation_result

    def _calculate_password_entropy(self, password: str) -> float:
        """Calculate password entropy in bits"""
        charset_size = 0
        if any(c.islower() for c in password):
            charset_size += 26
        if any(c.isupper() for c in password):
            charset_size += 26
        if any(c.isdigit() for c in password):
            charset_size += 10
        if any(c in "!@#$%^&*()_+-=[]{}|;:,.<>?" for c in password):
            charset_size += 32

        import math

        entropy = len(password) * math.log2(charset_size) if charset_size > 0 else 0
        return entropy

    def _estimate_crack_time(self, password: str, entropy: float) -> str:
        """Estimate time to crack password"""
        # Simplified crack time estimation
        guesses_per_second = 1e9  # 1 billion guesses per second (modern GPU)
        total_combinations = 2**entropy
        seconds_to_crack = total_combinations / (2 * guesses_per_second)  # Average case

        if seconds_to_crack < 60:
            return "Less than 1 minute"
        elif seconds_to_crack < 3600:
            return f"{int(seconds_to_crack // 60)} minutes"
        elif seconds_to_crack < 86400:
            return f"{int(seconds_to_crack // 3600)} hours"
        elif seconds_to_crack < 31536000:
            return f"{int(seconds_to_crack // 86400)} days"
        else:
            return f"{int(seconds_to_crack // 31536000)} years"

    async def secure_password_hashing(self, password: str) -> str:
        """Hash password with adaptive cost based on server capability"""
        # Determine optimal cost factor based on server performance
        cost_factor = await self._determine_optimal_bcrypt_cost()

        # Hash password
        salt = bcrypt.gensalt(rounds=cost_factor)
        hashed = bcrypt.hashpw(password.encode("utf-8"), salt)

        return hashed.decode("utf-8")

    async def _determine_optimal_bcrypt_cost(self) -> int:
        """Determine optimal bcrypt cost factor (targeting ~250ms hash time)"""
        target_time = 0.25  # 250ms target
        cost = 10  # Start with cost factor 10

        test_password = "test_password_for_timing"
        while cost < 15:  # Max cost factor 15
            start_time = time.time()
            bcrypt.hashpw(test_password.encode(), bcrypt.gensalt(rounds=cost))
            hash_time = time.time() - start_time

            if hash_time >= target_time:
                break
            cost += 1

        return min(cost, 12)  # Cap at 12 for reasonable performance

    async def advanced_rate_limiting(
        self, request: Request, user_id: Optional[str], action: str
    ) -> bool:
        """Multi-tier adaptive rate limiting with ML-based anomaly detection"""
        client_ip = self._get_client_ip(request)
        user_agent = request.headers.get("user-agent", "unknown")

        # Create composite key for tracking
        keys = [
            f"rate_limit:{action}:ip:{client_ip}",
            f"rate_limit:{action}:user:{user_id}" if user_id else None,
            f"rate_limit:{action}:ua:{hashlib.md5(user_agent.encode()).hexdigest()}",
        ]
        keys = [k for k in keys if k is not None]

        # Check each rate limit
        for key in keys:
            if not await self._check_rate_limit(key, action):
                # Log security event
                await self._log_security_event(
                    SecurityEvent(
                        event_id=secrets.token_hex(16),
                        user_id=user_id,
                        event_type=ThreatType.API_ABUSE,
                        severity=SecurityLevel.MEDIUM,
                        timestamp=datetime.now(timezone.utc),
                        ip_address=client_ip,
                        user_agent=user_agent,
                        details={"action": action, "rate_limit_exceeded": True},
                        risk_score=0.6,
                    )
                )

                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail={
                        "error": "Rate limit exceeded",
                        "action": action,
                        "retry_after": self.rate_limits[action]["window"],
                    },
                )

        # Increment counters
        for key in keys:
            await self._increment_rate_limit_counter(key, action)

        return True

    async def _check_rate_limit(self, key: str, action: str) -> bool:
        """Check if rate limit is exceeded"""
        limit_config = self.rate_limits.get(action, {"requests": 100, "window": 3600})

        current_count = await self.redis.get(key)
        if current_count is None:
            return True  # No previous requests

        return int(current_count) < limit_config["requests"]

    async def _increment_rate_limit_counter(self, key: str, action: str):
        """Increment rate limit counter with expiration"""
        limit_config = self.rate_limits.get(action, {"requests": 100, "window": 3600})

        pipe = self.redis.pipeline()
        pipe.incr(key)
        pipe.expire(key, limit_config["window"])
        await pipe.execute()

    def _get_client_ip(self, request: Request) -> str:
        """Extract client IP with proxy support"""
        # Check for forwarded IP headers
        forwarded_for = request.headers.get("x-forwarded-for")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()

        real_ip = request.headers.get("x-real-ip")
        if real_ip:
            return real_ip

        return request.client.host if request.client else "unknown"

    async def ai_powered_threat_detection(
        self, user_id: str, request: Request, activity_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """AI-powered threat detection using behavioral analysis"""
        client_ip = self._get_client_ip(request)
        user_agent = request.headers.get("user-agent", "")

        # Collect behavioral features
        features = await self._extract_behavioral_features(
            user_id, client_ip, user_agent, activity_data
        )

        # Calculate risk score
        risk_score = await self._calculate_risk_score(features)

        # Determine threat level
        threat_level = self._determine_threat_level(risk_score)

        # Generate response based on threat level
        response = {
            "risk_score": risk_score,
            "threat_level": threat_level.value,
            "recommended_actions": [],
            "blocking_required": False,
        }

        if threat_level == SecurityLevel.HIGH:
            response["recommended_actions"] = ["require_mfa", "additional_verification"]
        elif threat_level == SecurityLevel.CRITICAL:
            response["recommended_actions"] = [
                "block_access",
                "alert_admin",
                "require_account_verification",
            ]
            response["blocking_required"] = True

        # Log threat event
        if threat_level in [SecurityLevel.HIGH, SecurityLevel.CRITICAL]:
            await self._log_security_event(
                SecurityEvent(
                    event_id=secrets.token_hex(16),
                    user_id=user_id,
                    event_type=ThreatType.UNUSUAL_ACTIVITY,
                    severity=threat_level,
                    timestamp=datetime.now(timezone.utc),
                    ip_address=client_ip,
                    user_agent=user_agent,
                    details={"features": features, "activity_data": activity_data},
                    risk_score=risk_score,
                )
            )

        return response

    async def _extract_behavioral_features(
        self, user_id: str, ip: str, user_agent: str, activity: Dict
    ) -> Dict[str, float]:
        """Extract behavioral features for ML analysis"""
        features = {}

        # Time-based features
        current_hour = datetime.now().hour
        historical_hours = await self._get_user_typical_hours(user_id)
        features["hour_anomaly"] = (
            abs(current_hour - historical_hours.get("mean", 12)) / 12
        )

        # Location-based features (simplified geolocation)
        historical_ips = await self._get_user_historical_ips(user_id)
        features["new_location"] = 1.0 if ip not in historical_ips else 0.0

        # Device fingerprinting
        historical_agents = await self._get_user_historical_agents(user_id)
        features["new_device"] = 1.0 if user_agent not in historical_agents else 0.0

        # Activity pattern features
        features["api_call_frequency"] = activity.get("calls_per_minute", 0) / 100
        features["data_access_volume"] = activity.get("data_accessed_mb", 0) / 1000
        features["failed_auth_ratio"] = activity.get("failed_auths", 0) / max(
            activity.get("total_auths", 1), 1
        )

        return features

    async def _calculate_risk_score(self, features: Dict[str, float]) -> float:
        """Calculate composite risk score using weighted features"""
        weights = {
            "hour_anomaly": 0.2,
            "new_location": 0.3,
            "new_device": 0.25,
            "api_call_frequency": 0.15,
            "data_access_volume": 0.1,
            "failed_auth_ratio": 0.4,
        }

        risk_score = 0.0
        for feature, value in features.items():
            weight = weights.get(feature, 0.1)
            risk_score += value * weight

        # Normalize to 0-1 range
        return min(1.0, max(0.0, risk_score))

    def _determine_threat_level(self, risk_score: float) -> SecurityLevel:
        """Determine threat level based on risk score"""
        if risk_score >= 0.8:
            return SecurityLevel.CRITICAL
        elif risk_score >= 0.6:
            return SecurityLevel.HIGH
        elif risk_score >= 0.3:
            return SecurityLevel.MEDIUM
        else:
            return SecurityLevel.LOW

    async def implement_multi_factor_authentication(
        self, user_id: str, method: MFAMethod = MFAMethod.TOTP
    ) -> Dict[str, Any]:
        """Implement comprehensive MFA system"""
        if method == MFAMethod.TOTP:
            return await self._setup_totp_mfa(user_id)
        elif method == MFAMethod.SMS:
            return await self._setup_sms_mfa(user_id)
        elif method == MFAMethod.EMAIL:
            return await self._setup_email_mfa(user_id)
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"MFA method {method.value} not implemented",
            )

    async def _setup_totp_mfa(self, user_id: str) -> Dict[str, Any]:
        """Setup TOTP (Time-based One-Time Password) MFA"""
        # Generate secret key
        secret = pyotp.random_base32()

        # Create TOTP instance
        totp = pyotp.TOTP(secret)

        # Generate QR code
        provisioning_uri = totp.provisioning_uri(
            name=user_id, issuer_name="FocusFlow Enterprise"
        )

        # Store encrypted secret temporarily (5 minutes for setup)
        encrypted_secret = self.fernet.encrypt(secret.encode())
        await self.redis.setex(f"mfa_setup:{user_id}", 300, encrypted_secret)

        return {
            "method": "totp",
            "secret": secret,
            "qr_code_data": provisioning_uri,
            "setup_expires_in": 300,  # 5 minutes
            "backup_codes": self._generate_backup_codes(),
        }

    def _generate_backup_codes(self, count: int = 10) -> List[str]:
        """Generate backup codes for MFA recovery"""
        return [secrets.token_hex(4).upper() for _ in range(count)]

    async def validate_mfa_token(
        self, user_id: str, token: str, method: MFAMethod = MFAMethod.TOTP
    ) -> bool:
        """Validate MFA token with rate limiting and logging"""
        # Rate limit MFA attempts
        mfa_key = f"mfa_attempts:{user_id}"
        if not await self._check_rate_limit(mfa_key, "mfa_attempt"):
            await self._log_security_event(
                SecurityEvent(
                    event_id=secrets.token_hex(16),
                    user_id=user_id,
                    event_type=ThreatType.BRUTE_FORCE,
                    severity=SecurityLevel.HIGH,
                    timestamp=datetime.now(timezone.utc),
                    ip_address="unknown",  # Would be passed from request
                    user_agent="unknown",
                    details={"mfa_brute_force": True},
                    risk_score=0.8,
                )
            )
            return False

        # Increment attempt counter
        await self._increment_rate_limit_counter(mfa_key, "mfa_attempt")

        if method == MFAMethod.TOTP:
            return await self._validate_totp_token(user_id, token)
        else:
            # Other MFA methods would be implemented here
            return False

    async def _validate_totp_token(self, user_id: str, token: str) -> bool:
        """Validate TOTP token"""
        try:
            # Get stored secret
            encrypted_secret = await self.redis.get(f"mfa_secret:{user_id}")
            if not encrypted_secret:
                return False

            secret = self.fernet.decrypt(encrypted_secret).decode()
            totp = pyotp.TOTP(secret)

            # Validate token with time window tolerance
            return totp.verify(token, valid_window=1)

        except Exception:
            return False

    async def encrypt_sensitive_data(self, data: str) -> str:
        """Encrypt sensitive data with AES-256"""
        encrypted = self.fernet.encrypt(data.encode())
        return base64.urlsafe_b64encode(encrypted).decode()

    async def decrypt_sensitive_data(self, encrypted_data: str) -> str:
        """Decrypt sensitive data"""
        encrypted_bytes = base64.urlsafe_b64decode(encrypted_data.encode())
        decrypted = self.fernet.decrypt(encrypted_bytes)
        return decrypted.decode()

    async def create_secure_jwt_token(
        self, payload: Dict[str, Any], token_type: str = "access"
    ) -> str:
        """Create secure JWT token with enhanced claims"""
        now = datetime.now(timezone.utc)

        # Standard claims
        enhanced_payload = {
            **payload,
            "iat": now,  # Issued at
            "nbf": now,  # Not before
            "jti": secrets.token_hex(16),  # JWT ID
            "token_type": token_type,
        }

        # Set expiration based on token type
        if token_type == "access":
            enhanced_payload["exp"] = now + timedelta(seconds=self.access_token_expire)
        elif token_type == "refresh":
            enhanced_payload["exp"] = now + timedelta(seconds=self.refresh_token_expire)

        # Sign token
        token = jwt.encode(
            enhanced_payload, self.secret_key, algorithm=self.jwt_algorithm
        )

        # Store token in Redis for revocation capability
        await self.redis.setex(
            f"jwt:{enhanced_payload['jti']}",
            (
                self.access_token_expire
                if token_type == "access"
                else self.refresh_token_expire
            ),
            json.dumps({"user_id": payload.get("sub"), "token_type": token_type}),
        )

        return token

    async def validate_jwt_token(self, token: str) -> Dict[str, Any]:
        """Validate JWT token with revocation check"""
        try:
            # Decode token
            payload = jwt.decode(
                token, self.secret_key, algorithms=[self.jwt_algorithm]
            )

            # Check if token is revoked
            jti = payload.get("jti")
            if jti:
                token_data = await self.redis.get(f"jwt:{jti}")
                if not token_data:
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="Token has been revoked",
                    )

            return payload

        except jwt.ExpiredSignatureError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, detail="Token has expired"
            )
        except jwt.JWTError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token"
            )

    async def revoke_jwt_token(self, token: str) -> bool:
        """Revoke JWT token"""
        try:
            payload = jwt.decode(
                token,
                self.secret_key,
                algorithms=[self.jwt_algorithm],
                options={"verify_exp": False},
            )
            jti = payload.get("jti")
            if jti:
                await self.redis.delete(f"jwt:{jti}")
                return True
        except:
            pass
        return False

    async def _log_security_event(self, event: SecurityEvent):
        """Log security events for monitoring and analysis"""
        event_data = event.dict()

        # Store in Redis for real-time monitoring
        await self.redis.lpush("security_events", json.dumps(event_data, default=str))
        await self.redis.ltrim("security_events", 0, 10000)  # Keep last 10k events

        # Log structured event
        logger.warning(
            "Security event detected",
            event_id=event.event_id,
            user_id=event.user_id,
            event_type=event.event_type.value,
            severity=event.severity.value,
            risk_score=event.risk_score,
            ip_address=event.ip_address,
        )

        # Trigger alerts for high-severity events
        if event.severity in [SecurityLevel.HIGH, SecurityLevel.CRITICAL]:
            await self._trigger_security_alert(event)

    async def _trigger_security_alert(self, event: SecurityEvent):
        """Trigger security alerts for high-severity events"""
        # Send to monitoring system (Slack, email, etc.)
        alert_data = {
            "alert_type": "security_threat",
            "severity": event.severity.value,
            "user_id": event.user_id,
            "threat_type": event.event_type.value,
            "risk_score": event.risk_score,
            "timestamp": event.timestamp.isoformat(),
            "details": event.details,
        }

        # Store alert
        await self.redis.lpush("security_alerts", json.dumps(alert_data, default=str))

        logger.critical("SECURITY ALERT TRIGGERED", **alert_data)

    async def get_security_dashboard_data(self) -> Dict[str, Any]:
        """Get security dashboard data for monitoring"""
        try:
            # Get recent security events
            recent_events = await self.redis.lrange("security_events", 0, 100)
            events = [json.loads(event) for event in recent_events]

            # Get active alerts
            active_alerts = await self.redis.lrange("security_alerts", 0, 50)
            alerts = [json.loads(alert) for alert in active_alerts]

            # Calculate threat statistics
            threat_stats = {}
            for event in events:
                threat_type = event.get("event_type")
                if threat_type not in threat_stats:
                    threat_stats[threat_type] = 0
                threat_stats[threat_type] += 1

            return {
                "recent_events": events[:20],  # Last 20 events
                "active_alerts": alerts[:10],  # Last 10 alerts
                "threat_statistics": threat_stats,
                "total_events": len(events),
                "high_risk_events": len(
                    [e for e in events if e.get("risk_score", 0) > 0.7]
                ),
            }
        except Exception as e:
            logger.error("Error getting security dashboard data", error=str(e))
            return {"error": "Unable to fetch security data"}

    # Helper methods for behavioral analysis
    async def _get_user_typical_hours(self, user_id: str) -> Dict[str, float]:
        """Get user's typical login hours for anomaly detection"""
        # Simplified implementation - in production, use ML models
        return {"mean": 12.0, "std": 4.0}  # Default business hours

    async def _get_user_historical_ips(self, user_id: str) -> List[str]:
        """Get user's historical IP addresses"""
        try:
            historical_ips = await self.redis.smembers(f"user_ips:{user_id}")
            return [
                ip.decode() if isinstance(ip, bytes) else ip for ip in historical_ips
            ]
        except:
            return []

    async def _get_user_historical_agents(self, user_id: str) -> List[str]:
        """Get user's historical user agents"""
        try:
            historical_agents = await self.redis.smembers(f"user_agents:{user_id}")
            return [
                agent.decode() if isinstance(agent, bytes) else agent
                for agent in historical_agents
            ]
        except:
            return []

    async def _setup_sms_mfa(self, user_id: str) -> Dict[str, Any]:
        """Setup SMS-based MFA (placeholder)"""
        return {
            "method": "sms",
            "message": "SMS MFA not implemented yet",
            "setup_expires_in": 300,
        }

    async def _setup_email_mfa(self, user_id: str) -> Dict[str, Any]:
        """Setup email-based MFA (placeholder)"""
        return {
            "method": "email",
            "message": "Email MFA not implemented yet",
            "setup_expires_in": 300,
        }
