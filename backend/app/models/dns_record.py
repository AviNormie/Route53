from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.ids import generate_dns_record_id

if TYPE_CHECKING:
    from app.models.hosted_zone import HostedZone

_DNS_TYPES = ("A", "AAAA", "CNAME", "TXT", "MX", "NS", "PTR", "SRV", "CAA")
_CAA_TAGS = ("issue", "issuewild", "iodef")


class DnsRecord(Base):
    __tablename__ = "dns_records"
    __table_args__ = (
        CheckConstraint(
            "type IN ('A', 'AAAA', 'CNAME', 'TXT', 'MX', 'NS', 'PTR', 'SRV', 'CAA')",
            name="ck_dns_records_type",
        ),
        CheckConstraint(
            "caa_tag IS NULL OR caa_tag IN ('issue', 'issuewild', 'iodef')",
            name="ck_dns_records_caa_tag",
        ),
    )

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=generate_dns_record_id,
    )
    hosted_zone_id: Mapped[str] = mapped_column(
        String(32),
        ForeignKey("hosted_zones.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    type: Mapped[str] = mapped_column(String(8), nullable=False)
    ttl: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=300,
        server_default="300",
    )
    value: Mapped[str] = mapped_column(Text, nullable=False)
    priority: Mapped[int | None] = mapped_column(Integer, nullable=True)  # MX, SRV
    weight: Mapped[int | None] = mapped_column(Integer, nullable=True)  # SRV
    port: Mapped[int | None] = mapped_column(Integer, nullable=True)  # SRV
    caa_flag: Mapped[int | None] = mapped_column(Integer, nullable=True)  # CAA
    caa_tag: Mapped[str | None] = mapped_column(String(16), nullable=True)  # CAA
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    hosted_zone: Mapped[HostedZone] = relationship(back_populates="records")

    def __repr__(self) -> str:
        return (
            f"<DnsRecord id={self.id!r} type={self.type!r} "
            f"name={self.name!r} zone={self.hosted_zone_id!r}>"
        )


# Re-export for documentation / validation helpers.
DNS_RECORD_TYPES = _DNS_TYPES
CAA_TAGS = _CAA_TAGS
