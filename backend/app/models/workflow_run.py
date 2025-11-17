from datetime import datetime, timezone
from typing import TYPE_CHECKING, Any, Dict

from sqlalchemy import JSON, DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from ulid import ULID

from backend.app.database import Base

if TYPE_CHECKING:
    from backend.app.models.agent import Agent
    from backend.app.models.chat_session import ChatSession
    from backend.app.models.credential import Credential
    from backend.app.models.lead import Lead
    from backend.app.models.user import User
    from backend.app.models.workflow import Workflow


class WorkflowRun(Base):
    __tablename__ = "workflow_runs"
    __custom_table_prefix = "wfrn_"

    id: Mapped[str] = mapped_column(
        String(50),
        primary_key=True,
        index=True,
        unique=True,
        default=lambda: f"{WorkflowRun.__custom_table_prefix}{ULID()}",
    )
    agent_id: Mapped[str] = mapped_column(String(50), ForeignKey("agents.id"))
    workflow_id: Mapped[str] = mapped_column(String(50), ForeignKey("workflows.id"))
    chat_session_id: Mapped[str | None] = mapped_column(
        String(50), ForeignKey("chat_sessions.id"), nullable=True
    )
    lead_id: Mapped[str | None] = mapped_column(
        String(50), ForeignKey("leads.id"), nullable=True
    )
    credential_id: Mapped[str | None] = mapped_column(
        String(50), ForeignKey("credentials.id"), nullable=True
    )  # For Twilio credentials
    user_id: Mapped[str] = mapped_column(String(50), ForeignKey("users.id"))

    status: Mapped[str] = mapped_column(
        String(50), default="in_progress"
    )  # e.g., "in_progress", "completed", "failed"
    initial_data: Mapped[Dict[str, Any]] = mapped_column(
        JSON, default=dict
    )  # For UI testing or initial context

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )
    end_time: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    agent: Mapped["Agent"] = relationship("Agent", back_populates="workflow_runs")
    workflow: Mapped["Workflow"] = relationship(
        "Workflow", back_populates="workflow_runs"
    )
    chat_session: Mapped["ChatSession"] = relationship(
        "ChatSession", back_populates="workflow_run"
    )
    lead: Mapped["Lead"] = relationship("Lead", back_populates="workflow_run")
    credential: Mapped["Credential"] = relationship("Credential")
    user: Mapped["User"] = relationship("User", back_populates="workflow_runs")

    def __repr__(self) -> str:
        return f"<WorkflowRun(id='{self.id}', user_id='{self.user_id}', agent_id='{self.agent_id}', workflow_id='{self.workflow_id}', status='{self.status}')>"

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "agent_id": self.agent_id,
            "workflow_id": self.workflow_id,
            "chat_session_id": self.chat_session_id,
            "lead_id": self.lead_id,
            "credential_id": self.credential_id,
            "user_id": self.user_id,
            "status": self.status,
            "initial_data": self.initial_data,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "end_time": self.end_time.isoformat() if self.end_time else None,
        }
