"""Admin API Router

This router handles all admin-only endpoints for dashboard, user management,
revenue analytics, workflow stats, and system logs.
"""

from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, or_, select

from backend.app.constants.admin_commands import ADMIN_COMMANDS  # Added
from backend.app.crud.pricing_plan_crud import PricingPlanCRUD
from backend.app.crud.user_crud import UserCRUD
from backend.app.dependencies import AdminUser, DBSession
from backend.app.models.lead import Lead  # Added
from backend.app.models.user import User
from backend.app.models.workflow import Workflow  # Added
from backend.app.schemas.admin import (
    AdminLogResponse,
    DashboardMetricsResponse,
    PricingPlanUpdate,
    UserAdjustCreditsRequest,
    UserDetailResponse,
    UserListResponse,
    UserSuspendRequest,
)
from backend.app.schemas.user import UserAdminUpdate
from backend.app.services.admin_logger import AdminLogger
from backend.app.services.admin_service import AdminService

router = APIRouter(prefix="/admin", tags=["admin"])


# ========== Dependencies ==========


async def get_admin_service() -> AdminService:
    return AdminService()


async def get_admin_logger() -> AdminLogger:
    return AdminLogger()


async def get_user_crud(db: DBSession) -> UserCRUD:
    return UserCRUD(db)


async def get_pricing_plan_crud(db: DBSession) -> PricingPlanCRUD:
    return PricingPlanCRUD()


AdminServiceDep = Annotated[AdminService, Depends(get_admin_service)]
AdminLoggerDep = Annotated[AdminLogger, Depends(get_admin_logger)]
UserCRUDDep = Annotated[UserCRUD, Depends(get_user_crud)]
PricingCRUDDep = Annotated[PricingPlanCRUD, Depends(get_pricing_plan_crud)]


# ========== Section 1: Dashboard Overview ==========


@router.get("/dashboard", response_model=DashboardMetricsResponse)
async def get_dashboard_metrics(
    admin: AdminUser, db: DBSession, admin_service: AdminServiceDep
):
    """Get aggregated dashboard metrics"""
    metrics = await admin_service.get_dashboard_metrics(db)
    return metrics


# ========== Section 2: User Management ==========


@router.get("/users", response_model=UserListResponse)
async def list_users(
    admin: AdminUser,
    db: DBSession,
    search: str | None = Query(None, description="Search by email or user ID"),
    status_filter: str | None = Query(
        None, alias="status", description="Filter by status: active, suspended, deleted"
    ),
    plan_filter: str | None = Query(
        None, alias="plan", description="Filter by plan type"
    ),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
):
    """List all users with filtering and pagination"""
    query = select(User)

    # Search filter
    if search:
        query = query.where(
            or_(User.email.ilike(f"%{search}%"), User.id.ilike(f"%{search}%"))
        )

    # Status filter
    if status_filter == "active":
        query = query.where(User.is_active == True)  # noqa: E712
    elif status_filter == "suspended":
        query = query.where(User.is_active == False)  # noqa: E712

    # Count total before pagination
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar_one()

    # Apply pagination
    query = query.offset(skip).limit(limit)

    result = await db.execute(query)
    users = result.scalars().all()

    return {"users": [user.to_dict() for user in users], "total": total}


@router.get("/users/{user_id}", response_model=UserDetailResponse)
async def get_user_detail(
    user_id: str,
    admin: AdminUser,
    db: DBSession,
    user_crud: UserCRUDDep,
    admin_service: AdminServiceDep,
):
    """Get detailed information about a specific user"""
    user = await user_crud.get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    stats = await admin_service.get_user_stats(db, user_id)

    return {"user": user.to_dict(), "stats": stats}


@router.post("/users/{user_id}/suspend")
async def suspend_user(
    user_id: str,
    request: UserSuspendRequest,
    admin: AdminUser,
    db: DBSession,
    user_crud: UserCRUDDep,
    admin_logger: AdminLoggerDep,
):
    """Suspend a user account"""
    user = await user_crud.get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.is_active = False
    await db.commit()

    # Log the action
    await admin_logger.log_action(
        db=db,
        admin_id=admin.id,
        action_type="suspend_user",
        target_resource=f"user:{user_id}",
        details={"reason": request.reason},
    )

    return {"message": "User suspended successfully", "user_id": user_id}


@router.post("/users/{user_id}/unsuspend")
async def unsuspend_user(
    user_id: str,
    admin: AdminUser,
    db: DBSession,
    user_crud: UserCRUDDep,
    admin_logger: AdminLoggerDep,
):
    """Unsuspend a user account"""
    user = await user_crud.get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.is_active = True
    await db.commit()

    # Log the action
    await admin_logger.log_action(
        db=db,
        admin_id=admin.id,
        action_type="unsuspend_user",
        target_resource=f"user:{user_id}",
        details={},
    )

    return {"message": "User unsuspended successfully", "user_id": user_id}


