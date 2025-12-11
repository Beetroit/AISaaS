"""Admin Activity Log Model

Stores audit trail of all admin actions for accountability and compliance.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from sqlalchemy import DateTime, String
from sqlalchemy.dialects.postgresql import JSON
from sqlalchemy.orm import Mapped, mapped_column
from ulid import ULID

from backend.app.database import Base


class AdminActivityLog(Base):
    """Model for admin activity logging"""

    __tablename__ = "admin_activity_logs"
    __table_prefix__ = "adl_"

    id: Mapped[str] = mapped_column(
        String(50),
        primary_key=True,
        index=True,
        unique=True,
        default=lambda: f"{AdminActivityLog.__table_prefix__}{ULID()}",
    )
    admin_id: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    action_type: Mapped[str] = mapped_column(
        String(100), nullable=False, index=True
    )  # suspend_user, delete_user, etc.
    target_resource: Mapped[str] = mapped_column(
        String(100), nullable=False
    )  # user:usr_123
    details: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False, default=dict)
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        index=True,
    )

    def __repr__(self) -> str:
        return f"<AdminActivityLog(id='{self.id}', action='{self.action_type}', admin='{self.admin_id}')>"

    def to_dict(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "admin_id": self.admin_id,
            "action_type": self.action_type,
            "target_resource": self.target_resource,
            "details": self.details,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
        }
