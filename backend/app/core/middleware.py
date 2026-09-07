"""ASGI middleware helpers."""

from __future__ import annotations

import uuid

from starlette.types import ASGIApp, Receive, Scope, Send

from app.core.logging import request_id_ctx

REQUEST_ID_HEADER = b"x-request-id"


class RequestIdMiddleware:
    """Attach a per-request UUID to logs and the ``X-Request-ID`` response header."""

    def __init__(self, app: ASGIApp) -> None:
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        headers = {k.lower(): v for k, v in scope.get("headers", [])}
        incoming = headers.get(REQUEST_ID_HEADER)
        request_id = incoming.decode("latin-1") if incoming else str(uuid.uuid4())
        token = request_id_ctx.set(request_id)

        async def send_with_request_id(message: dict) -> None:
            if message["type"] == "http.response.start":
                raw_headers = list(message.get("headers", []))
                raw_headers.append((REQUEST_ID_HEADER, request_id.encode("latin-1")))
                message = {**message, "headers": raw_headers}
            await send(message)

        try:
            await self.app(scope, receive, send_with_request_id)
        finally:
            request_id_ctx.reset(token)
