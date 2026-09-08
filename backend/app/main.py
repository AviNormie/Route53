from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import Depends, FastAPI, Response, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from scalar_fastapi import Theme, add_scalar_reference
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.api.v1.router import api_router
from app.core.config import settings
from app.core.exceptions import register_exception_handlers
from app.core.logging import configure_logging
from app.core.middleware import RequestIdMiddleware
from app.db.session import get_db


def _ensure_sqlite_data_dir() -> None:
    if settings.database_url.startswith("sqlite:///./"):
        relative = settings.database_url.removeprefix("sqlite:///./")
        db_path = Path(relative)
        if db_path.parent != Path("."):
            db_path.parent.mkdir(parents=True, exist_ok=True)


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncIterator[None]:
    configure_logging()
    _ensure_sqlite_data_dir()
    yield


app = FastAPI(
    title="Route 53 Clone API",
    description=(
        "DNS management API for the Route 53 clone: session auth, hosted zones, "
        "and DNS records (including BIND import/export)."
    ),
    version="0.1.0",
    lifespan=lifespan,
)

# Interactive API reference (Scalar). Also available: /docs (Swagger), /redoc.
add_scalar_reference(
    app,
    route="/scalar",
    theme=Theme.DEFAULT,
    servers=[
        {"url": "http://localhost:8000", "description": "Local"},
        {
            "url": "https://route53-f23x.onrender.com",
            "description": "Production (Render)",
        },
    ],
)

register_exception_handlers(app)

# Credentials require an explicit allowlist (not "*"). In dev, also accept any
# localhost / 127.0.0.1 port so Next.js network URLs don't fail preflight.
# In prod, CORS_ORIGINS is validated to be non-empty and non-wildcard.
_cors_origin_regex = (
    r"https?://(localhost|127\.0\.0\.1)(:\d+)?"
    if settings.environment == "dev"
    else None
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_origin_regex=_cors_origin_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(RequestIdMiddleware)

app.include_router(api_router, prefix="/api/v1")


@app.get("/health", tags=["health"])
def health(db: Session = Depends(get_db)) -> Response:
    """Liveness/readiness probe — verifies DB connectivity."""
    try:
        db.execute(text("SELECT 1"))
    except Exception:
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={"detail": "Database unavailable", "status": "error"},
        )
    return JSONResponse(status_code=status.HTTP_200_OK, content={"status": "ok"})
