#!/bin/sh
set -e

cd /app 2>/dev/null || true
mkdir -p /app/data

# Create SQLite parent dir when needed (no migrations on boot — run those once via Shell).
python -c "from app.core.config import settings; from app.db.paths import ensure_sqlite_parent_dir; ensure_sqlite_parent_dir(settings.database_url)"

exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}"
