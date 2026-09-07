"""SQLAlchemy ORM models.

Import model modules here so Alembic can discover them via Base.metadata.
Also import events so record_count listeners are registered at app import time.
"""

from app.db.base import Base

# Register after_insert / after_delete listeners for HostedZone.record_count.
from app.models import events as _events  # noqa: F401
from app.models.dns_record import CAA_TAGS, DNS_RECORD_TYPES, DnsRecord
from app.models.hosted_zone import HostedZone
from app.models.session import Session
from app.models.user import User

__all__ = [
    "Base",
    "CAA_TAGS",
    "DNS_RECORD_TYPES",
    "DnsRecord",
    "HostedZone",
    "Session",
    "User",
]
