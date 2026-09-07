"""Password hashing and opaque session token helpers (not JWT)."""

from __future__ import annotations

import secrets
from datetime import UTC, datetime, timedelta

from passlib.context import CryptContext

from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

SESSION_COOKIE_NAME = "session_id"


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def generate_session_token() -> str:
    """Return a high-entropy opaque session id stored in the DB and cookie."""
    return secrets.token_urlsafe(32)


def session_expires_at() -> datetime:
    return datetime.now(UTC) + timedelta(minutes=settings.session_expire_minutes)


__all__ = [
    "SESSION_COOKIE_NAME",
    "generate_session_token",
    "hash_password",
    "session_expires_at",
    "verify_password",
]
