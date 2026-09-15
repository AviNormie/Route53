"""Filesystem helpers for SQLite database paths."""

from __future__ import annotations

from pathlib import Path


def ensure_sqlite_parent_dir(database_url: str) -> None:
    """Create the parent directory for a SQLite file URL if needed.

    Handles common forms:
    - sqlite:///./data/route53.db
    - sqlite:///data/route53.db
    - sqlite:////absolute/path/db.sqlite
    """
    if not database_url.startswith("sqlite:"):
        return

    # sqlite:///relative  → 3 slashes; sqlite:////absolute → 4
    raw = database_url.removeprefix("sqlite:///")
    if raw.startswith("/"):
        # Absolute path (sqlite:////tmp/x.db → /tmp/x.db after one strip leaves /tmp/...)
        db_path = Path(raw)
    else:
        db_path = Path(raw)

    parent = db_path.parent
    if str(parent) not in {"", "."}:
        parent.mkdir(parents=True, exist_ok=True)
