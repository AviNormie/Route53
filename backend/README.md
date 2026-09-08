# Route 53 Clone Backend

FastAPI backend scaffolding for the Route 53 clone.

## Stack

- Python 3.11+
- FastAPI
- SQLAlchemy 2.x + Alembic
- Poetry
- SQLite (local default) or MySQL (e.g. Aiven)

## Setup

```bash
cd backend
poetry install
cp .env.example .env
```

Set `DATABASE_URL` in `.env`:

```bash
# Local SQLite
DATABASE_URL=sqlite:///./data/route53.db

# Aiven MySQL (ssl-mode=REQUIRED is supported)
DATABASE_URL=mysql://USER:PASSWORD@HOST:PORT/defaultdb?ssl-mode=REQUIRED
```

Then migrate and seed:

```bash
poetry run alembic upgrade head
poetry run python -m app.db.seed
```

## Run

```bash
poetry run uvicorn app.main:app --reload --port 8000
```

## Tests

```bash
poetry run pytest
```

## Migrations

```bash
poetry run alembic revision --autogenerate -m "message"
poetry run alembic upgrade head
```

## Docker

```bash
docker compose up --build
```

## Auth

Session-cookie auth (not JWT):

- `POST /api/v1/auth/login`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/me`

For a Vercel frontend talking to this API on another host (e.g. Render), set:

- `ENVIRONMENT=prod` → session cookie is `Secure` + `SameSite=None`
- `CORS_ORIGINS=https://your-app.vercel.app` (no trailing slash)

The frontend proxies `/api/v1/*` to this API (`frontend/next.config.ts`) so the
session cookie is first-party on the Vercel domain. Still set `ENVIRONMENT=prod`
on Render so any direct cross-origin calls also get a valid cookie.

Seed the demo user:

```bash
poetry run python -m app.db.seed
```

Demo credentials come from `DEMO_USER_EMAIL` / `DEMO_USER_PASSWORD` in `.env`.
