# Route 53 Clone Backend

FastAPI API for the Route 53 clone.

## Setup

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

## Run

```bash
uvicorn app.main:app --reload --port 8000
```

## Tests

```bash
pytest
```

## Environment

See `.env.example` for `DATABASE_URL`.
