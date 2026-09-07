"""Shared FastAPI dependencies."""

from collections.abc import Generator
from typing import Annotated

from fastapi import Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.core.config import Settings, get_settings
from app.core.security import SESSION_COOKIE_NAME
from app.db.session import get_db
from app.models.user import User
from app.services import auth_service


def get_settings_dep() -> Settings:
    return get_settings()


def db_session() -> Generator[Session, None, None]:
    """Yield a request-scoped SQLAlchemy session."""
    yield from get_db()


DbDep = Annotated[Session, Depends(get_db)]
SettingsDep = Annotated[Settings, Depends(get_settings_dep)]


def get_current_user(request: Request, db: DbDep) -> User:
    """Load the authenticated user from the session cookie.

    Missing, unknown, or expired sessions yield HTTP 401. Expired rows are
    removed lazily inside ``auth_service.get_user_for_session``.
    """
    session_id = request.cookies.get(SESSION_COOKIE_NAME)
    user = auth_service.get_user_for_session(db, session_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]


__all__ = [
    "CurrentUser",
    "DbDep",
    "SettingsDep",
    "db_session",
    "get_current_user",
    "get_db",
    "get_settings_dep",
]
