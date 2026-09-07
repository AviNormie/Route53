# Route 53 Clone Backend

FastAPI backend scaffolding for the Route 53 clone.

## Stack

- Python 3.11+
- FastAPI
- SQLAlchemy 2.x + Alembic
- Poetry
- SQLite (default)

## Setup

```bash
cd backend
poetry install
cp .env.example .env
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
