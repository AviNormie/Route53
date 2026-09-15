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

# Bump CACHEBUST on Render ("Clear build cache") or when deploys stick on stale layers.
ARG CACHEBUST=20260916a
RUN echo "cachebust=${CACHEBUST}"

COPY . .
RUN poetry install --only main \
    && mkdir -p /app/data

EXPOSE 10000

# Bind explicitly to Render's port. Verify with GET /health → {"status":"ok","build":"..."}
CMD ["sh", "-c", "exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-10000}"]
