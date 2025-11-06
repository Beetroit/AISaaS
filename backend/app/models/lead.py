from __future__ import annotations

from typing import TYPE_CHECKING, Any, Dict

from sqlalchemy import JSON, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from ulid import ULID

from backend.app.database import Base

# Import related models for type hinting
if TYPE_CHECKING:
    from backend.app.models.agent import Agent
    from backend.app.models.appointment import Appointment
    from backend.app.models.chat_session import ChatSession
    from backend.app.models.user import User

# Custom table prefix for ULID generation
__custom_lead_table_prefix = "lead_"


class Lead(Base):
    __tablename__ = "leads"
    __table_prefix__ = "lead_"

    id: Mapped[str] = mapped_column(
        String(50),
        primary_key=True,
        index=True,
        unique=True,
        default=lambda: f"{__custom_lead_table_prefix}{ULID()}",
    )
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"))
    agent_id: Mapped[str] = mapped_column(ForeignKey("agents.id"))
    chat_session_id: Mapped[str] = mapped_column(ForeignKey("chat_sessions.id"))
    qualification_status: Mapped[str] = mapped_column(
        String(50), default="unqualified"
    )  # e.g., unqualified, qualified, rejected
    contact_info: Mapped[dict[str, str]] = mapped_column(JSON, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    user: Mapped[User] = relationship("User", back_populates="leads")
    agent: Mapped[Agent] = relationship("Agent", back_populates="leads")
    chat_session: Mapped[ChatSession] = relationship(
        "ChatSession", back_populates="leads"
    )
    appointments: Mapped[list[Appointment]] = relationship(
        "Appointment", back_populates="lead"
    )

    def __repr__(self) -> str:
        return f"<Lead(id='{self.id}', user_id='{self.user_id}', agent_id='{self.agent_id}')>"

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "user_id": self.user_id,
            "agent_id": self.agent_id,
            "chat_session_id": self.chat_session_id,
            "qualification_status": self.qualification_status,
            "contact_info": self.contact_info,
            "notes": self.notes,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
