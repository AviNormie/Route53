"""Validate parsed BIND records against Route 53–compatible constraints."""

from __future__ import annotations

import ipaddress
import re
from dataclasses import dataclass
from typing import Any, Literal

from app.services.bind_parser import ParsedBindRecord

CaaTag = Literal["issue", "issuewild", "iodef"]
ImportableType = Literal[
    "A", "AAAA", "CNAME", "TXT", "MX", "NS", "PTR", "SRV", "CAA", "SOA"
]

_HOSTNAME_RE = re.compile(
    r"^(?=.{1,253}$)(?!-)[A-Za-z0-9*](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?"
    r"(?:\.(?!-)[A-Za-z0-9*](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)*\.?$"
)
_LABEL_RE = re.compile(r"^[A-Za-z0-9_](?:[A-Za-z0-9_-]{0,61}[A-Za-z0-9_])?$|^@$")


@dataclass
class NormalizedImportRecord:
    name: str
    type: str
    ttl: int
    value: str
    priority: int | None = None
    weight: int | None = None
    port: int | None = None
    caa_flag: int | None = None
    caa_tag: CaaTag | None = None
    line: int = 0
    status: Literal["valid", "invalid", "unsupported", "duplicate"] = "valid"
    reason: str | None = None
    existing_record_id: str | None = None

    def display_value(self) -> str:
        if self.type == "MX" and self.priority is not None:
            return f"{self.priority} {self.value}"
        if self.type == "SRV" and None not in (self.priority, self.weight, self.port):
            return f"{self.priority} {self.weight} {self.port} {self.value}"
        if self.type == "CAA" and self.caa_flag is not None and self.caa_tag:
            return f'{self.caa_flag} {self.caa_tag} "{self.value}"'
        return self.value

    def identity_key(self) -> tuple[Any, ...]:
        return (
            self.name.lower(),
            self.type.upper(),
            self.value,
            self.priority,
            self.weight,
            self.port,
            self.caa_flag,
            self.caa_tag,
        )

    def to_create_payload(self) -> dict[str, Any]:
        payload: dict[str, Any] = {
            "name": self.name,
            "type": self.type,
            "ttl": self.ttl,
            "value": self.value,
        }
        if self.type == "MX":
            payload["priority"] = self.priority
        elif self.type == "SRV":
            payload["priority"] = self.priority
            payload["weight"] = self.weight
            payload["port"] = self.port
        elif self.type == "CAA":
            payload["caa_flag"] = self.caa_flag
            payload["caa_tag"] = self.caa_tag
        return payload


def _valid_hostname(name: str, *, allow_underscore: bool = False) -> bool:
    if not name or len(name) > 255:
        return False
    candidate = name[:-1] if name.endswith(".") else name
    if not candidate:
        return False
    if allow_underscore:
        labels = candidate.split(".")
        return all(
            label == "*"
            or bool(re.fullmatch(r"[A-Za-z0-9_](?:[A-Za-z0-9_-]{0,61}[A-Za-z0-9_])?", label))
            for label in labels
        )
    return bool(_HOSTNAME_RE.fullmatch(name)) or bool(_HOSTNAME_RE.fullmatch(candidate))


def _owner_ok(name: str) -> bool:
    if not name or len(name) > 255 or not name.endswith("."):
        return False
    labels = name[:-1].split(".")
    for label in labels:
        if label == "*":
            continue
        # SRV-style _service._proto labels
        if not re.fullmatch(r"[A-Za-z0-9_](?:[A-Za-z0-9_-]{0,61}[A-Za-z0-9_])?", label):
            return False
    return True


