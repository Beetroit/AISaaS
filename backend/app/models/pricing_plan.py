from __future__ import annotations

from typing import Any, Dict

from sqlalchemy import JSON, Boolean, String, Text
from sqlalchemy.orm import Mapped, mapped_column
from ulid import ULID

from backend.app.database import Base


class PricingPlan(Base):
    __tablename__ = "pricing_plans"

    id: Mapped[str] = mapped_column(
        String(50),
        primary_key=True,
        index=True,
        unique=True,
        default=lambda: f"prc_{ULID()}",
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    credits: Mapped[int] = mapped_column(default=0, nullable=False)
    price: Mapped[str] = mapped_column(String(20), nullable=False)
    features: Mapped[list[str]] = mapped_column(JSON, default=[])
    popular: Mapped[bool] = mapped_column(Boolean, default=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    def __repr__(self) -> str:
        return (
            f"<PricingPlan(id='{self.id}', name='{self.name}', price='{self.price}')>"
        )

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "credits": self.credits,
            "price": self.price,
            "features": self.features or [],
            "popular": self.popular,
            "is_active": self.is_active,
        }
