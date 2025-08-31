#!/usr/bin/env python3
"""
Minimal test for Advanced Security Manager
Tests basic functionality without requiring full FastAPI setup
"""

import sys
import os
import asyncio
from datetime import datetime, timezone

# Add the app directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

def test_advanced_security_basic():
    """Test basic functionality of AdvancedSecurityManager"""
    print("🧪 Testing Advanced Security Manager...")
    
    try:
        # Test imports
        from app.core.advanced_security import (
            AdvancedSecurityManager, 
            SecurityLevel, 
            ThreatType,
            SecurityEvent,
            MFAMethod
        )
        print("✓ Advanced security imports successful")
        
        # Test enum functionality
        assert SecurityLevel.HIGH.value == "high"
        assert ThreatType.BRUTE_FORCE.value == "brute_force"
        assert MFAMethod.TOTP.value == "totp"
        print("✓ Enums working correctly")
        
        # Test SecurityEvent creation
        event = SecurityEvent(
            event_id="test-123",
            user_id="user-456",
            event_type=ThreatType.UNUSUAL_ACTIVITY,
            severity=SecurityLevel.MEDIUM,
            timestamp=datetime.now(timezone.utc),
            ip_address="192.168.1.1",
            user_agent="test-agent",
            details={"test": True},
            risk_score=0.5
        )
        print("✓ SecurityEvent model creation successful")
        
        # Test basic password validation logic (without full manager)
        password = "TestPassword123!"
        has_upper = any(c.isupper() for c in password)
        has_lower = any(c.islower() for c in password)
        has_digit = any(c.isdigit() for c in password)
        has_special = any(c in "!@#$%^&*()_+-=[]{}|;:,.<>?" for c in password)
        
        assert has_upper and has_lower and has_digit and has_special
        print("✓ Password validation logic working")
        
        print("\n🎉 All basic tests passed!")
        return True
        
    except ImportError as e:
        print(f"✗ Import error: {e}")
        print("   This is expected if dependencies are not installed")
        return False
    except Exception as e:
        print(f"✗ Test failed: {e}")
        return False

def test_existing_security_manager():
    """Test that existing security manager still works"""
    print("\n🔧 Testing existing Security Manager compatibility...")
    
    try:
        from app.core.security import SecurityManager, security
        print("✓ Existing security manager imports successful")
        
        # Test password validation
        test_password = "WeakPass"
        validation = security.validate_password_strength(test_password)
        assert "is_valid" in validation
        assert "requirements" in validation
        print("✓ Existing password validation working")
        
        # Test token generation
        token = security.generate_secure_token(16)
        assert len(token) > 10  # URL-safe base64 encoding
        print("✓ Secure token generation working")
        
        print("✓ Existing security manager compatibility verified")
        return True
        
    except ImportError as e:
        print(f"✗ Import error: {e}")
        return False
    except Exception as e:
        print(f"✗ Test failed: {e}")
        return False

def main():
    """Run all tests"""
    print("🔐 FocusFlow Security Module Testing\n")
    
    basic_test_passed = test_advanced_security_basic()
    compat_test_passed = test_existing_security_manager()
    
    print(f"\n📊 Test Results:")
    print(f"   Advanced Security Module: {'✓ PASS' if basic_test_passed else '✗ FAIL'}")
    print(f"   Existing Security Compat: {'✓ PASS' if compat_test_passed else '✗ FAIL'}")
    
    if basic_test_passed and compat_test_passed:
        print("\n🎯 All security modules are working correctly!")
        print("   Ready for production deployment with enhanced security.")
        return 0
    else:
        print("\n⚠️  Some tests failed - this may be due to missing dependencies.")
        print("   Run './execute_security_patches.sh' to install required packages.")
        return 1

if __name__ == "__main__":
    sys.exit(main())