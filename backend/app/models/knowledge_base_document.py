from __future__ import annotations

from typing import TYPE_CHECKING, Any, Dict

from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from ulid import ULID

from backend.app.database import Base

# Import related models for type hinting
if TYPE_CHECKING:
    from backend.app.models.agent import Agent
    from backend.app.models.user import User


class KnowledgeBaseDocument(Base):
    __tablename__ = "knowledge_base_documents"
    __table_prefix__ = "kbdoc_"

    id: Mapped[str] = mapped_column(
        String(50),
        primary_key=True,
        index=True,
        unique=True,
        default=lambda: f"{KnowledgeBaseDocument.__table_prefix__}{ULID()}",
    )
    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    content_hash: Mapped[str] = mapped_column(
        String(64), unique=True, nullable=False
    )  # SHA256 hash of the document content
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"))
    agent_id: Mapped[str | None] = mapped_column(ForeignKey("agents.id"), nullable=True)

    owner: Mapped[User] = relationship(
        "User", back_populates="knowledge_base_documents"
    )
    agent: Mapped[Agent] = relationship(
        "Agent", back_populates="knowledge_base_documents"
    )

    def __repr__(self) -> str:
        return f"<KnowledgeBaseDocument(id='{self.id}', filename='{self.filename}', user_id='{self.user_id}')>"

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "filename": self.filename,
            "content_hash": self.content_hash,
            "user_id": self.user_id,
            "agent_id": self.agent_id,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
