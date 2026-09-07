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
from app.models.ids import generate_hosted_zone_id

if TYPE_CHECKING:
    from app.models.dns_record import DnsRecord
    from app.models.user import User


class HostedZone(Base):
    __tablename__ = "hosted_zones"
    __table_args__ = (
        CheckConstraint(
            "type IN ('Public', 'Private')",
            name="ck_hosted_zones_type",
        ),
    )

    id: Mapped[str] = mapped_column(
        String(32),
        primary_key=True,
        default=generate_hosted_zone_id,
    )
    name: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    type: Mapped[str] = mapped_column(
        String(16),
        nullable=False,
        default="Public",
        server_default="Public",
    )
    comment: Mapped[str | None] = mapped_column(Text, nullable=True)
    record_count: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
        server_default="0",
    )
    created_by: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        nullable=False,
        index=True,
    )
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

    creator: Mapped[User] = relationship(back_populates="hosted_zones")
    records: Mapped[list[DnsRecord]] = relationship(
        back_populates="hosted_zone",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    def __repr__(self) -> str:
        return f"<HostedZone id={self.id!r} name={self.name!r}>"
