from typing import Annotated, Literal

from fastapi import APIRouter, Query, Response, status

from app.api.deps import CurrentUser, DbDep
from app.schemas.dns_record import (
    DnsRecordCreate,
    DnsRecordListOut,
    DnsRecordOut,
    DnsRecordUpdate,
)
from app.services import dns_record_service

zone_records_router = APIRouter(
    prefix="/hosted-zones/{zone_id}/records",
    tags=["dns-records"],
)
records_router = APIRouter(prefix="/records", tags=["dns-records"])


@zone_records_router.get("", response_model=DnsRecordListOut)
def list_dns_records(
    zone_id: str,
    db: DbDep,
    current_user: CurrentUser,
    search: str | None = Query(default=None),
    record_type: Annotated[
        Literal["A", "AAAA", "CNAME", "TXT", "MX", "NS", "PTR", "SRV", "CAA"] | None,
        Query(alias="type"),
    ] = None,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
) -> DnsRecordListOut:
    items, total = dns_record_service.list_paginated(
        db,
        current_user,
        zone_id,
        search=search,
        type_filter=record_type,
        page=page,
        page_size=page_size,
    )
    return DnsRecordListOut(
        items=[DnsRecordOut.model_validate(item) for item in items],
        total=total,
        page=page,
        page_size=page_size,
    )


@zone_records_router.post(
    "",
    response_model=DnsRecordOut,
    status_code=status.HTTP_201_CREATED,
)
def create_dns_record(
    zone_id: str,
    payload: DnsRecordCreate,
    db: DbDep,
    current_user: CurrentUser,
) -> DnsRecordOut:
    record = dns_record_service.create(db, current_user, zone_id, payload)
    return DnsRecordOut.model_validate(record)


@records_router.get("/{record_id}", response_model=DnsRecordOut)
def get_dns_record(
    record_id: str,
    db: DbDep,
    current_user: CurrentUser,
) -> DnsRecordOut:
    record = dns_record_service.get_by_id(db, current_user, record_id)
    return DnsRecordOut.model_validate(record)


@records_router.put("/{record_id}", response_model=DnsRecordOut)
def update_dns_record(
    record_id: str,
    payload: DnsRecordUpdate,
    db: DbDep,
    current_user: CurrentUser,
) -> DnsRecordOut:
    record = dns_record_service.update(db, current_user, record_id, payload)
    return DnsRecordOut.model_validate(record)


@records_router.delete("/{record_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_dns_record(
    record_id: str,
    db: DbDep,
    current_user: CurrentUser,
) -> Response:
    dns_record_service.delete(db, current_user, record_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
