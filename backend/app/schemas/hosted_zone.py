"""Pydantic schemas for hosted zones."""

from __future__ import annotations

import re
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator

_DOMAIN_RE = re.compile(r"^(?=.{1,253}$)(?!-)([a-zA-Z0-9-]{1,63}\.)+[a-zA-Z]{2,63}\.?$")


def normalize_zone_name(name: str) -> str:
    """Normalize a hosted zone domain to lowercase with a trailing dot."""
    cleaned = name.strip().lower().rstrip(".")
    if not cleaned:
        raise ValueError("Domain name is required")
    candidate = f"{cleaned}."
    if not _DOMAIN_RE.match(candidate):
        raise ValueError("Invalid domain name")
    return candidate


class HostedZoneCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    comment: str | None = Field(default=None, max_length=2000)
    type: Literal["Public", "Private"] = "Public"

    @field_validator("name")
    @classmethod
    def validate_name(cls, value: str) -> str:
        return normalize_zone_name(value)

    @field_validator("comment")
    @classmethod
    def empty_comment_to_none(cls, value: str | None) -> str | None:
        if value is None:
            return None
        stripped = value.strip()
        return stripped or None


class HostedZoneUpdate(BaseModel):
    comment: str | None = Field(default=None, max_length=2000)

    @field_validator("comment")
    @classmethod
    def empty_comment_to_none(cls, value: str | None) -> str | None:
        if value is None:
            return None
        stripped = value.strip()
        return stripped or None


class HostedZoneOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    type: Literal["Public", "Private"]
    comment: str | None
    record_count: int
    created_by: int
    created_at: datetime
    updated_at: datetime


class HostedZoneListOut(BaseModel):
    items: list[HostedZoneOut]
    total: int
    page: int
    page_size: int
