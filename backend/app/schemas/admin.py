"""Admin Schemas

Pydantic models for admin API request/response validation.
"""

from typing import Any

from pydantic import BaseModel, Field


# ========== Dashboard (Section 1) ==========


class DashboardMetricsResponse(BaseModel):
    users: dict[str, int]
    revenue: dict[str, float]
    usage: dict[str, int]
    health: dict[str, int]


# ========== User Management (Section 2) ==========


class UserListResponse(BaseModel):
    users: list[dict[str, Any]]
    total: int


class UserDetailResponse(BaseModel):
    user: dict[str, Any]
    stats: dict[str, Any]


class UserSuspendRequest(BaseModel):
    reason: str = Field(..., description="Reason for suspension")


class UserAdjustCreditsRequest(BaseModel):
    amount: int = Field(
        ..., description="Amount to add/remove (use negative for removal)"
    )
    reason: str = Field(..., description="Reason for credit adjustment")


# ========== Revenue Management (Section 3) ==========


class PricingPlanUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    credits: int | None = None
    price: str | None = None
    features: list[str] | None = None
    is_active: bool | None = None


# ========== System Logs (Section 5) ==========


class AdminLogResponse(BaseModel):
    id: str
    admin_id: str
    action_type: str
    target_resource: str
    details: dict[str, Any]
    timestamp: str
