#!/bin/sh
set -e

cd /app 2>/dev/null || true

# Ensure SQLite parent dir exists before alembic/seed (uvicorn lifespan is too late).
mkdir -p /app/data
python - <<'PY'
from app.core.config import settings
from app.db.paths import ensure_sqlite_parent_dir

url = settings.database_url
ensure_sqlite_parent_dir(url)
# Log dialect only (never print credentials).
if url.startswith("sqlite"):
    print(f"DATABASE_URL dialect=sqlite path_prefix={url.split('://', 1)[-1][:40]}")
    print(
        "WARNING: Using SQLite on Render. Data is ephemeral unless a disk is mounted. "
        "Prefer Aiven MySQL: set DATABASE_URL=mysql://USER:PASS@HOST:PORT/defaultdb?ssl-mode=REQUIRED"
    )
elif url.startswith("mysql"):
    print("DATABASE_URL dialect=mysql")
else:
    print(f"DATABASE_URL dialect={url.split(':', 1)[0]}")
PY

echo "Running database migrations..."
alembic upgrade head

echo "Seeding demo user (idempotent)..."
python -m app.db.seed

echo "Starting API..."
exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}"
