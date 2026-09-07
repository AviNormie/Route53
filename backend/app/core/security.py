"""Password hashing and session token helpers."""

from __future__ import annotations

import secrets
from datetime import UTC, datetime, timedelta

from itsdangerous import BadSignature, SignatureExpired, URLSafeTimedSerializer
from passlib.context import CryptContext

from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def _serializer() -> URLSafeTimedSerializer:
    return URLSafeTimedSerializer(
        secret_key=settings.session_secret,
        salt="route53-clone-session",
    )


def create_session_token(subject: str) -> str:
    """Create a signed session token for the given subject (e.g. user id)."""
    payload = {
        "sub": subject,
        "jti": secrets.token_urlsafe(16),
        "iat": datetime.now(UTC).isoformat(),
    }
    return _serializer().dumps(payload)


def decode_session_token(
    token: str,
    *,
    max_age_seconds: int | None = None,
) -> dict[str, str]:
    """Decode and verify a session token.

    Raises:
        SignatureExpired: if the token is older than the allowed age.
        BadSignature: if the token is invalid.
    """
    age = max_age_seconds
    if age is None:
        age = settings.session_expire_minutes * 60
    data = _serializer().loads(token, max_age=age)
    if not isinstance(data, dict) or "sub" not in data:
        raise BadSignature("Invalid session payload")
    return data


def session_expires_at() -> datetime:
    return datetime.now(UTC) + timedelta(minutes=settings.session_expire_minutes)


__all__ = [
    "BadSignature",
    "SignatureExpired",
    "create_session_token",
    "decode_session_token",
    "hash_password",
    "session_expires_at",
    "verify_password",
]
