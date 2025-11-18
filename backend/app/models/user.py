from __future__ import annotations

from typing import TYPE_CHECKING, Any, Dict

from sqlalchemy import Boolean, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from ulid import ULID

from backend.app.database import Base

# Import related models for type hinting
if TYPE_CHECKING:
    from backend.app.models.agent import Agent
    from backend.app.models.appointment import Appointment
    from backend.app.models.chat_session import ChatSession
    from backend.app.models.credential import Credential
    from backend.app.models.knowledge_base_document import KnowledgeBaseDocument
    from backend.app.models.lead import Lead
    from backend.app.models.workflow import Workflow
    from backend.app.models.workflow_run import WorkflowRun


class User(Base):
    __tablename__ = "users"
    __table_prefix__ = "usr_"

    id: Mapped[str] = mapped_column(
        String(50),
        primary_key=True,
        index=True,
        unique=True,
        default=lambda: f"{User.__table_prefix__}{ULID()}",
    )
    email: Mapped[str] = mapped_column(
        String(255), unique=True, index=True, nullable=False
    )
    stripe_customer_id: Mapped[str | None] = mapped_column(
        String(50), nullable=True, unique=True
    )
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    message_credits: Mapped[int] = mapped_column(
        Integer, default=0, server_default="0", nullable=False
    )

    agents: Mapped[list[Agent]] = relationship("Agent", back_populates="owner")
    knowledge_base_documents: Mapped[list[KnowledgeBaseDocument]] = relationship(
        "KnowledgeBaseDocument", back_populates="owner"
    )
    chat_sessions: Mapped[list[ChatSession]] = relationship(
        "ChatSession", back_populates="user"
    )
    leads: Mapped[list[Lead]] = relationship("Lead", back_populates="user")
    appointments: Mapped[list[Appointment]] = relationship(
        "Appointment", back_populates="user"
    )
    credentials: Mapped[list["Credential"]] = relationship(
        "Credential", back_populates="user"
    )
    workflows: Mapped[list["Workflow"]] = relationship(
        "Workflow", back_populates="user"
    )
    workflow_runs: Mapped[list["WorkflowRun"]] = relationship(
        "WorkflowRun", back_populates="user"
    )

    def __repr__(self) -> str:
        return f"<User(id='{self.id}', email='{self.email}')>"

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "email": self.email,
            "stripe_customer_id": self.stripe_customer_id,
            "is_active": self.is_active,
            "message_credits": self.message_credits,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
