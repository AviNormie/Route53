"""SQLAlchemy ORM models.

Import model modules here so Alembic can discover them via Base.metadata.
"""

from app.db.base import Base

__all__ = ["Base"]
