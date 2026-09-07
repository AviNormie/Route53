"""Domain and HTTP exception wiring.

Service layers raise plain domain errors (defined next to services). Handlers
here map those errors — and optional core aliases — to consistent
``{"detail": "..."}`` JSON responses without leaking internals.
"""

from __future__ import annotations

import logging

from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.services.auth_service import AuthError, EmailAlreadyRegisteredError
from app.services.dns_record_service import DnsRecordNotFoundError
from app.services.hosted_zone_service import (
    HostedZoneConflictError,
    HostedZoneNotFoundError,
)

logger = logging.getLogger(__name__)


class DomainError(Exception):
    """Base class for application domain errors."""

    status_code: int = status.HTTP_400_BAD_REQUEST

    def __init__(self, detail: str) -> None:
        self.detail = detail
        super().__init__(detail)


class HostedZoneNotFound(DomainError):  # noqa: N818
    """Alias-style domain error for hosted zone misses."""

    status_code = status.HTTP_404_NOT_FOUND


class RecordNotFound(DomainError):  # noqa: N818
    """Alias-style domain error for DNS record misses."""

    status_code = status.HTTP_404_NOT_FOUND


class HostedZoneConflict(DomainError):  # noqa: N818
    status_code = status.HTTP_409_CONFLICT


class UnauthorizedError(DomainError):
    status_code = status.HTTP_401_UNAUTHORIZED


class RateLimitExceededError(DomainError):
    status_code = status.HTTP_429_TOO_MANY_REQUESTS


def _error_response(status_code: int, detail: str) -> JSONResponse:
    return JSONResponse(status_code=status_code, content={"detail": detail})


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(DomainError)
    async def domain_error_handler(_request: Request, exc: DomainError) -> JSONResponse:
        return _error_response(exc.status_code, exc.detail)

    @app.exception_handler(HostedZoneNotFoundError)
    async def hosted_zone_not_found_handler(
        _request: Request, exc: HostedZoneNotFoundError
    ) -> JSONResponse:
        return _error_response(status.HTTP_404_NOT_FOUND, str(exc))

    @app.exception_handler(HostedZoneConflictError)
    async def hosted_zone_conflict_handler(
        _request: Request, exc: HostedZoneConflictError
    ) -> JSONResponse:
        return _error_response(status.HTTP_409_CONFLICT, str(exc))

    @app.exception_handler(DnsRecordNotFoundError)
    async def dns_record_not_found_handler(
        _request: Request, exc: DnsRecordNotFoundError
    ) -> JSONResponse:
        return _error_response(status.HTTP_404_NOT_FOUND, str(exc))

    @app.exception_handler(AuthError)
    async def auth_error_handler(_request: Request, exc: AuthError) -> JSONResponse:
        return _error_response(status.HTTP_401_UNAUTHORIZED, str(exc))

    @app.exception_handler(EmailAlreadyRegisteredError)
    async def email_already_registered_handler(
        _request: Request, exc: EmailAlreadyRegisteredError
    ) -> JSONResponse:
        return _error_response(status.HTTP_409_CONFLICT, str(exc))

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(
        request: Request, exc: Exception
    ) -> JSONResponse:
        request_id = getattr(request.state, "request_id", None)
        logger.exception(
            "Unhandled exception",
            extra={"request_id": request_id, "path": str(request.url.path)},
        )
        detail = (
            "Internal server error"
            if settings.environment == "prod"
            else f"Internal server error: {exc.__class__.__name__}: {exc}"
        )
        return _error_response(status.HTTP_500_INTERNAL_SERVER_ERROR, detail)
