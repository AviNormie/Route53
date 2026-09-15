FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    POETRY_VERSION=1.8.5 \
    POETRY_VIRTUALENVS_CREATE=false \
    POETRY_NO_INTERACTION=1 \
    PORT=10000

WORKDIR /app

RUN apt-get update \
    && apt-get install --no-install-recommends -y curl build-essential \
    && rm -rf /var/lib/apt/lists/* \
    && pip install --no-cache-dir "poetry==${POETRY_VERSION}"

COPY pyproject.toml poetry.lock* ./
RUN poetry install --only main --no-root

COPY . .
RUN poetry install --only main \
    && mkdir -p /app/data

# Render routes to $PORT (default 10000). EXPOSE must not disagree.
EXPOSE 10000

# Shell form so $PORT expands. No migrate/seed on boot.
CMD uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-10000}
