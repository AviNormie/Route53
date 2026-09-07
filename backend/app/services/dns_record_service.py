"""DNS record business logic."""

from __future__ import annotations

from typing import Any

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.models.dns_record import DnsRecord
from app.models.user import User
from app.schemas.dns_record import DnsRecordCreate, DnsRecordUpdate
from app.services import hosted_zone_service


class DnsRecordNotFoundError(Exception):
    """Raised when a DNS record id does not exist for the user."""


def _payload_to_columns(payload: DnsRecordCreate | DnsRecordUpdate) -> dict[str, Any]:
    """Map a typed payload onto DnsRecord columns, nulling unused type fields."""
    data = payload.model_dump()
    columns: dict[str, Any] = {
        "name": data["name"].strip(),
        "type": data["type"],
        "ttl": data["ttl"],
        "value": data["value"].strip(),
        "priority": None,
        "weight": None,
        "port": None,
        "caa_flag": None,
        "caa_tag": None,
    }
    record_type = data["type"]
    if record_type == "MX":
        columns["priority"] = data["priority"]
    elif record_type == "SRV":
        columns["priority"] = data["priority"]
        columns["weight"] = data["weight"]
        columns["port"] = data["port"]
    elif record_type == "CAA":
        columns["caa_flag"] = data["caa_flag"]
        columns["caa_tag"] = data["caa_tag"]
    return columns


def create(
    db: Session,
    user: User,
    zone_id: str,
    payload: DnsRecordCreate,
) -> DnsRecord:
    # 404 if the zone is missing or not owned by the user.
    hosted_zone_service.get_by_id(db, user, zone_id)

    record = DnsRecord(hosted_zone_id=zone_id, **_payload_to_columns(payload))
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


def list_paginated(
    db: Session,
    user: User,
    zone_id: str,
    *,
    search: str | None = None,
    type_filter: str | None = None,
    page: int = 1,
    page_size: int = 20,
) -> tuple[list[DnsRecord], int]:
    hosted_zone_service.get_by_id(db, user, zone_id)

    filters = [DnsRecord.hosted_zone_id == zone_id]

    if type_filter:
        filters.append(DnsRecord.type == type_filter.upper())

    if search:
        term = f"%{search.strip().lower()}%"
        filters.append(
            or_(
                func.lower(DnsRecord.name).like(term),
                func.lower(DnsRecord.value).like(term),
                func.lower(DnsRecord.type).like(term),
            )
        )

    total = db.scalar(select(func.count()).select_from(DnsRecord).where(*filters))
    if total is None:
        total = 0

    offset = max(page - 1, 0) * page_size
    items = list(
        db.scalars(
            select(DnsRecord)
            .where(*filters)
            .order_by(DnsRecord.name.asc(), DnsRecord.type.asc())
            .offset(offset)
            .limit(page_size)
        ).all()
    )
    return items, int(total)


def get_by_id(db: Session, user: User, record_id: str) -> DnsRecord:
    record = db.scalar(select(DnsRecord).where(DnsRecord.id == record_id))
    if record is None:
        raise DnsRecordNotFoundError("DNS record not found")

    # Ensure the parent zone belongs to the current user (raises 404-style error).
    try:
        hosted_zone_service.get_by_id(db, user, record.hosted_zone_id)
    except hosted_zone_service.HostedZoneNotFoundError as exc:
        raise DnsRecordNotFoundError("DNS record not found") from exc
    return record


def update(
    db: Session,
    user: User,
    record_id: str,
    payload: DnsRecordUpdate,
) -> DnsRecord:
    record = get_by_id(db, user, record_id)
    for key, value in _payload_to_columns(payload).items():
        setattr(record, key, value)
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


def delete(db: Session, user: User, record_id: str) -> None:
    record = get_by_id(db, user, record_id)
    db.delete(record)
    db.commit()
