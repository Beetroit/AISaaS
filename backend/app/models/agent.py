from __future__ import annotations

from typing import Any, Dict

from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from ulid import ULID

from backend.app.database import Base
from backend.app.models.appointment import Appointment
from backend.app.models.chat_session import ChatSession
from backend.app.models.knowledge_base_document import KnowledgeBaseDocument
from backend.app.models.lead import Lead

# Import related models for type hinting
from backend.app.models.user import User


class Agent(Base):
    __tablename__ = "agents"
    __table_prefix__ = "agt_"

    id: Mapped[str] = mapped_column(
        String(50),
        primary_key=True,
        index=True,
        unique=True,
        default=lambda: f"{Agent.__table_prefix__}{ULID()}",
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(String(500), nullable=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"))

    owner: Mapped[User] = relationship("User", back_populates="agents")
    knowledge_base_documents: Mapped[list[KnowledgeBaseDocument]] = relationship(
        "KnowledgeBaseDocument", back_populates="agent"
    )
    chat_sessions: Mapped[list[ChatSession]] = relationship(
        "ChatSession", back_populates="agent"
    )
    leads: Mapped[list[Lead]] = relationship("Lead", back_populates="agent")
    appointments: Mapped[list[Appointment]] = relationship(
        "Appointment", back_populates="agent"
    )

    def __repr__(self) -> str:
        return f"<Agent(id='{self.id}', name='{self.name}', user_id='{self.user_id}')>"

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "user_id": self.user_id,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
