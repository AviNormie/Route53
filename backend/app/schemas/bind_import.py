"""Schemas for BIND zone-file import preview and commit."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

DuplicateMode = Literal["skip", "replace"]
ImportRecordStatus = Literal["valid", "invalid", "unsupported", "duplicate"]


class BindImportPreviewRecord(BaseModel):
    index: int
    name: str
    type: str
    value: str
    ttl: int
    priority: int | None = None
    weight: int | None = None
    port: int | None = None
    caa_flag: int | None = None
    caa_tag: str | None = None
    status: ImportRecordStatus
    reason: str | None = None
    existing_record_id: str | None = None
    line: int | None = None


class BindImportSummary(BaseModel):
    total: int
    valid: int
    invalid: int
    unsupported: int
    duplicate: int


class BindImportPreviewOut(BaseModel):
    origin: str | None = None
    filename: str | None = None
    records: list[BindImportPreviewRecord]
    summary: BindImportSummary
    warnings: list[str] = Field(default_factory=list)


class BindImportContentIn(BaseModel):
    model_config = ConfigDict(extra="forbid")

    content: str = Field(min_length=1, max_length=1_048_576)
    filename: str | None = Field(default=None, max_length=255)


class BindImportCommitIn(BaseModel):
    model_config = ConfigDict(extra="forbid")

    content: str = Field(min_length=1, max_length=1_048_576)
    filename: str | None = Field(default=None, max_length=255)
    duplicate_mode: DuplicateMode = "skip"


class BindImportFailure(BaseModel):
    name: str
    type: str
    value: str
    reason: str


class BindImportResultOut(BaseModel):
    imported: int
    skipped: int
    failed: int
    failures: list[BindImportFailure] = Field(default_factory=list)
