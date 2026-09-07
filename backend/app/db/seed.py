"""Seed the database with the assignment demo user.

Run from the backend directory:

    poetry run python -m app.db.seed
"""

from __future__ import annotations

import sys

from sqlalchemy import select

from app.core.config import settings
from app.core.security import hash_password
from app.db.session import SessionLocal, engine
from app.models.user import User


def seed_demo_user() -> User:
    email = settings.demo_user_email.strip().lower()
    password = settings.demo_user_password

    with SessionLocal() as db:
        existing = db.scalar(select(User).where(User.email == email))
        if existing is not None:
            print(f"Demo user already exists: {existing.email} (id={existing.id})")
            return existing

        user = User(email=email, password_hash=hash_password(password))
        db.add(user)
        db.commit()
        db.refresh(user)
        print(f"Created demo user: {user.email} (id={user.id})")
        return user


def main() -> int:
    # Ensure SQLite parent directory exists when using the default URL.
    if settings.database_url.startswith("sqlite:///./"):
        from pathlib import Path

        relative = settings.database_url.removeprefix("sqlite:///./")
        Path(relative).parent.mkdir(parents=True, exist_ok=True)

    # Touch the engine so connection errors surface early.
    with engine.connect() as connection:
        connection.exec_driver_sql("SELECT 1")

    seed_demo_user()
    return 0


if __name__ == "__main__":
    sys.exit(main())
