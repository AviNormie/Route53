# Route 53 Clone

Full-stack DNS management console inspired by [Amazon Route 53](https://route53-ten.vercel.app/). Create hosted zones, manage DNS records, and import/export BIND zone files through a FastAPI backend.

## Live demo

| | URL |
|--|-----|
| **App (Vercel)** | [https://route53-ten.vercel.app/](https://route53-ten.vercel.app/) |
| **API docs (on app)** | [https://route53-ten.vercel.app/docs](https://route53-ten.vercel.app/docs) |
| **API (Render)** | [https://route53-f23x.onrender.com](https://route53-f23x.onrender.com) |
| **Scalar (proxied)** | [https://route53-ten.vercel.app/scalar](https://route53-ten.vercel.app/scalar) |
| **Swagger (proxied)** | [https://route53-ten.vercel.app/swagger](https://route53-ten.vercel.app/swagger) |
| **Health** | [https://route53-f23x.onrender.com/health](https://route53-f23x.onrender.com/health) |

**Demo login:** `demo@example.com` / `DemoPass123!`

> On Render free tier the API may cold-start (~30–60s). Wait for `/health` to return `{"status":"ok"}` before signing in.

---

## Table of contents

- [Tech stack](#tech-stack)
- [Setup](#setup)
- [Architecture](#architecture)
- [API documentation](#api-documentation)
- [Database schema](#database-schema)
- [Docker](#docker)
- [Tests](#tests)
- [Assumptions / mocked data](#assumptions--mocked-data)
- [Deploy](#deploy)

---

## Tech stack

| Layer | Stack |
|-------|--------|
| **Frontend** | Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, Yarn |
| **Backend** | FastAPI, SQLAlchemy 2.x, Alembic, Poetry, Python 3.11+ |
| **Database** | SQLite (local) or MySQL (e.g. Aiven in production) |
| **Auth** | Opaque HttpOnly session cookies (not JWT) |
| **API docs** | [Scalar](https://scalar.com/) (`/scalar`), plus Swagger (`/docs`) and ReDoc (`/redoc`) |

```text
scaler-assignment/
├── frontend/           # Next.js marketing site + console UI
├── backend/            # FastAPI API, models, migrations, seed
└── docker-compose.yml
```

---

## Setup

### Prerequisites

- Node.js 20+ and Yarn
- Python 3.11+ and Poetry
- Optional: Docker Compose

### 1. Backend

```bash
cd backend
poetry install
cp .env.example .env
poetry run alembic upgrade head
poetry run python -m app.db.seed
poetry run uvicorn app.main:app --reload --port 8000
```

Local endpoints:

- API: `http://localhost:8000`
- **Scalar docs:** `http://localhost:8000/scalar`
- Swagger: `http://localhost:8000/docs`
- Health: `http://localhost:8000/health`

Useful `.env` keys (see `backend/.env.example`):

```text
DATABASE_URL=sqlite:///./data/route53.db
SESSION_SECRET=change-me-in-production
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
ENVIRONMENT=dev
DEMO_USER_EMAIL=demo@example.com
DEMO_USER_PASSWORD=DemoPass123!
```

### 2. Frontend

```bash
cd frontend
yarn install
cp .env.example .env.local
```

```text
# .env.local — upstream API for the Next.js /api/v1 proxy
NEXT_PUBLIC_API_URL=http://localhost:8000
```

```bash
yarn dev
```

Open `http://localhost:3000`. Prefer the same host family (`localhost` vs `127.0.0.1`) for FE and API so cookies work.

### 3. Smoke test

1. Open the app → **Sign in to console**
2. Log in with the demo credentials
3. Create a hosted zone → open it → create records (or import a BIND zone file)

---

## Architecture

```text
Browser ──► Next.js (Vercel) ── /api/v1/* proxy ──► FastAPI (Render)
                                                         │
                                                    SQLAlchemy
                                                         ▼
                                                   SQLite / MySQL
```

1. Login `POST /api/v1/auth/login` creates a `sessions` row and sets an HttpOnly `session_id` cookie.
2. The frontend calls **same-origin** `/api/v1/*`; Next.js proxies to the backend so the cookie stays first-party on Vercel.
3. Hosted zones and DNS records are scoped to the authenticated user (`created_by`).

**Auth:** session cookie — `SameSite=Lax` in dev; `Secure` + `SameSite=None` when `ENVIRONMENT=prod`. Login is rate-limited (`LOGIN_RATE_LIMIT`).

---

## API documentation

Interactive reference is generated from the OpenAPI schema:

| UI | App (Vercel / local FE) | API host (Render / local BE) |
|----|-------------------------|------------------------------|
| **Docs page** | [/docs](https://route53-ten.vercel.app/docs) | — |
| **Scalar** (preferred) | `/scalar` | `/scalar` |
| Swagger UI | `/swagger` | `/docs` |
| ReDoc | `/redoc` | `/redoc` |
| OpenAPI JSON | `/openapi.json` | `/openapi.json` |

The frontend rewrites `/scalar`, `/swagger`, `/redoc`, and `/openapi.json` to the FastAPI backend (`NEXT_PUBLIC_API_URL`).

Base path: **`/api/v1`**. Most routes require a valid session cookie.

### Health

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/health` | No | Liveness + DB connectivity |

### Auth

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/v1/auth/signup` | No | Create account; set session cookie |
| `POST` | `/api/v1/auth/login` | No | Authenticate; set session cookie |
| `POST` | `/api/v1/auth/logout` | Session | Delete session; clear cookie |
| `GET` | `/api/v1/auth/me` | Session | Current user |

```json
{ "email": "demo@example.com", "password": "DemoPass123!" }
```

### Hosted zones

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/hosted-zones` | List (`search`, `sort_by`, `sort_order`, `page`, `page_size`) |
| `POST` | `/api/v1/hosted-zones` | Create zone (`201`) |
| `GET` | `/api/v1/hosted-zones/{zone_id}` | Get zone |
| `PUT` | `/api/v1/hosted-zones/{zone_id}` | Update zone |
| `DELETE` | `/api/v1/hosted-zones/{zone_id}` | Delete zone (`204`) |
| `GET` | `/api/v1/hosted-zones/{zone_id}/export` | Export zone (`format=json\|bind`) |
| `POST` | `/api/v1/hosted-zones/export` | Bulk export (JSON array / BIND zip) |

```json
{ "name": "example.com", "type": "Public", "comment": "Production DNS" }
```

### DNS records

Supported types: `A`, `AAAA`, `CNAME`, `TXT`, `MX`, `NS`, `PTR`, `SRV`, `CAA`, `SOA`.

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/hosted-zones/{zone_id}/records` | List (`search`, `type`, pagination) |
| `POST` | `/api/v1/hosted-zones/{zone_id}/records` | Create record (`201`) |
| `GET` | `/api/v1/records/{record_id}` | Get record |
| `PUT` | `/api/v1/records/{record_id}` | Update record |
| `DELETE` | `/api/v1/records/{record_id}` | Delete record (`204`) |
| `POST` | `/api/v1/hosted-zones/{zone_id}/records/import/preview` | BIND preview (multipart) |
| `POST` | `/api/v1/hosted-zones/{zone_id}/records/import/preview-json` | BIND preview (JSON body) |
| `POST` | `/api/v1/hosted-zones/{zone_id}/records/import` | Commit BIND import |

```json
{
  "name": "www.example.com",
  "type": "A",
  "ttl": 300,
  "value": "192.0.2.1"
}
```

Try requests interactively in **Scalar** (cookie auth after calling login from the same docs origin, or use the console UI).

---

## Database schema

```text
users 1───* sessions
  │
  └──1───* hosted_zones 1───* dns_records
```

| Table | Role |
|-------|------|
| `users` | Email + bcrypt password hash |
| `sessions` | Opaque session token (cookie value), expiry |
| `hosted_zones` | Domain name, Public/Private, comment, `record_count`, owner |
| `dns_records` | Name, type, TTL, RDATA (+ MX/SRV/CAA fields) |

Cascades: deleting a user removes sessions; deleting a zone removes its records.

---

## Docker

```bash
docker compose up --build
```

- Frontend: http://localhost:3000  
- Backend: http://localhost:8000 (Scalar at `/scalar`)

---

## Tests

```bash
cd backend
poetry run pytest
```

---

## Assumptions / mocked data

- **Real:** auth, hosted zones, DNS record CRUD, BIND import/export — persisted in the database.
- **Mocked / UI-only:** console account label/workgroup, dashboard notifications, domain-availability check (no real WHOIS/registration).
- **Placeholders:** secondary Route 53 pages (health checks, resolver, traffic policies, domains, etc.) are visual shells only.
- **Not AWS Route 53:** no real public DNS delegation or propagation; this is an assignment clone.

---

## Deploy

| Service | Host | Notes |
|---------|------|--------|
| Frontend | [Vercel](https://route53-ten.vercel.app/) | Proxy `/api/v1/*` → Render via `NEXT_PUBLIC_API_URL` / `API_URL` |
| Backend | [Render](https://route53-f23x.onrender.com) | Set `ENVIRONMENT=prod`, `CORS_ORIGINS=https://route53-ten.vercel.app` |

**Render env (required for prod cookies + CORS):**

```text
ENVIRONMENT=prod
CORS_ORIGINS=https://route53-ten.vercel.app
SESSION_SECRET=<long-random-value>
DATABASE_URL=<mysql-or-sqlite>
```

**Vercel env:**

```text
NEXT_PUBLIC_API_URL=https://route53-f23x.onrender.com
# optional server-only override:
# API_URL=https://route53-f23x.onrender.com
```

Redeploy both after changing env vars. Origins must have **no trailing slash**.

---

## License

Private assignment project — not licensed for redistribution unless otherwise stated.
