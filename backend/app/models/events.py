"""ORM event listeners for denormalized counters.

We use SQLAlchemy mapper events (not a service-layer hook) so
``HostedZone.record_count`` stays correct regardless of which code path
inserts/deletes ``DnsRecord`` rows. Event listeners sit next to the ORM
lifecycle, avoid forgetting updates in every service method, and keep
reads O(1) without ``COUNT(*)``.
"""

from __future__ import annotations

from sqlalchemy import event, update
from sqlalchemy.engine import Connection
from sqlalchemy.orm import Mapper

from app.models.dns_record import DnsRecord
from app.models.hosted_zone import HostedZone


@event.listens_for(DnsRecord, "after_insert")
def _increment_hosted_zone_record_count(
    mapper: Mapper,
    connection: Connection,
    target: DnsRecord,
) -> None:
    connection.execute(
        update(HostedZone)
        .where(HostedZone.id == target.hosted_zone_id)
        .values(record_count=HostedZone.record_count + 1)
    )


@event.listens_for(DnsRecord, "after_delete")
def _decrement_hosted_zone_record_count(
    mapper: Mapper,
    connection: Connection,
    target: DnsRecord,
) -> None:
    # When a zone itself is deleted, CASCADE/ORM cleanup may still emit
    # child deletes; updating a soon-to-be-gone row is harmless and keeps
    # non-cascade deletes (single record removal) correctly counted.
    connection.execute(
        update(HostedZone)
        .where(HostedZone.id == target.hosted_zone_id)
        .values(record_count=HostedZone.record_count - 1)
    )
