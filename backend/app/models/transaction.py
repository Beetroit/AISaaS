"""Transaction Model

Stores payment transaction history for revenue tracking and audit.
"""

from __future__ import annotations

from typing import Any

from sqlalchemy import Float, ForeignKey, String
from sqlalchemy.dialects.postgresql import JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from ulid import ULID

from backend.app.database import Base


class Transaction(Base):
    """Model for payment transactions"""

    __tablename__ = "transactions"
    __table_prefix__ = "txn_"

    id: Mapped[str] = mapped_column(
        String(50),
        primary_key=True,
        index=True,
        unique=True,
        default=lambda: f"{Transaction.__table_prefix__}{ULID()}",
    )
    user_id: Mapped[str] = mapped_column(
        String(50), ForeignKey("users.id"), nullable=False, index=True
    )
    amount: Mapped[float] = mapped_column(Float, nullable=False)

    currency: Mapped[str] = mapped_column(String(3), nullable=False, default="usd")
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="pending"
    )  # pending, completed, failed, refunded
    stripe_payment_id: Mapped[str] = mapped_column(
        String(100), nullable=True, index=True
    )
    payment_metadata: Mapped[dict[str, Any]] = mapped_column(
        JSON, nullable=False, default=dict
    )

    # Relationships
    user = relationship("User", backref="transactions")

    def __repr__(self) -> str:
        return f"<Transaction(id='{self.id}', amount={self.amount}, status='{self.status}')>"
