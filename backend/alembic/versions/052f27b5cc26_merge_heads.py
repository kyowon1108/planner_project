"""merge_heads

Revision ID: 052f27b5cc26
Revises: 523afc872e1f, 969ddbfa4347
Create Date: 2025-07-29 13:49:02.030038

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '052f27b5cc26'
down_revision: Union[str, None] = ('523afc872e1f', '969ddbfa4347')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
