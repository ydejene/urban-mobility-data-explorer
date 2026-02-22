# backend\security\auth_logic.py
# Security Logic: Handles password hashing, verification, and session token generation for the authentication system.

from werkzeug.security import generate_password_hash, check_password_hash
import secrets
import datetime

class AuthLogic:
    @staticmethod
    def hash_password(password):
        return generate_password_hash(password)

    @staticmethod
    def verify_password(password, hashed_password):
        return check_password_hash(hashed_password, password)

    @staticmethod
    def generate_token():
        # A simple token for simulation - in a real app, use JWT or similar
        return secrets.token_hex(32)
