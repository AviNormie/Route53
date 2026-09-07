from typing import Annotated, Literal

from fastapi import APIRouter, File, Form, HTTPException, Query, Response, UploadFile, status

from app.api.deps import CurrentUser, DbDep
from app.schemas.bind_import import (
    BindImportCommitIn,
    BindImportContentIn,
    BindImportPreviewOut,
    BindImportResultOut,
)
from app.schemas.dns_record import (
    DnsRecordCreate,
    DnsRecordListOut,
    DnsRecordOut,
    DnsRecordUpdate,
)
from app.services import bind_import_service, dns_record_service
from app.services.bind_import_service import BindImportError

zone_records_router = APIRouter(
    prefix="/hosted-zones/{zone_id}/records",
    tags=["dns-records"],
)
records_router = APIRouter(prefix="/records", tags=["dns-records"])

_DnsTypeFilter = Literal[
    "A", "AAAA", "CNAME", "TXT", "MX", "NS", "PTR", "SRV", "CAA", "SOA"
]


@zone_records_router.get("", response_model=DnsRecordListOut)
def list_dns_records(
    zone_id: str,
    db: DbDep,
    current_user: CurrentUser,
    search: str | None = Query(default=None),
    record_type: Annotated[_DnsTypeFilter | None, Query(alias="type")] = None,
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


@zone_records_router.post(
    "/import/preview",
    response_model=BindImportPreviewOut,
)
async def preview_bind_import(
    zone_id: str,
    db: DbDep,
    current_user: CurrentUser,
    file: UploadFile | None = File(default=None),
    content: str | None = Form(default=None),
    filename: str | None = Form(default=None),
) -> BindImportPreviewOut:
    """Parse a BIND zone file and return a validation preview (no writes)."""
    try:
        text, name = await _read_import_payload(
            file=file, content=content, filename=filename
        )
        return bind_import_service.build_preview(
            db, current_user, zone_id, text, filename=name
        )
    except BindImportError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)
        ) from exc


@zone_records_router.post(
    "/import/preview-json",
    response_model=BindImportPreviewOut,
)
def preview_bind_import_json(
    zone_id: str,
    payload: BindImportContentIn,
    db: DbDep,
    current_user: CurrentUser,
) -> BindImportPreviewOut:
    try:
        text = bind_import_service.decode_upload(
            payload.content.encode("utf-8"),
            filename=payload.filename,
        )
        return bind_import_service.build_preview(
            db, current_user, zone_id, text, filename=payload.filename
        )
    except BindImportError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)
        ) from exc


@zone_records_router.post(
    "/import",
    response_model=BindImportResultOut,
)
def commit_bind_import(
    zone_id: str,
    payload: BindImportCommitIn,
    db: DbDep,
    current_user: CurrentUser,
) -> BindImportResultOut:
    try:
        text = bind_import_service.decode_upload(
            payload.content.encode("utf-8"),
            filename=payload.filename,
        )
        return bind_import_service.commit_import(
            db,
            current_user,
            zone_id,
            text,
            duplicate_mode=payload.duplicate_mode,
            filename=payload.filename,
        )
    except BindImportError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)
        ) from exc


async def _read_import_payload(
    *,
    file: UploadFile | None,
    content: str | None,
    filename: str | None,
) -> tuple[str, str | None]:
    if file is not None and file.filename:
        raw = await file.read(bind_import_service.MAX_IMPORT_BYTES + 1)
        name = file.filename
        text = bind_import_service.decode_upload(raw, filename=name)
        return text, name
    if content is not None and content.strip():
        text = bind_import_service.decode_upload(
            content.encode("utf-8"),
            filename=filename,
        )
        return text, filename
    raise BindImportError("Provide a zone file upload or text content")


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
