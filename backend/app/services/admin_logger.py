"""Admin Activity Logger

Logs all admin actions for audit trail purposes.
"""

from datetime import datetime, timezone
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.models.admin_log import AdminActivityLog


class AdminLogger:
    """Service for logging admin actions"""

    async def log_action(
        self,
        db: AsyncSession,
        admin_id: str,
        action_type: str,
        target_resource: str,
        details: dict[str, Any] | None = None,
    ) -> AdminActivityLog:
        """Log an admin action

        Args:
            db: Database session
            admin_id: ID of the admin user performing the action
            action_type: Type of action (suspend_user, delete_user, adjust_credits, etc.)
            target_resource: Resource being acted upon (e.g., "user:usr_123")
            details: Additional details about the action

        Returns:
            The created log entry
        """
        log_entry = AdminActivityLog(
            admin_id=admin_id,
            action_type=action_type,
            target_resource=target_resource,
            details=details or {},
            timestamp=datetime.now(timezone.utc),
        )
        db.add(log_entry)
        await db.commit()
        await db.refresh(log_entry)
        return log_entry

    async def get_logs(
        self,
        db: AsyncSession,
        action_type: str | None = None,
        start_date: datetime | None = None,
        end_date: datetime | None = None,
        skip: int = 0,
        limit: int = 100,
    ) -> list[AdminActivityLog]:
        """Query admin activity logs with filters"""
        from sqlalchemy import select

        query = select(AdminActivityLog)

        if action_type:
            query = query.where(AdminActivityLog.action_type == action_type)
        if start_date:
            query = query.where(AdminActivityLog.timestamp >= start_date)
        if end_date:
            query = query.where(AdminActivityLog.timestamp <= end_date)

        query = query.order_by(AdminActivityLog.timestamp.desc())
        query = query.offset(skip).limit(limit)

        result = await db.execute(query)
        return list(result.scalars().all())
