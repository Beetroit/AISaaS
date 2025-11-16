from datetime import datetime, timezone
from typing import TYPE_CHECKING, Any, Dict, List

from sqlalchemy import JSON, DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from ulid import ULID

from backend.app.database import Base
from backend.app.models.user import User

if TYPE_CHECKING:
    from backend.app.models.agent import Agent
    from backend.app.models.workflow_run import WorkflowRun


class Workflow(Base):
    __tablename__ = "workflows"
    __custom_table_prefix = "wfl_"

    id: Mapped[str] = mapped_column(
        String(50),
        primary_key=True,
        index=True,
        unique=True,
        default=lambda: f"{Workflow.__custom_table_prefix}{ULID()}",
    )
    name: Mapped[str] = mapped_column(String(256), index=True)
    description: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    user_id: Mapped[str] = mapped_column(String(50), ForeignKey("users.id"))
    workflow_schema: Mapped[Dict[str, Any]] = mapped_column(JSON)
    knowledge_base_document_ids: Mapped[List[str]] = mapped_column(
        JSON, default=list
    )  # List of document IDs

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    user: Mapped["User"] = relationship("User", back_populates="workflows")
    agents: Mapped[List["Agent"]] = relationship(
        "Agent", secondary="agent_workflows", back_populates="workflows"
    )
    workflow_runs: Mapped[List["WorkflowRun"]] = relationship(
        "WorkflowRun", back_populates="workflow"
    )

    def __repr__(self) -> str:
        return (
            f"<Workflow(id='{self.id}', name='{self.name}', user_id='{self.user_id}')>"
        )

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "user_id": self.user_id,
            "workflow_schema": self.workflow_schema,
            "knowledge_base_document_ids": self.knowledge_base_document_ids,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
