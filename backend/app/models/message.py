from typing import TYPE_CHECKING, Any, Dict

from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from ulid import ULID

from backend.app.database import Base

if TYPE_CHECKING:
    from backend.app.models.chat_session import ChatSession


class Message(Base):
    __tablename__ = "messages"
    __table_prefix__ = "msg_"

    id: Mapped[str] = mapped_column(
        String(50),
        primary_key=True,
        index=True,
        unique=True,
        default=lambda: f"{Message.__table_prefix__}{ULID()}",
    )
    chat_session_id: Mapped[str] = mapped_column(ForeignKey("chat_sessions.id"))
    role: Mapped[str] = mapped_column(String(50))  # e.g., "user", "agent"
    content: Mapped[str] = mapped_column(Text)
    chat_session: Mapped["ChatSession"] = relationship(
        "ChatSession", back_populates="messages"
    )

    def __repr__(self) -> str:
        return (
            f"<Message(id='{self.id}', chat_session_id='{self.chat_session_id}', "
            f"role='{self.role}', created_at='{self.created_at}')>"
        )

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "chat_session_id": self.chat_session_id,
            "role": self.role,
            "content": self.content,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }
