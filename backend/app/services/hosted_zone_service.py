"""Hosted zone business logic."""

from __future__ import annotations

from typing import Literal

from sqlalchemy import asc, desc, func, or_, select
from sqlalchemy.orm import Session

from app.models.hosted_zone import HostedZone
from app.models.user import User
from app.schemas.hosted_zone import HostedZoneCreate, HostedZoneUpdate

SortBy = Literal["name", "type", "record_count", "created_at", "updated_at"]
SortOrder = Literal["asc", "desc"]

_SORT_COLUMNS = {
    "name": HostedZone.name,
    "type": HostedZone.type,
    "record_count": HostedZone.record_count,
    "created_at": HostedZone.created_at,
    "updated_at": HostedZone.updated_at,
}


class HostedZoneNotFoundError(Exception):
    """Raised when a hosted zone id does not exist for the user."""


class HostedZoneConflictError(Exception):
    """Raised when a hosted zone name already exists for the user."""


def create(db: Session, user: User, payload: HostedZoneCreate) -> HostedZone:
    existing = db.scalar(
        select(HostedZone).where(
            HostedZone.created_by == user.id,
            HostedZone.name == payload.name,
        )
    )
    if existing is not None:
        raise HostedZoneConflictError(f"Hosted zone '{payload.name}' already exists")

    zone = HostedZone(
        name=payload.name,
        type=payload.type,
        comment=payload.comment,
        created_by=user.id,
    )
    db.add(zone)
    db.commit()
    db.refresh(zone)
    return zone


def get_by_id(db: Session, user: User, zone_id: str) -> HostedZone:
    zone = db.scalar(
        select(HostedZone).where(
            HostedZone.id == zone_id,
            HostedZone.created_by == user.id,
        )
    )
    if zone is None:
        raise HostedZoneNotFoundError("Hosted zone not found")
    return zone


def list_paginated(
    db: Session,
    user: User,
    *,
    search: str | None = None,
    sort_by: SortBy = "created_at",
    sort_order: SortOrder = "desc",
    page: int = 1,
    page_size: int = 20,
) -> tuple[list[HostedZone], int]:
    filters = [HostedZone.created_by == user.id]

    if search:
        term = f"%{search.strip().lower()}%"
        filters.append(
            or_(
                func.lower(HostedZone.name).like(term),
                func.lower(func.coalesce(HostedZone.comment, "")).like(term),
            )
        )

    total = db.scalar(select(func.count()).select_from(HostedZone).where(*filters))
    if total is None:
        total = 0

    column = _SORT_COLUMNS.get(sort_by, HostedZone.created_at)
    ordering = asc(column) if sort_order == "asc" else desc(column)

    offset = max(page - 1, 0) * page_size
    items = list(
        db.scalars(
            select(HostedZone)
            .where(*filters)
            .order_by(ordering)
            .offset(offset)
            .limit(page_size)
        ).all()
    )
    return items, int(total)


def update(
    db: Session,
    user: User,
    zone_id: str,
    payload: HostedZoneUpdate,
) -> HostedZone:
    zone = get_by_id(db, user, zone_id)
    zone.comment = payload.comment
    db.add(zone)
    db.commit()
    db.refresh(zone)
    return zone


def delete(db: Session, user: User, zone_id: str) -> None:
    zone = get_by_id(db, user, zone_id)
    # Access records so SQLAlchemy's delete-orphan cascade emits child DELETEs
    # (also covered by FK ON DELETE CASCADE when SQLite foreign_keys are on).
    _ = zone.records
    db.delete(zone)
    db.commit()
