# Route 53 Clone Backend

FastAPI API for the Route 53 clone: session auth, hosted zones, DNS records, and BIND import/export.

## Live

| | URL |
|--|-----|
| **API** | https://route53-f23x.onrender.com |
| **Scalar docs** | https://route53-f23x.onrender.com/scalar |
| **Swagger** | https://route53-f23x.onrender.com/docs |
| **ReDoc** | https://route53-f23x.onrender.com/redoc |
| **Health** | https://route53-f23x.onrender.com/health |
| **Frontend** | https://route53-ten.vercel.app/ |

See the [root README](../README.md) for the full endpoint table and deploy notes.

## Stack

- Python 3.11+
- FastAPI + [Scalar](https://scalar.com/) API reference (`/scalar`)
- SQLAlchemy 2.x + Alembic
- Poetry
- SQLite (local) or MySQL (e.g. Aiven)

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

Migrate and seed:

```bash
poetry run alembic upgrade head
poetry run python -m app.db.seed
```

## Run

```bash
poetry run uvicorn app.main:app --reload --port 8000
```

- API: http://localhost:8000
- **Scalar:** http://localhost:8000/scalar
- Swagger: http://localhost:8000/docs
- OpenAPI: http://localhost:8000/openapi.json

## Auth

Session-cookie auth (not JWT):

- `POST /api/v1/auth/login`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/me`

Demo user (from `DEMO_USER_EMAIL` / `DEMO_USER_PASSWORD`):

```bash
poetry run python -m app.db.seed
```

Default: `demo@example.com` / `DemoPass123!`

### Vercel ↔ Render

The frontend proxies `/api/v1/*` to this API so the session cookie is first-party on Vercel. Still set on Render:

- `ENVIRONMENT=prod` → cookie `Secure` + `SameSite=None`
- `CORS_ORIGINS=https://route53-ten.vercel.app` (no trailing slash)

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

From the repo root:

```bash
docker compose up --build
```