@router.delete("/users/{user_id}")
async def delete_user(
    user_id: str,
    admin: AdminUser,
    db: DBSession,
    user_crud: UserCRUDDep,
    admin_logger: AdminLoggerDep,
):
    """Delete a user account (soft delete)"""
    user = await user_crud.get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Soft delete by deactivating
    user.is_active = False
    await db.commit()

    # Log the action
    await admin_logger.log_action(
        db=db,
        admin_id=admin.id,
        action_type="delete_user",
        target_resource=f"user:{user_id}",
        details={},
    )

    return {"message": "User deleted successfully", "user_id": user_id}


@router.post("/users/{user_id}/credits")
async def adjust_user_credits(
    user_id: str,
    request: UserAdjustCreditsRequest,
    admin: AdminUser,
    db: DBSession,
    user_crud: UserCRUDDep,
    admin_logger: AdminLoggerDep,
):
    """Manually adjust user credits"""
    user = await user_crud.get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    old_credits = user.message_credits
    user.message_credits += request.amount

    # Ensure credits don't go negative
    if user.message_credits < 0:
        user.message_credits = 0

    await db.commit()

    # Log the action
    await admin_logger.log_action(
        db=db,
        admin_id=admin.id,
        action_type="adjust_credits",
        target_resource=f"user:{user_id}",
        details={
            "amount": request.amount,
            "reason": request.reason,
            "old_credits": old_credits,
            "new_credits": user.message_credits,
        },
    )

    return {
        "message": "Credits adjusted successfully",
        "user_id": user_id,
        "old_credits": old_credits,
        "new_credits": user.message_credits,
    }

    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"user_id": user_id, "message_credits": user.message_credits}


@router.get("/workflows/counts")
async def get_workflow_counts(admin: AdminUser, db: DBSession):
    """Get counts of workflows by status."""
    total_workflows = await db.scalar(select(func.count(Workflow.id)))
    active_workflows = await db.scalar(select(func.count(Workflow.id)))

    return {
        "total_workflows": total_workflows,
        "active_workflows": active_workflows,
        # Add more status counts as needed
    }


@router.get("/leads/counts")
async def get_lead_counts(admin: AdminUser, db: DBSession):
    """Get counts of leads by qualification status."""
    total_leads = await db.scalar(select(func.count(Lead.id)))
    new_leads = await db.scalar(
        select(func.count(Lead.id)).where(Lead.qualification_status == "new")
    )
    qualified_leads = await db.scalar(
        select(func.count(Lead.id)).where(Lead.qualification_status == "qualified")
    )

    return {
        "total_leads": total_leads,
        "new_leads": new_leads,
        "qualified_leads": qualified_leads,
        # Add more status counts as needed
    }


@router.get("/available-admin-commands")
async def get_available_admin_commands(admin: AdminUser):
    """Get a list of all available admin commands with their descriptions."""
    # Ensure only super admins can fetch the list of *all* possible commands
    if not admin.is_super_admin:
        raise HTTPException(
            status_code=403,
            detail="Only super admins can access the list of available commands.",
        )
    return ADMIN_COMMANDS


# ========== Section 3: Revenue Management ==========


@router.get("/revenue/analytics")
async def get_revenue_analytics(
    admin: AdminUser, db: DBSession, admin_service: AdminServiceDep
):
    """Get aggregated revenue analytics"""
    analytics = await admin_service.get_revenue_analytics(db)
    return analytics


@router.get("/pricing-plans")
async def list_pricing_plans(
    admin: AdminUser, db: DBSession, pricing_crud: PricingCRUDDep
):
    """List all pricing plans"""
    plans = await pricing_crud.get_all_pricing_plans(db)
    return {"plans": plans}


@router.put("/pricing-plans/{plan_id}")
async def update_pricing_plan(
    plan_id: str,
    plan_update: PricingPlanUpdate,
    admin: AdminUser,
    db: DBSession,
    pricing_crud: PricingCRUDDep,
    admin_logger: AdminLoggerDep,
):
    """Update a pricing plan"""
    plan = await pricing_crud.get_pricing_plan_by_id(db, plan_id)
    if not plan:
        raise HTTPException(status_code=404, detail="Pricing plan not found")

    # Update fields
    if plan_update.name is not None:
        plan.name = plan_update.name
    if plan_update.description is not None:
        plan.description = plan_update.description
    if plan_update.credits is not None:
        plan.credits = plan_update.credits
    if plan_update.price is not None:
        plan.price = plan_update.price
    if plan_update.features is not None:
        plan.features = plan_update.features
    if plan_update.is_active is not None:
        plan.is_active = plan_update.is_active

    await db.commit()

    # Log the action
    await admin_logger.log_action(
        db=db,
        admin_id=admin.id,
        action_type="update_pricing_plan",
        target_resource=f"plan:{plan_id}",
        details=plan_update.model_dump(exclude_none=True),
    )

    return {"message": "Pricing plan updated successfully", "plan": plan.to_dict()}


