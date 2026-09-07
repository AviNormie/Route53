import ssl
from collections.abc import Generator
from pathlib import Path
from urllib.parse import parse_qs, urlencode, urlparse, urlunparse

from sqlalchemy import create_engine, event
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import settings

_SSL_QUERY_KEYS = {"ssl-mode", "sslmode"}


def _ssl_mode_from_query(query: dict[str, list[str]]) -> str | None:
    for key, values in query.items():
        if key.lower().replace("_", "-") in _SSL_QUERY_KEYS and values:
            return values[0].upper()
    return None


def _build_ssl_context(mode: str | None, ca_path: str | None) -> ssl.SSLContext:
    """Build TLS context for MySQL.

    Aiven ``ssl-mode=REQUIRED`` encrypts traffic but uses a private CA, so system
    trust verification fails unless ``MYSQL_SSL_CA`` (or VERIFY_*) is provided.
    """
    if ca_path and Path(ca_path).is_file():
        ctx = ssl.create_default_context(cafile=ca_path)
        if mode in {"VERIFY_IDENTITY"}:
            ctx.check_hostname = True
            ctx.verify_mode = ssl.CERT_REQUIRED
        return ctx

    if mode in {"VERIFY_CA", "VERIFY_IDENTITY"}:
        ctx = ssl.create_default_context()
        if mode == "VERIFY_IDENTITY":
            ctx.check_hostname = True
        return ctx

    # REQUIRED / default for Aiven: encrypt, do not verify private CA chain
    ctx = ssl.SSLContext(ssl.PROTOCOL_TLS_CLIENT)
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    return ctx


def _normalize_database_url(url: str) -> tuple[str, dict]:
    """Return SQLAlchemy URL + connect_args (SQLite / MySQL SSL aware)."""
    if url.startswith("sqlite"):
        return url, {"check_same_thread": False}

    # Aiven-style mysql://…?ssl-mode=REQUIRED → mysql+pymysql://…
    if url.startswith("mysql://"):
        url = "mysql+pymysql://" + url.removeprefix("mysql://")

    parsed = urlparse(url)
    query = parse_qs(parsed.query)
    ssl_mode = _ssl_mode_from_query(query)
    needs_ssl = bool(ssl_mode) or "aivencloud.com" in (parsed.hostname or "")

    cleaned = {
        k: v[0] if len(v) == 1 else v
        for k, v in query.items()
        if k.lower().replace("_", "-") not in _SSL_QUERY_KEYS
    }
    clean_url = urlunparse(parsed._replace(query=urlencode(cleaned, doseq=True)))

    connect_args: dict = {}
    if needs_ssl or cleaned.get("ssl") in {"true", "True", "1"}:
        ca_path = getattr(settings, "mysql_ssl_ca", None) or cleaned.get("ssl_ca")
        if isinstance(ca_path, list):
            ca_path = ca_path[0] if ca_path else None
        connect_args["ssl"] = _build_ssl_context(ssl_mode or "REQUIRED", ca_path)

    return clean_url, connect_args


db_url, connect_args = _normalize_database_url(settings.database_url)

engine = create_engine(
    db_url,
    connect_args=connect_args,
    pool_pre_ping=True,
)


@event.listens_for(Engine, "connect")
def _set_sqlite_pragma(dbapi_connection: object, _connection_record: object) -> None:
    """Enable SQLite foreign keys so ON DELETE CASCADE is enforced."""
    if dbapi_connection.__class__.__module__.startswith("sqlite3"):
        cursor = dbapi_connection.cursor()  # type: ignore[attr-defined]
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()


SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)


def get_db() -> Generator[Session, None, None]:
    """Yield a request-scoped session; roll back on error and always close."""
    db = SessionLocal()
    try:
        yield db
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()
