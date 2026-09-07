"""BIND zone-file import: preview and commit against a hosted zone."""

from __future__ import annotations

from typing import Any, Literal

from pydantic import TypeAdapter, ValidationError
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.dns_record import DnsRecord
from app.models.user import User
from app.schemas.bind_import import (
    BindImportFailure,
    BindImportPreviewOut,
    BindImportPreviewRecord,
    BindImportResultOut,
    BindImportSummary,
)
from app.schemas.dns_record import DnsRecordCreate
from app.services import hosted_zone_service
from app.services.bind_parser import BindParseError, parse_zone_file
from app.services.bind_validator import NormalizedImportRecord, normalize_and_validate
from app.services.dns_record_service import _payload_to_columns

MAX_IMPORT_BYTES = 1_048_576  # 1 MiB
ALLOWED_EXTENSIONS = frozenset({".zone", ".bind", ".txt"})

_DnsRecordCreateAdapter: TypeAdapter[Any] = TypeAdapter(DnsRecordCreate)


class BindImportError(Exception):
    """User-facing import error."""


def decode_upload(raw: bytes, filename: str | None = None) -> str:
    """Decode uploaded bytes as UTF-8 text with size / binary checks."""
    if len(raw) == 0:
        raise BindImportError("Empty file")
    if len(raw) > MAX_IMPORT_BYTES:
        raise BindImportError(f"File exceeds maximum size of {MAX_IMPORT_BYTES} bytes")
    if b"\x00" in raw:
        raise BindImportError("Binary content is not allowed")

    if filename:
        lower = filename.lower().rsplit("/", 1)[-1]
        if "." in lower:
            ext = "." + lower.rsplit(".", 1)[-1]
            if ext not in ALLOWED_EXTENSIONS:
                raise BindImportError(
                    "Unsupported file type. Use .zone, .bind, or .txt"
                )

    try:
        text = raw.decode("utf-8")
    except UnicodeDecodeError as exc:
        raise BindImportError("File must be UTF-8 text") from exc

    sample = text[:4096]
    printable = sum(1 for ch in sample if ch.isprintable() or ch in "\n\r\t")
    if sample and printable / len(sample) < 0.85:
        raise BindImportError("File does not look like a text zone file")
    return text


def _existing_identity(record: DnsRecord) -> tuple:
    return (
        record.name.lower(),
        record.type.upper(),
        record.value,
        record.priority,
        record.weight,
        record.port,
        record.caa_flag,
        record.caa_tag,
    )


def _list_zone_records(db: Session, zone_id: str) -> list[DnsRecord]:
    return list(
        db.scalars(select(DnsRecord).where(DnsRecord.hosted_zone_id == zone_id)).all()
    )


def build_preview(
    db: Session,
    user: User,
    zone_id: str,
    content: str,
    *,
    filename: str | None = None,
) -> BindImportPreviewOut:
    zone = hosted_zone_service.get_by_id(db, user, zone_id)

    try:
        parsed = parse_zone_file(content, default_origin=zone.name)
    except BindParseError as exc:
        raise BindImportError(str(exc)) from exc

    if not parsed.records:
        raise BindImportError("No DNS records found in zone file")

    existing = {_existing_identity(r): r for r in _list_zone_records(db, zone_id)}
    preview_rows: list[BindImportPreviewRecord] = []
    counts = {"valid": 0, "invalid": 0, "unsupported": 0, "duplicate": 0}
    seen_in_file: set[tuple] = set()

    for index, raw in enumerate(parsed.records):
        normalized = normalize_and_validate(raw)
        if normalized.status == "valid":
            key = normalized.identity_key()
            if key in seen_in_file:
                normalized.status = "duplicate"
                normalized.reason = "Duplicate record in zone file"
            else:
                seen_in_file.add(key)
                match = existing.get(key)
                if match is not None:
                    normalized.status = "duplicate"
                    normalized.reason = "Record already exists in hosted zone"
                    normalized.existing_record_id = match.id

        counts[normalized.status] = counts.get(normalized.status, 0) + 1
        preview_rows.append(
            BindImportPreviewRecord(
                index=index,
                name=normalized.name,
                type=normalized.type,
                value=normalized.display_value(),
                ttl=normalized.ttl,
                priority=normalized.priority,
                weight=normalized.weight,
                port=normalized.port,
                caa_flag=normalized.caa_flag,
                caa_tag=normalized.caa_tag,
                status=normalized.status,  # type: ignore[arg-type]
                reason=normalized.reason,
                existing_record_id=normalized.existing_record_id,
                line=normalized.line,
            )
        )

    return BindImportPreviewOut(
        origin=parsed.origin or zone.name,
        filename=filename,
        records=preview_rows,
        summary=BindImportSummary(
            total=len(preview_rows),
            valid=counts["valid"],
            invalid=counts["invalid"],
            unsupported=counts["unsupported"],
            duplicate=counts["duplicate"],
        ),
        warnings=parsed.warnings,
    )


