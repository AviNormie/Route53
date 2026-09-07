"""ID generation helpers for ORM primary keys."""

from __future__ import annotations

import secrets
import string
import uuid

_ALPHANUM = string.ascii_letters + string.digits


def generate_hosted_zone_id() -> str:
    """Return a Route53-style hosted zone id: ``Z`` + 13 alphanumeric chars."""
    return "Z" + "".join(secrets.choice(_ALPHANUM) for _ in range(13))


def generate_dns_record_id() -> str:
    """Return a UUID4 string for DNS record primary keys."""
    return str(uuid.uuid4())


def generate_session_id() -> str:
    """Return a high-entropy opaque session token (app-generated PK)."""
    return secrets.token_urlsafe(32)
