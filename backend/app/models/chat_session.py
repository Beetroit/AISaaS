from datetime import datetime, timezone
from typing import TYPE_CHECKING, Any, Dict, List

from sqlalchemy import DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from ulid import ULID

from backend.app.database import Base

# Import related models for type hinting
if TYPE_CHECKING:
    from backend.app.models.agent import Agent
    from backend.app.models.lead import Lead
    from backend.app.models.message import Message
    from backend.app.models.user import User


class ChatSession(Base):
    __tablename__ = "chat_sessions"
    __table_prefix__ = "chat_"

    id: Mapped[str] = mapped_column(
        String(50),
        primary_key=True,
        index=True,
        unique=True,
        default=lambda: f"{ChatSession.__table_prefix__}{ULID()}",
    )
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"))
    agent_id: Mapped[str] = mapped_column(ForeignKey("agents.id"))
    external_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    start_time: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    end_time: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    status: Mapped[str] = mapped_column(String(50), default="active")
    current_workflow_step: Mapped[str | None] = mapped_column(
        String(255), nullable=True
    )

    user: Mapped["User"] = relationship("User", back_populates="chat_sessions")
    agent: Mapped["Agent"] = relationship("Agent", back_populates="chat_sessions")
    leads: Mapped[list["Lead"]] = relationship("Lead", back_populates="chat_session")
    messages: Mapped[List["Message"]] = relationship(
        "Message", back_populates="chat_session", order_by="Message.created_at"
    )

    def __repr__(self) -> str:
        return f"<ChatSession(id='{self.id}', user_id='{self.user_id}', agent_id='{self.agent_id}')>"

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "user_id": self.user_id,
            "agent_id": self.agent_id,
            "start_time": self.start_time.isoformat() if self.start_time else None,
            "end_time": self.end_time.isoformat() if self.end_time else None,
            "status": self.status,
            "messages": [message.to_dict() for message in self.messages],
        }