def _to_typed_payload(normalized: NormalizedImportRecord) -> Any:
    try:
        return _DnsRecordCreateAdapter.validate_python(normalized.to_create_payload())
    except ValidationError as exc:
        messages = "; ".join(err.get("msg", "invalid") for err in exc.errors())
        raise BindImportError(messages) from exc


def commit_import(
    db: Session,
    user: User,
    zone_id: str,
    content: str,
    *,
    duplicate_mode: Literal["skip", "replace"] = "skip",
    filename: str | None = None,
) -> BindImportResultOut:
    _ = filename
    zone = hosted_zone_service.get_by_id(db, user, zone_id)

    try:
        parsed = parse_zone_file(content, default_origin=zone.name)
    except BindParseError as exc:
        raise BindImportError(str(exc)) from exc

    if not parsed.records:
        raise BindImportError("No DNS records found in zone file")

    existing_by_key = {
        _existing_identity(r): r for r in _list_zone_records(db, zone_id)
    }
    seen_in_file: set[tuple] = set()

    imported = 0
    skipped = 0
    failures: list[BindImportFailure] = []

    for raw in parsed.records:
        normalized = normalize_and_validate(raw)
        display = normalized.display_value()

        if normalized.status in {"invalid", "unsupported"}:
            skipped += 1
            continue

        key = normalized.identity_key()
        if key in seen_in_file:
            skipped += 1
            continue
        seen_in_file.add(key)

        existing = existing_by_key.get(key)
        if existing is not None:
            if duplicate_mode == "skip":
                skipped += 1
                continue
            try:
                payload = _to_typed_payload(normalized)
                for col, val in _payload_to_columns(payload).items():
                    setattr(existing, col, val)
                db.add(existing)
                imported += 1
            except BindImportError as exc:
                failures.append(
                    BindImportFailure(
                        name=normalized.name,
                        type=normalized.type,
                        value=display,
                        reason=str(exc),
                    )
                )
            except Exception as exc:  # noqa: BLE001
                failures.append(
                    BindImportFailure(
                        name=normalized.name,
                        type=normalized.type,
                        value=display,
                        reason=str(exc),
                    )
                )
            continue

        try:
            payload = _to_typed_payload(normalized)
            record = DnsRecord(hosted_zone_id=zone_id, **_payload_to_columns(payload))
            db.add(record)
            db.flush()
            existing_by_key[key] = record
            imported += 1
        except BindImportError as exc:
            failures.append(
                BindImportFailure(
                    name=normalized.name,
                    type=normalized.type,
                    value=display,
                    reason=str(exc),
                )
            )
        except Exception as exc:  # noqa: BLE001
            failures.append(
                BindImportFailure(
                    name=normalized.name,
                    type=normalized.type,
                    value=display,
                    reason=str(exc),
                )
            )

    count = db.scalar(
        select(func.count())
        .select_from(DnsRecord)
        .where(DnsRecord.hosted_zone_id == zone_id)
    )
    zone.record_count = int(count or 0)
    db.add(zone)
    db.commit()

    return BindImportResultOut(
        imported=imported,
        skipped=skipped,
        failed=len(failures),
        failures=failures,
    )
