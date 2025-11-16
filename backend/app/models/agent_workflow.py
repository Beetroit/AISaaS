from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from backend.app.database import Base

__custom_table_prefix = "agent_workflow_"


class AgentWorkflow(Base):
    __tablename__ = "agent_workflows"

    agent_id: Mapped[str] = mapped_column(
        String(50), ForeignKey("agents.id"), primary_key=True
    )
    workflow_id: Mapped[str] = mapped_column(
        String(50), ForeignKey("workflows.id"), primary_key=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    def __repr__(self) -> str:
        return f"<AgentWorkflow(agent_id='{self.agent_id}', workflow_id='{self.workflow_id}')>"

    def to_dict(self) -> dict:
        return {
            "agent_id": self.agent_id,
            "workflow_id": self.workflow_id,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