# ========== Section 4: Workflow Analytics ==========


@router.get("/workflows/stats")
async def get_workflow_stats(
    admin: AdminUser, db: DBSession, admin_service: AdminServiceDep
):
    """Get workflow system statistics"""
    stats = await admin_service.get_workflow_stats(db)
    return stats


# ========== Section 5: System Logs ==========


@router.get("/logs", response_model=list[AdminLogResponse])
async def get_admin_logs(
    admin: AdminUser,
    db: DBSession,
    admin_logger: AdminLoggerDep,
    action_type: str | None = Query(None, description="Filter by action type"),
    start_date: datetime | None = Query(None, description="Filter from this date"),
    end_date: datetime | None = Query(None, description="Filter until this date"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
):
    """Get admin activity logs"""
    logs = await admin_logger.get_logs(
        db=db,
        action_type=action_type,
        start_date=start_date,
        end_date=end_date,
        skip=skip,
        limit=limit,
    )
    return [log.to_dict() for log in logs]


# ========== Utility Endpoint ==========


@router.get("/")
async def admin_root(admin: AdminUser):
    """Admin API root endpoint - verifies admin access"""
    return {
        "message": "Admin API - Access granted",
        "admin_id": admin.id,
        "admin_email": admin.email,
    }


@router.post("/users/{user_id}/promote")
async def promote_user(
    user_id: str,
    admin: AdminUser,
    db: DBSession,
    user_crud: UserCRUDDep,
    admin_logger: AdminLoggerDep,
):
    """Promote a user to Admin"""
    user = await user_crud.get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.is_admin:
        return {"message": "User is already an admin", "user_id": user_id}

    user.is_admin = True
    await db.commit()

    # Log the action
    await admin_logger.log_action(
        db=db,
        admin_id=admin.id,
        action_type="promote_user",
        target_resource=f"user:{user_id}",
        details={},
    )

    return {"message": "User promoted to Admin successfully", "user_id": user_id}


@router.post("/users/{user_id}/demote")
async def demote_user(
    user_id: str,
    admin: AdminUser,
    db: DBSession,
    user_crud: UserCRUDDep,
    admin_logger: AdminLoggerDep,
):
    """Demote an Admin to regular user"""
    user = await user_crud.get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if not user.is_admin:
        return {"message": "User is not an admin", "user_id": user_id}

    # Prevent demoting Super Admin
    if user.is_super_admin:
        raise HTTPException(
            status_code=403,
            detail="Cannot demote the Super Admin. This user has permanent admin privileges.",
        )

    user.is_admin = False
    await db.commit()

    # Log the action
    await admin_logger.log_action(
        db=db,
        admin_id=admin.id,
        action_type="demote_user",
        target_resource=f"user:{user_id}",
        details={},
    )

    return {"message": "User demoted from Admin successfully", "user_id": user_id}


@router.patch("/users/{user_id}/admin-settings")
async def update_user_admin_settings(
    user_id: str,
    admin_settings_update: UserAdminUpdate,
    admin: AdminUser,
    db: DBSession,
    user_crud: UserCRUDDep,
    admin_logger: AdminLoggerDep,
):
    """Update admin-specific settings for a user (e.g., whitelisted phone numbers, allowed endpoints)"""
    user = await user_crud.get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    update_data = admin_settings_update.model_dump(exclude_unset=True)

    # Prevent a super admin from changing their own super admin status via this endpoint
    if user.id == admin.id and "is_super_admin" in update_data:
        raise HTTPException(
            status_code=403,
            detail="Super admin cannot change their own super admin status via this endpoint.",
        )

    # Apply updates
    for field, value in update_data.items():
        setattr(user, field, value)

    await db.commit()

    await admin_logger.log_action(
        db=db,
        admin_id=admin.id,
        action_type="update_user_admin_settings",
        target_resource=f"user:{user_id}",
        details=update_data,
    )

    return {
        "message": "User admin settings updated successfully",
        "user": user.to_dict(),
    }


@router.get("/users/{user_id}/balance")
async def get_user_balance(
    user_id: str,
    admin: AdminUser,
    db: DBSession,
    user_crud: UserCRUDDep,
):
    """Get the message credit balance for a specific user."""
    user = await user_crud.get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"user_id": user_id, "message_credits": user.message_credits}
