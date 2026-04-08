"""initial_schema

Revision ID: a539c9e68a9d
Revises:
Create Date: 2026-02-03 22:14:44.844936

Diese Migration ist die Baseline - sie nimmt an, dass die Datenbank
bereits mit allen Tabellen existiert (manuell oder via SQLAlchemy create_all).
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a539c9e68a9d'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """
    Baseline Migration - keine Änderungen.
    Die Datenbank existiert bereits mit allen Tabellen:
    - users
    - vocab_lists
    - vocab_groups
    - list_columns
    - vocab_entries
    - entry_field_values
    """
    pass


def downgrade() -> None:
    """
    Baseline Migration - keine Änderungen.
    """
    pass
