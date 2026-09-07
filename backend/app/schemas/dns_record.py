"""Pydantic schemas for DNS records.

Tradeoff — discriminated union vs single model + model_validator:
We use a Pydantic v2 *discriminated union* on ``type``. Each variant declares
only the fields that type allows and sets ``extra="forbid"``, so sending
``priority`` on an A record yields a clear 422 instead of being ignored.
A single schema with ``model_validator`` is more compact, but you must manually
reject irrelevant fields and the openAPI schema becomes one oversized object.
The union is more verbose, but type-safe and gives better client docs/errors.
"""

from __future__ import annotations

from datetime import datetime
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field

CaaTag = Literal["issue", "issuewild", "iodef"]
DnsRecordType = Literal[
    "A", "AAAA", "CNAME", "TXT", "MX", "NS", "PTR", "SRV", "CAA", "SOA"
]


class _StrictBase(BaseModel):
    model_config = ConfigDict(extra="forbid")


class _SimpleRecordBase(_StrictBase):
    name: str = Field(min_length=1, max_length=255)
    ttl: int = Field(default=300, ge=0, le=2_147_483_647)
    value: str = Field(min_length=1)


class ARecordCreate(_SimpleRecordBase):
    type: Literal["A"]


class AAAARecordCreate(_SimpleRecordBase):
    type: Literal["AAAA"]


class CnameRecordCreate(_SimpleRecordBase):
    type: Literal["CNAME"]


class TxtRecordCreate(_SimpleRecordBase):
    type: Literal["TXT"]


class NsRecordCreate(_SimpleRecordBase):
    type: Literal["NS"]


class PtrRecordCreate(_SimpleRecordBase):
    type: Literal["PTR"]


class SoaRecordCreate(_SimpleRecordBase):
    type: Literal["SOA"]


class MxRecordCreate(_SimpleRecordBase):
    type: Literal["MX"]
    priority: int = Field(ge=0, le=65535)


class SrvRecordCreate(_SimpleRecordBase):
    type: Literal["SRV"]
    priority: int = Field(ge=0, le=65535)
    weight: int = Field(ge=0, le=65535)
    port: int = Field(ge=0, le=65535)


class CaaRecordCreate(_SimpleRecordBase):
    type: Literal["CAA"]
    caa_flag: int = Field(ge=0, le=255)
    caa_tag: CaaTag


DnsRecordCreate = Annotated[
    ARecordCreate
    | AAAARecordCreate
    | CnameRecordCreate
    | TxtRecordCreate
    | NsRecordCreate
    | PtrRecordCreate
    | SoaRecordCreate
    | MxRecordCreate
    | SrvRecordCreate
    | CaaRecordCreate,
    Field(discriminator="type"),
]

# Updates reuse the same per-type shapes (type may change; irrelevant columns
# are cleared in the service when applying the payload).
DnsRecordUpdate = DnsRecordCreate


class DnsRecordOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    hosted_zone_id: str
    name: str
    type: DnsRecordType
    ttl: int
    value: str
    priority: int | None = None
    weight: int | None = None
    port: int | None = None
    caa_flag: int | None = None
    caa_tag: CaaTag | None = None
    created_at: datetime
    updated_at: datetime


class DnsRecordListOut(BaseModel):
    items: list[DnsRecordOut]
    total: int
    page: int
    page_size: int
