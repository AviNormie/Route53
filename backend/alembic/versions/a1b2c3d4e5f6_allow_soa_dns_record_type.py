"""allow SOA dns record type

Revision ID: a1b2c3d4e5f6
Revises: 922b54a6cc68
Create Date: 2026-09-08 02:20:00.000000
"""

from collections.abc import Sequence

from alembic import op

revision: str = "a1b2c3d4e5f6"
down_revision: str | None = "922b54a6cc68"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    with op.batch_alter_table("dns_records") as batch_op:
        batch_op.drop_constraint("ck_dns_records_type", type_="check")
        batch_op.create_check_constraint(
            "ck_dns_records_type",
            "type IN ('A', 'AAAA', 'CNAME', 'TXT', 'MX', 'NS', 'PTR', 'SRV', 'CAA', 'SOA')",
        )


def downgrade() -> None:
    with op.batch_alter_table("dns_records") as batch_op:
        batch_op.drop_constraint("ck_dns_records_type", type_="check")
        batch_op.create_check_constraint(
            "ck_dns_records_type",
            "type IN ('A', 'AAAA', 'CNAME', 'TXT', 'MX', 'NS', 'PTR', 'SRV', 'CAA')",
        )
