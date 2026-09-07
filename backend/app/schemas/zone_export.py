"""Schemas for hosted zone export."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

ExportFormat = Literal["json", "bind"]


class HostedZoneBulkExportIn(BaseModel):
    model_config = ConfigDict(extra="forbid")

    zone_ids: list[str] = Field(min_length=1, max_length=100)
    format: ExportFormat = "json"
