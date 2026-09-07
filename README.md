# Route 53 Clone

A DNS management platform inspired by AWS Route 53.

## Tech Stack

Frontend:
- Next.js
- TypeScript
- Tailwind CSS

Backend:
- FastAPI
- SQLAlchemy
- SQLite

## Project Structure

- `frontend/` — Next.js App Router UI
- `backend/` — FastAPI API and data layer
- `docs/` — project documentation

## Local Development

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
yarn install
cp .env.example .env.local
yarn dev
```

### Docker Compose

```bash
docker compose up --build
```

## Environment Variables

Copy the example env files and adjust as needed:

**Backend** (`backend/.env.example`):

```text
DATABASE_URL=sqlite:///./data/route53.db
```

**Frontend** (`frontend/.env.example`):

```text
NEXT_PUBLIC_API_URL=http://localhost:8000
```
