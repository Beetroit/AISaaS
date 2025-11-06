from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING, Any, Dict

from sqlalchemy import DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from ulid import ULID

from backend.app.database import Base

# Import related models for type hinting
if TYPE_CHECKING:
    from backend.app.models.agent import Agent
    from backend.app.models.lead import Lead
    from backend.app.models.user import User


class Appointment(Base):
    __tablename__ = "appointments"
    __table_prefix__ = "appt_"

    id: Mapped[str] = mapped_column(
        String(50),
        primary_key=True,
        index=True,
        unique=True,
        default=lambda: f"{Appointment.__table_prefix__}{ULID()}",
    )
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"))
    agent_id: Mapped[str] = mapped_column(ForeignKey("agents.id"))
    lead_id: Mapped[str] = mapped_column(ForeignKey("leads.id"))
    appointment_time: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    status: Mapped[str] = mapped_column(
        String(50), default="scheduled"
    )  # e.g., scheduled, completed, cancelled
    notes: Mapped[str | None] = mapped_column(String(500), nullable=True)

    user: Mapped[User] = relationship("User", back_populates="appointments")
    agent: Mapped[Agent] = relationship("Agent", back_populates="appointments")
    lead: Mapped[Lead] = relationship("Lead", back_populates="appointments")

    def __repr__(self) -> str:
        return f"<Appointment(id='{self.id}', user_id='{self.user_id}', agent_id='{self.agent_id}', appointment_time='{self.appointment_time}')>"

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "user_id": self.user_id,
            "agent_id": self.agent_id,
            "lead_id": self.lead_id,
            "appointment_time": self.appointment_time.isoformat()
            if self.appointment_time
            else None,
            "status": self.status,
            "notes": self.notes,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
