"""Alembic migration environment.

Configured against `app.db.base.Base` and `DATABASE_URL` from settings.
"""

from logging.config import fileConfig

# Import models package so model metadata is registered on Base when models exist.
import app.models  # noqa: F401
from alembic import context
from app.core.config import settings
from app.db.base import Base
from app.db.session import engine

config = context.config
# Keep alembic.ini in sync for offline tooling, but online uses the app engine
# (MySQL SSL / mysql+pymysql normalization).
config.set_main_option("sqlalchemy.url", settings.database_url)

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        render_as_batch=True,
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    with engine.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            render_as_batch=True,
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
