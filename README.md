# Route 53 Clone

A full-stack DNS management platform inspired by **AWS Route 53**. Sign in to a console-style UI, create **hosted zones**, and manage **DNS records** (A, AAAA, CNAME, TXT, MX, NS, PTR, SRV, CAA) through a FastAPI backend.

---

## Table of contents

- [Tech stack](#tech-stack)
- [Setup instructions](#setup-instructions)
- [Architecture overview](#architecture-overview)
- [Database schema](#database-schema)
- [API overview](#api-overview)
- [Demo credentials](#demo-credentials)
- [Docker](#docker)
- [Tests](#tests)

---

## Tech stack

| Layer | Stack |
|-------|--------|
| **Frontend** | Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, Yarn |
| **Backend** | FastAPI, SQLAlchemy 2.x, Alembic, Poetry, Python 3.11+ |
| **Database** | SQLite (local default) or MySQL (e.g. Aiven) |
| **Auth** | Opaque session cookies (HttpOnly), not JWT |

```text
scaler-assignment/
├── frontend/          # Next.js console + marketing UI
├── backend/           # FastAPI API, models, migrations, seed
├── docs/              # Extra documentation (optional)
└── docker-compose.yml
```

---

## Setup instructions

### Prerequisites

- **Node.js** 20+ and **Yarn**
- **Python** 3.11+ and **Poetry**
- (Optional) Docker + Docker Compose

### 1. Backend

```bash
cd backend
poetry install
cp .env.example .env
```

Edit `backend/.env` as needed:

```text
DATABASE_URL=sqlite:///./data/route53.db
SESSION_SECRET=change-me-in-production
SESSION_EXPIRE_MINUTES=1440
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,http://localhost:3002
ENVIRONMENT=dev
DEMO_USER_EMAIL=demo@example.com
DEMO_USER_PASSWORD=DemoPass123!
LOGIN_RATE_LIMIT=5/minute
```

**MySQL (optional):**

```text
DATABASE_URL=mysql://USER:PASSWORD@HOST:PORT/defaultdb?ssl-mode=REQUIRED
# Optional CA path for verify-ca / verify-identity:
# MYSQL_SSL_CA=/path/to/ca.pem
```

Run migrations and seed the demo user:

```bash
poetry run alembic upgrade head
poetry run python -m app.db.seed
```

Start the API:

```bash
poetry run uvicorn app.main:app --reload --port 8000
```

- API: `http://localhost:8000`
- OpenAPI docs: `http://localhost:8000/docs`
- Health: `http://localhost:8000/health`

### 2. Frontend

```bash
cd frontend
yarn install
cp .env.example .env.local
```

`frontend/.env.local`:

```text
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Start the UI:

```bash
yarn dev
```

Open `http://localhost:3000` (or the next free port Yarn prints, e.g. `3002`).

> Use the same host family for FE and API (`localhost` vs `127.0.0.1`) so the session cookie is sent correctly.

### 3. Quick smoke check

1. Open the app → **Sign in to console**
2. Log in with the [demo credentials](#demo-credentials)
3. Create a hosted zone → open it → create DNS records

---

## Architecture overview

```text
┌─────────────────────┐        HTTPS + cookie        ┌─────────────────────┐
│  Next.js frontend   │  ←──── credentials:include ──→ │  FastAPI backend    │
│  (console UI)       │                               │  /api/v1/*          │
└─────────────────────┘                               └──────────┬──────────┘
                                                                 │
                                                      SQLAlchemy │
                                                                 ▼
                                                      ┌─────────────────────┐
                                                      │  SQLite / MySQL     │
                                                      │  users, sessions,   │
                                                      │  hosted_zones,      │
                                                      │  dns_records        │
                                                      └─────────────────────┘
```

### Request flow

1. User signs in via `POST /api/v1/auth/login`
2. Backend creates a row in `sessions` and sets an HttpOnly cookie (`session_id`)
3. Subsequent console API calls include the cookie; `GET /api/v1/auth/me` resolves the user
4. Hosted zones and DNS records are scoped to the authenticated user (`created_by`)

### Backend layout

| Package | Responsibility |
|---------|----------------|
| `app/api` | HTTP routers (`/auth`, `/hosted-zones`, records) |
| `app/schemas` | Pydantic request/response models |
| `app/services` | Business logic (validation, ownership, CRUD) |
| `app/models` | SQLAlchemy ORM entities |
| `app/db` | Engine, session factory, seed |
| `app/core` | Settings, security, rate limits |

### Frontend layout

| Area | Responsibility |
|------|----------------|
| `src/app/(auth)/` | Login / sign-in |
| `src/app/(console)/` | Dashboard, hosted zones, records |
| `src/components/console/` | Shell: nav, sidebar, Amazon Q panel, shared UI |
| `src/lib/api.ts` | Typed API client (`credentials: "include"`) |

### Auth model

- **Session cookie** auth (not JWT)
- Cookie: HttpOnly, `SameSite=Lax`; `Secure` in production
- Login rate-limited via `LOGIN_RATE_LIMIT`
- Logout deletes the session row and clears the cookie

### CORS

`CORS_ORIGINS` must include the frontend origin(s). Credentials are enabled so browsers attach the session cookie on cross-origin API calls during local development.

---

## Database schema

Four core tables (Alembic revision `922b54a6cc68` and ORM models).

```text
users 1───* sessions
  │
  └──1───* hosted_zones 1───* dns_records
```

### `users`

| Column | Type | Notes |
|--------|------|--------|
| `id` | Integer PK | Autoincrement |
| `email` | String | Unique, indexed |
| `password_hash` | String | Bcrypt |
| `created_at` | DateTime (tz) | |

### `sessions`

| Column | Type | Notes |
|--------|------|--------|
| `id` | String PK | Opaque session token (cookie value) |
| `user_id` | FK → `users.id` | **ON DELETE CASCADE** |
| `created_at` | DateTime (tz) | |
| `expires_at` | DateTime (tz) | Driven by `SESSION_EXPIRE_MINUTES` |

### `hosted_zones`

| Column | Type | Notes |
|--------|------|--------|
| `id` | String(32) PK | Zone identifier |
| `name` | String | Domain name (e.g. `example.com.`) |
| `type` | Enum/String | `Public` \| `Private` |
| `comment` | Text, nullable | Description |
| `record_count` | Integer | Maintained when records change |
| `created_by` | FK → `users.id` | Owner |
| `created_at` / `updated_at` | DateTime (tz) | |

### `dns_records`

| Column | Type | Notes |
|--------|------|--------|
| `id` | String(36) PK | Record identifier |
| `hosted_zone_id` | FK → `hosted_zones.id` | **ON DELETE CASCADE** |
| `name` | String | Record name / FQDN |
| `type` | String | `A`, `AAAA`, `CNAME`, `TXT`, `MX`, `NS`, `PTR`, `SRV`, `CAA` |
| `ttl` | Integer | Default `300` |
| `value` | Text | Target / RDATA |
| `priority` | Integer, nullable | MX / SRV |
| `weight` / `port` | Integer, nullable | SRV |
| `caa_flag` / `caa_tag` | nullable | CAA (`issue`, `issuewild`, `iodef`) |
| `created_at` / `updated_at` | DateTime (tz) | |

SQLite enables `PRAGMA foreign_keys=ON` so cascades work locally.

---

## API overview

Base URL: `http://localhost:8000`  
API prefix: **`/api/v1`**  
Interactive docs: **`/docs`**

### Health

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/health` | No | Liveness + DB connectivity |

### Auth — `/api/v1/auth`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/v1/auth/login` | No | Authenticate; set session cookie; return user |
| `POST` | `/api/v1/auth/logout` | Session | Delete session; clear cookie |
| `GET` | `/api/v1/auth/me` | Session | Current authenticated user |

**Login body (example):**

```json
{
  "email": "demo@example.com",
  "password": "DemoPass123!"
}
```

### Hosted zones — `/api/v1/hosted-zones`

All routes require a valid session.

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/hosted-zones` | List zones (`search`, `sort_by`, `sort_order`, `page`, `page_size`) |
| `POST` | `/api/v1/hosted-zones` | Create zone (`201`) |
| `GET` | `/api/v1/hosted-zones/{zone_id}` | Get one zone |
| `PUT` | `/api/v1/hosted-zones/{zone_id}` | Update zone |
| `DELETE` | `/api/v1/hosted-zones/{zone_id}` | Delete zone (`204`) |

**Create body (example):**

```json
{
  "name": "example.com",
  "type": "Public",
  "comment": "Production DNS"
}
```

### DNS records

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/hosted-zones/{zone_id}/records` | List records (`search`, `type`, pagination) |
| `POST` | `/api/v1/hosted-zones/{zone_id}/records` | Create record (`201`) |
| `GET` | `/api/v1/records/{record_id}` | Get one record |
| `PUT` | `/api/v1/records/{record_id}` | Update record |
| `DELETE` | `/api/v1/records/{record_id}` | Delete record (`204`) |

**Create A record (example):**

```json
{
  "name": "www.example.com",
  "type": "A",
  "ttl": 300,
  "value": "192.0.2.1"
}
```

---

## Demo credentials

Seeded by `poetry run python -m app.db.seed` (override via `DEMO_USER_*` in `.env`):

| Field | Default |
|-------|---------|
| Email | `demo@example.com` |
| Password | `DemoPass123!` |

---

## Docker

From the repo root:

```bash
docker compose up --build
```

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8000`

Compose uses SQLite in a mounted `backend/data` volume by default. Point `DATABASE_URL` at MySQL in `backend/.env` if you prefer a remote database.

---

## Tests

```bash
cd backend
poetry run pytest
```

---

## Migrations

```bash
cd backend
poetry run alembic revision --autogenerate -m "describe change"
poetry run alembic upgrade head
```

---

## License

Private assignment project — not licensed for redistribution unless otherwise stated.
