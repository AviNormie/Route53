from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_router
from app.core.config import settings


def _ensure_sqlite_data_dir() -> None:
    if settings.database_url.startswith("sqlite:///./"):
        relative = settings.database_url.removeprefix("sqlite:///./")
        db_path = Path(relative)
        if db_path.parent != Path("."):
            db_path.parent.mkdir(parents=True, exist_ok=True)


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncIterator[None]:
    _ensure_sqlite_data_dir()
    yield


app = FastAPI(
    title="Route 53 Clone API",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")


@app.get("/health", tags=["health"])
def health() -> dict[str, str]:
    """Root-level health check — no authentication required."""
    return {"status": "ok"}
