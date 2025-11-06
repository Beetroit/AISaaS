from typing import Any, Dict

from sqlalchemy import ForeignKey, LargeBinary, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from ulid import ULID

from backend.app.database import Base
from backend.app.models.user import User  # Import User model for relationship


class Credential(Base):
    __tablename__ = "credentials"
    __table_prefix__ = "crd_"

    id: Mapped[str] = mapped_column(
        String(50),
        primary_key=True,
        index=True,
        unique=True,
        default=lambda: f"{Credential.__table_prefix__}{ULID()}",
    )
    user_id: Mapped[str] = mapped_column(String(50), ForeignKey("users.id"), index=True)
    credential_type: Mapped[str] = mapped_column(String(100), index=True)
    credentials_data: Mapped[bytes] = mapped_column(LargeBinary, nullable=False)

    user: Mapped["User"] = relationship("User", back_populates="credentials")

    def __repr__(self) -> str:
        return f"<Credential(id={self.id}, user_id={self.user_id}, type={self.credential_type})>"

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "user_id": self.user_id,
            "credential_type": self.credential_type,
            "credentials_data": self.credentials_data,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
