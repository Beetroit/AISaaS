from __future__ import annotations

from typing import Any, Dict

from sqlalchemy import JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column
from ulid import ULID

from backend.app.database import Base


class NodeType(Base):
    __tablename__ = "node_types"

    id: Mapped[str] = mapped_column(
        String(50),
        primary_key=True,
        index=True,
        unique=True,
        default=lambda: f"nod_{ULID()}",
    )
    type: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    inputs: Mapped[dict] = mapped_column(JSON, default={})
    outputs: Mapped[dict] = mapped_column(JSON, default={})

    def __repr__(self) -> str:
        return f"<NodeType(id='{self.id}', type='{self.type}', name='{self.name}')>"

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "type": self.type,
            "name": self.name,
            "description": self.description,
            "inputs": self.inputs or {},
            "outputs": self.outputs or {},
        }
