"""Serialize hosted zones to stable JSON and BIND zone-file formats."""

from __future__ import annotations

import io
import json
import zipfile
from typing import Any, Literal

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.dns_record import DnsRecord
from app.models.hosted_zone import HostedZone
from app.models.user import User
from app.services import hosted_zone_service

ExportFormat = Literal["json", "bind"]


def _list_records(db: Session, zone_id: str) -> list[DnsRecord]:
    return list(
        db.scalars(
            select(DnsRecord)
            .where(DnsRecord.hosted_zone_id == zone_id)
            .order_by(DnsRecord.name.asc(), DnsRecord.type.asc(), DnsRecord.value.asc())
        ).all()
    )


def escape_txt_rdata(value: str) -> str:
    """Quote a TXT string for BIND, escaping backslash and double-quote."""
    escaped = value.replace("\\", "\\\\").replace('"', '\\"')
    return f'"{escaped}"'


def record_to_bind_rdata(record: DnsRecord) -> str:
    """Build BIND rdata from stored columns."""
    rtype = record.type.upper()
    if rtype == "MX":
        priority = record.priority if record.priority is not None else 0
        return f"{priority} {record.value}"
    if rtype == "SRV":
        priority = record.priority if record.priority is not None else 0
        weight = record.weight if record.weight is not None else 0
        port = record.port if record.port is not None else 0
        return f"{priority} {weight} {port} {record.value}"
    if rtype == "CAA":
        flag = record.caa_flag if record.caa_flag is not None else 0
        tag = record.caa_tag or "issue"
        return f"{flag} {tag} {escape_txt_rdata(record.value)}"
    if rtype == "TXT":
        return escape_txt_rdata(record.value)
    return record.value


def record_to_export_dict(record: DnsRecord) -> dict[str, Any]:
    """Stable public JSON shape for one DNS record (no internal ids/timestamps)."""
    item: dict[str, Any] = {
        "name": record.name,
        "type": record.type,
        "ttl": record.ttl,
        "value": record.value,
    }
    if record.type == "MX" and record.priority is not None:
        item["priority"] = record.priority
    if record.type == "SRV":
        if record.priority is not None:
            item["priority"] = record.priority
        if record.weight is not None:
            item["weight"] = record.weight
        if record.port is not None:
            item["port"] = record.port
    if record.type == "CAA":
        if record.caa_flag is not None:
            item["caa_flag"] = record.caa_flag
        if record.caa_tag is not None:
            item["caa_tag"] = record.caa_tag
    return item


def zone_to_export_dict(zone: HostedZone, records: list[DnsRecord]) -> dict[str, Any]:
    return {
        "name": zone.name,
        "zoneId": zone.id,
        "type": zone.type.upper(),
        "description": zone.comment or "",
        "records": [record_to_export_dict(r) for r in records],
        "tags": [],
    }


def zone_to_bind(zone: HostedZone, records: list[DnsRecord]) -> str:
    """Render a valid BIND zone file for the hosted zone."""
    default_ttl = 300
    if records:
        # Prefer the most common TTL as $TTL for readability
        counts: dict[int, int] = {}
        for record in records:
            counts[record.ttl] = counts.get(record.ttl, 0) + 1
        default_ttl = max(counts.items(), key=lambda item: item[1])[0]

    lines: list[str] = [
        f"$ORIGIN {zone.name}",
        f"$TTL {default_ttl}",
        "",
    ]
    for record in records:
        ttl_token = "" if record.ttl == default_ttl else f"{record.ttl} "
        rdata = record_to_bind_rdata(record)
        lines.append(f"{record.name} {ttl_token}IN {record.type} {rdata}")
    lines.append("")
    return "\n".join(lines)


def export_filename(zone_name: str, fmt: ExportFormat) -> str:
    base = zone_name.rstrip(".").lower() or "hosted-zone"
    # Keep filesystem-safe characters
    safe = "".join(ch if ch.isalnum() or ch in ".-_" else "-" for ch in base)
    return f"{safe}.json" if fmt == "json" else f"{safe}.zone"


def build_zone_export(
    db: Session,
    user: User,
    zone_id: str,
    fmt: ExportFormat,
) -> tuple[str, str, str]:
    """Return (filename, media_type, body)."""
    zone = hosted_zone_service.get_by_id(db, user, zone_id)
    records = _list_records(db, zone.id)
    filename = export_filename(zone.name, fmt)
    if fmt == "json":
        body = json.dumps(zone_to_export_dict(zone, records), indent=2, sort_keys=False)
        return filename, "application/json; charset=utf-8", body
    body = zone_to_bind(zone, records)
    return filename, "text/dns; charset=utf-8", body


def build_bulk_export(
    db: Session,
    user: User,
    zone_ids: list[str],
    fmt: ExportFormat,
) -> tuple[str, str, bytes]:
    """Export one or more zones. Multi BIND returns a zip; multi JSON an array wrapper."""
    if not zone_ids:
        raise ValueError("Select at least one hosted zone")

    # De-dupe while preserving order
    seen: set[str] = set()
    ordered: list[str] = []
    for zone_id in zone_ids:
        if zone_id not in seen:
            seen.add(zone_id)
            ordered.append(zone_id)

    if len(ordered) == 1:
        filename, media, body = build_zone_export(db, user, ordered[0], fmt)
        return filename, media, body.encode("utf-8")

    zones_payload: list[dict[str, Any]] = []
    bind_files: list[tuple[str, str]] = []
    for zone_id in ordered:
        zone = hosted_zone_service.get_by_id(db, user, zone_id)
        records = _list_records(db, zone.id)
        zones_payload.append(zone_to_export_dict(zone, records))
        bind_files.append((export_filename(zone.name, "bind"), zone_to_bind(zone, records)))

    if fmt == "json":
        payload = {"zones": zones_payload}
        body = json.dumps(payload, indent=2).encode("utf-8")
        return "hosted-zones-export.json", "application/json; charset=utf-8", body

    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, "w", compression=zipfile.ZIP_DEFLATED) as archive:
        used_names: set[str] = set()
        for name, content in bind_files:
            candidate = name
            suffix = 1
            while candidate in used_names:
                stem = name[:-5] if name.endswith(".zone") else name
                candidate = f"{stem}-{suffix}.zone"
                suffix += 1
            used_names.add(candidate)
            archive.writestr(candidate, content)
    return (
        "hosted-zones-export.zip",
        "application/zip",
        buffer.getvalue(),
    )
