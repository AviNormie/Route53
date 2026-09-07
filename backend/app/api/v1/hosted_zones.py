from typing import Literal

from fastapi import APIRouter, Query, Response, status

from app.api.deps import CurrentUser, DbDep
from app.schemas.hosted_zone import (
    HostedZoneCreate,
    HostedZoneListOut,
    HostedZoneOut,
    HostedZoneUpdate,
)
from app.services import hosted_zone_service

router = APIRouter(prefix="/hosted-zones", tags=["hosted-zones"])


@router.get("", response_model=HostedZoneListOut)
def list_hosted_zones(
    db: DbDep,
    current_user: CurrentUser,
    search: str | None = Query(default=None),
    sort_by: Literal[
        "name", "type", "record_count", "created_at", "updated_at"
    ] = Query(default="created_at"),
    sort_order: Literal["asc", "desc"] = Query(default="desc"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
) -> HostedZoneListOut:
    items, total = hosted_zone_service.list_paginated(
        db,
        current_user,
        search=search,
        sort_by=sort_by,
        sort_order=sort_order,
        page=page,
        page_size=page_size,
    )
    return HostedZoneListOut(
        items=[HostedZoneOut.model_validate(item) for item in items],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.post("", response_model=HostedZoneOut, status_code=status.HTTP_201_CREATED)
def create_hosted_zone(
    payload: HostedZoneCreate,
    db: DbDep,
    current_user: CurrentUser,
) -> HostedZoneOut:
    zone = hosted_zone_service.create(db, current_user, payload)
    return HostedZoneOut.model_validate(zone)


@router.get("/{zone_id}", response_model=HostedZoneOut)
def get_hosted_zone(
    zone_id: str,
    db: DbDep,
    current_user: CurrentUser,
) -> HostedZoneOut:
    zone = hosted_zone_service.get_by_id(db, current_user, zone_id)
    return HostedZoneOut.model_validate(zone)


@router.put("/{zone_id}", response_model=HostedZoneOut)
def update_hosted_zone(
    zone_id: str,
    payload: HostedZoneUpdate,
    db: DbDep,
    current_user: CurrentUser,
) -> HostedZoneOut:
    zone = hosted_zone_service.update(db, current_user, zone_id, payload)
    return HostedZoneOut.model_validate(zone)


@router.delete("/{zone_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_hosted_zone(
    zone_id: str,
    db: DbDep,
    current_user: CurrentUser,
) -> Response:
    hosted_zone_service.delete(db, current_user, zone_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
