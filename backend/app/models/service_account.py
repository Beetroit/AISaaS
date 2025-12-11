from typing import Any, Dict

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column
from ulid import ULID

from backend.app.database import Base


class ServiceAccount(Base):
    __tablename__ = "service_accounts"
    __table_prefix__ = "svc_"

    id: Mapped[str] = mapped_column(
        String(50),
        primary_key=True,
        index=True,
        unique=True,
        default=lambda: f"{ServiceAccount.__table_prefix__}{ULID()}",
    )
    name: Mapped[str] = mapped_column(
        String(255), unique=True, index=True, nullable=False
    )
    api_key: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    # Potentially add scopes or permissions here if needed for finer-grained control

    def __repr__(self) -> str:
        return f"<ServiceAccount(id='{self.id}', name='{self.name}')>"

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "name": self.name,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
