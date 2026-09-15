FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    POETRY_VERSION=1.8.5 \
    POETRY_VIRTUALENVS_CREATE=false \
    POETRY_NO_INTERACTION=1

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

EXPOSE 8000

RUN chmod +x /app/scripts/start.sh

# Fast boot: no migrate/seed here (those blocked Render health checks).
# Run once after DB is up: alembic upgrade head && python -m app.db.seed
CMD ["/app/scripts/start.sh"]
