"""create users sessions hosted_zones dns_records

Revision ID: 922b54a6cc68
Revises:
Create Date: 2026-09-07 19:42:22.801137
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "922b54a6cc68"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("email", sa.String(length=320), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("(CURRENT_TIMESTAMP)"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    with op.batch_alter_table("users", schema=None) as batch_op:
        batch_op.create_index(batch_op.f("ix_users_email"), ["email"], unique=True)

    op.create_table(
        "hosted_zones",
        sa.Column("id", sa.String(length=32), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column(
            "type", sa.String(length=16), server_default="Public", nullable=False
        ),
        sa.Column("comment", sa.Text(), nullable=True),
        sa.Column("record_count", sa.Integer(), server_default="0", nullable=False),
        sa.Column("created_by", sa.Integer(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("(CURRENT_TIMESTAMP)"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("(CURRENT_TIMESTAMP)"),
            nullable=False,
        ),
        sa.CheckConstraint(
            "type IN ('Public', 'Private')", name="ck_hosted_zones_type"
        ),
        sa.ForeignKeyConstraint(["created_by"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    with op.batch_alter_table("hosted_zones", schema=None) as batch_op:
        batch_op.create_index(
            batch_op.f("ix_hosted_zones_created_by"), ["created_by"], unique=False
        )
        batch_op.create_index(
            batch_op.f("ix_hosted_zones_name"), ["name"], unique=False
        )

    op.create_table(
        "sessions",
        sa.Column("id", sa.String(length=128), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("(CURRENT_TIMESTAMP)"),
            nullable=False,
        ),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    with op.batch_alter_table("sessions", schema=None) as batch_op:
        batch_op.create_index(
            batch_op.f("ix_sessions_user_id"), ["user_id"], unique=False
        )

    op.create_table(
        "dns_records",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("hosted_zone_id", sa.String(length=32), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("type", sa.String(length=8), nullable=False),
        sa.Column("ttl", sa.Integer(), server_default="300", nullable=False),
        sa.Column("value", sa.Text(), nullable=False),
        sa.Column("priority", sa.Integer(), nullable=True),
        sa.Column("weight", sa.Integer(), nullable=True),
        sa.Column("port", sa.Integer(), nullable=True),
        sa.Column("caa_flag", sa.Integer(), nullable=True),
        sa.Column("caa_tag", sa.String(length=16), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("(CURRENT_TIMESTAMP)"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("(CURRENT_TIMESTAMP)"),
            nullable=False,
        ),
        sa.CheckConstraint(
            "caa_tag IS NULL OR caa_tag IN ('issue', 'issuewild', 'iodef')",
            name="ck_dns_records_caa_tag",
        ),
        sa.CheckConstraint(
            "type IN ('A', 'AAAA', 'CNAME', 'TXT', 'MX', 'NS', 'PTR', 'SRV', 'CAA')",
            name="ck_dns_records_type",
        ),
        sa.ForeignKeyConstraint(
            ["hosted_zone_id"], ["hosted_zones.id"], ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    with op.batch_alter_table("dns_records", schema=None) as batch_op:
        batch_op.create_index(
            batch_op.f("ix_dns_records_hosted_zone_id"),
            ["hosted_zone_id"],
            unique=False,
        )
        batch_op.create_index(batch_op.f("ix_dns_records_name"), ["name"], unique=False)


def downgrade() -> None:
    with op.batch_alter_table("dns_records", schema=None) as batch_op:
        batch_op.drop_index(batch_op.f("ix_dns_records_name"))
        batch_op.drop_index(batch_op.f("ix_dns_records_hosted_zone_id"))

    op.drop_table("dns_records")
    with op.batch_alter_table("sessions", schema=None) as batch_op:
        batch_op.drop_index(batch_op.f("ix_sessions_user_id"))

    op.drop_table("sessions")
    with op.batch_alter_table("hosted_zones", schema=None) as batch_op:
        batch_op.drop_index(batch_op.f("ix_hosted_zones_name"))
        batch_op.drop_index(batch_op.f("ix_hosted_zones_created_by"))

    op.drop_table("hosted_zones")
    with op.batch_alter_table("users", schema=None) as batch_op:
        batch_op.drop_index(batch_op.f("ix_users_email"))

    op.drop_table("users")
