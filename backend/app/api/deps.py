"""Shared FastAPI dependencies."""

from collections.abc import Generator

from sqlalchemy.orm import Session

from app.core.config import Settings, get_settings
from app.db.session import get_db


def get_settings_dep() -> Settings:
    return get_settings()


def db_session() -> Generator[Session, None, None]:
    """Yield a request-scoped SQLAlchemy session."""
    yield from get_db()


__all__ = [
    "db_session",
    "get_db",
    "get_settings_dep",
]