def normalize_and_validate(record: ParsedBindRecord) -> NormalizedImportRecord:
    """Convert a parsed BIND RR into an import candidate with status."""
    base = NormalizedImportRecord(
        name=record.name,
        type=record.type,
        ttl=record.ttl,
        value=record.rdata,
        line=record.line,
    )

    if not record.supported:
        base.status = "unsupported"
        base.reason = f"Unsupported record type {record.type}"
        return base

    if not (0 <= record.ttl <= 2_147_483_647):
        base.status = "invalid"
        base.reason = "Invalid TTL"
        return base

    if not _owner_ok(record.name):
        base.status = "invalid"
        base.reason = "Invalid hostname"
        return base

    rtype = record.type
    tokens = record.rdata.split()

    try:
        if rtype == "A":
            if len(tokens) != 1:
                raise ValueError("A record requires a single IPv4 address")
            ip = ipaddress.ip_address(tokens[0])
            if ip.version != 4:
                raise ValueError("Invalid IPv4 address")
            base.value = str(ip)
        elif rtype == "AAAA":
            if len(tokens) != 1:
                raise ValueError("AAAA record requires a single IPv6 address")
            ip = ipaddress.ip_address(tokens[0])
            if ip.version != 6:
                raise ValueError("Invalid IPv6 address")
            base.value = str(ip)
        elif rtype in {"CNAME", "NS", "PTR"}:
            if len(tokens) != 1:
                raise ValueError(f"{rtype} record requires a single hostname")
            host = tokens[0] if tokens[0].endswith(".") else f"{tokens[0]}."
            if not _valid_hostname(host):
                raise ValueError(f"Invalid {rtype} target hostname")
            base.value = host.lower()
        elif rtype == "MX":
            if len(tokens) != 2:
                raise ValueError("MX record requires priority and exchange")
            priority = int(tokens[0])
            if not (0 <= priority <= 65535):
                raise ValueError("MX priority out of range")
            host = tokens[1] if tokens[1].endswith(".") else f"{tokens[1]}."
            if not _valid_hostname(host):
                raise ValueError("Invalid MX exchange hostname")
            base.priority = priority
            base.value = host.lower()
        elif rtype == "TXT":
            if not record.rdata.strip():
                raise ValueError("TXT record value is empty")
            if len(record.rdata) > 4000:
                raise ValueError("TXT record too long")
            base.value = record.rdata
        elif rtype == "SRV":
            if len(tokens) != 4:
                raise ValueError("SRV record requires priority weight port target")
            priority, weight, port = int(tokens[0]), int(tokens[1]), int(tokens[2])
            for label, val in (
                ("priority", priority),
                ("weight", weight),
                ("port", port),
            ):
                if not (0 <= val <= 65535):
                    raise ValueError(f"SRV {label} out of range")
            host = tokens[3] if tokens[3].endswith(".") else f"{tokens[3]}."
            if not _valid_hostname(host, allow_underscore=True):
                raise ValueError("Invalid SRV target hostname")
            base.priority = priority
            base.weight = weight
            base.port = port
            base.value = host.lower()
        elif rtype == "CAA":
            if len(tokens) < 3:
                raise ValueError("CAA record requires flag tag value")
            flag = int(tokens[0])
            if not (0 <= flag <= 255):
                raise ValueError("CAA flag out of range")
            tag = tokens[1].lower()
            if tag not in {"issue", "issuewild", "iodef"}:
                raise ValueError("Malformed CAA tag")
            value = " ".join(tokens[2:]).strip().strip('"')
            if not value:
                raise ValueError("CAA value is empty")
            base.caa_flag = flag
            base.caa_tag = tag  # type: ignore[assignment]
            base.value = value
        elif rtype == "SOA":
            # mname rname serial refresh retry expire minimum
            if len(tokens) < 7:
                raise ValueError("Malformed SOA record")
            mname = tokens[0] if tokens[0].endswith(".") else f"{tokens[0]}."
            rname = tokens[1] if tokens[1].endswith(".") else f"{tokens[1]}."
            if not _valid_hostname(mname) or not _valid_hostname(rname):
                raise ValueError("Invalid SOA hostname")
            for num in tokens[2:7]:
                int(num)
            base.value = (
                f"{mname.lower()} {rname.lower()} "
                f"{tokens[2]} {tokens[3]} {tokens[4]} {tokens[5]} {tokens[6]}"
            )
        else:
            base.status = "unsupported"
            base.reason = f"Unsupported record type {rtype}"
            return base
    except (ValueError, ipaddress.AddressValueError) as exc:
        base.status = "invalid"
        base.reason = str(exc)
        return base

    base.status = "valid"
    base.reason = None
    return base
