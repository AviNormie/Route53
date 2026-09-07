"""Authentication business logic (session-based, not JWT)."""

from __future__ import annotations

from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, selectinload

from app.core.security import (
    generate_session_token,
    hash_password,
    session_expires_at,
    verify_password,
)
from app.models.session import Session as AuthSession
from app.models.user import User


class AuthError(Exception):
    """Raised when credentials or the session cookie are invalid."""


class EmailAlreadyRegisteredError(Exception):
    """Raised when signup email is already taken."""


def _ensure_aware(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=UTC)
    return value


def authenticate_user(db: Session, email: str, password: str) -> User:
    user = db.scalar(select(User).where(User.email == email.lower()))
    if user is None or not verify_password(password, user.password_hash):
        raise AuthError("Invalid email or password")
    return user


def create_session(db: Session, user: User) -> AuthSession:
    auth_session = AuthSession(
        id=generate_session_token(),
        user_id=user.id,
        expires_at=session_expires_at(),
    )
    db.add(auth_session)
    db.commit()
    db.refresh(auth_session)
    return auth_session


def delete_session(db: Session, session_id: str | None) -> None:
    if not session_id:
        return
    auth_session = db.get(AuthSession, session_id)
    if auth_session is not None:
        db.delete(auth_session)
        db.commit()


def get_user_for_session(db: Session, session_id: str | None) -> User | None:
    """Resolve a session cookie to a user.

    Expired sessions are deleted lazily on lookup. A scheduled cleanup job
    could sweep old rows later; not needed for this assignment scale.
    """
    if not session_id:
        return None

    auth_session = db.scalar(
        select(AuthSession)
        .where(AuthSession.id == session_id)
        .options(selectinload(AuthSession.user))
    )
    if auth_session is None:
        return None

    if _ensure_aware(auth_session.expires_at) <= datetime.now(UTC):
        db.delete(auth_session)
        db.commit()
        return None

    return auth_session.user


def login(db: Session, email: str, password: str) -> tuple[User, AuthSession]:
    user = authenticate_user(db, email=email.strip().lower(), password=password)
    auth_session = create_session(db, user)
    return user, auth_session


def signup(db: Session, email: str, password: str) -> tuple[User, AuthSession]:
    normalized = email.strip().lower()
    existing = db.scalar(select(User).where(User.email == normalized))
    if existing is not None:
        raise EmailAlreadyRegisteredError("An account with this email already exists")

    user = User(email=normalized, password_hash=hash_password(password))
    db.add(user)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise EmailAlreadyRegisteredError(
            "An account with this email already exists"
        ) from None
    db.refresh(user)

    auth_session = create_session(db, user)
    return user, auth_session
