"""Admin Service

Handles business logic for admin dashboard including metrics, user management,
revenue analytics, workflow statistics, and system logging.
"""

from datetime import datetime, timedelta, timezone
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.models.user import User
from backend.app.models.workflow_run import WorkflowRun
from backend.app.models.transaction import Transaction


class AdminService:
    """Service for admin dashboard operations"""

    # ========== Dashboard Metrics (Section 1) ==========

    async def get_dashboard_metrics(self, db: AsyncSession) -> dict[str, Any]:
        """Get all dashboard metrics in one call"""

        # User metrics
        total_users = await self._get_total_users(db)
        new_signups_today = await self._get_new_signups(db, days=1)
        new_signups_week = await self._get_new_signups(db, days=7)
        new_signups_month = await self._get_new_signups(db, days=30)
        active_users_7d = await self._get_active_users(db, days=7)
        active_users_30d = await self._get_active_users(db, days=30)

        # Revenue metrics
        total_revenue = await self._get_total_revenue(db)
        revenue_this_month = await self._get_revenue_this_month(db)

        # Usage metrics
        total_workflows = await self._get_total_workflow_runs(db)
        credits_consumed_today = await self._get_credits_consumed(db, days=1)

        # System health
        active_runs = await self._get_active_workflow_runs(db)
        failed_runs_24h = await self._get_failed_runs(db, hours=24)

        return {
            "users": {
                "total": total_users,
                "new_today": new_signups_today,
                "new_week": new_signups_week,
                "new_month": new_signups_month,
                "active_7d": active_users_7d,
                "active_30d": active_users_30d,
            },
            "revenue": {
                "total": total_revenue,
                "month": revenue_this_month,
            },
            "usage": {
                "total_workflows": total_workflows,
                "credits_today": credits_consumed_today,
            },
            "health": {
                "active_runs": active_runs,
                "failed_runs_24h": failed_runs_24h,
            },
        }

    async def _get_total_users(self, db: AsyncSession) -> int:
        """Get total number of users"""
        result = await db.execute(select(func.count(User.id)))
        return result.scalar_one()

    async def _get_new_signups(self, db: AsyncSession, days: int) -> int:
        """Get new signups in last N days"""
        cutoff = datetime.now(timezone.utc) - timedelta(days=days)
        result = await db.execute(
            select(func.count(User.id)).where(User.created_at >= cutoff)
        )
        return result.scalar_one()

    async def _get_active_users(self, db: AsyncSession, days: int) -> int:
        """Get active users in last N days (users who logged in)"""
        # Note: Requires last_login field which doesn't exist yet
        # For now, return active users count
        result = await db.execute(
            select(func.count(User.id)).where(User.is_active == True)  # noqa: E712
        )
        return result.scalar_one()

    async def _get_total_workflow_runs(self, db: AsyncSession) -> int:
        """Get total workflow runs"""
        result = await db.execute(select(func.count(WorkflowRun.id)))
        return result.scalar_one()

    async def _get_credits_consumed(self, db: AsyncSession, days: int) -> int:
        """Get credits consumed in last N days"""
        # TODO: Implement with credit transaction log
        return 0

    async def _get_active_workflow_runs(self, db: AsyncSession) -> int:
        """Get currently active workflow runs"""
        result = await db.execute(
            select(func.count(WorkflowRun.id)).where(
                WorkflowRun.status == "in_progress"
            )
        )
        return result.scalar_one()

    async def _get_failed_runs(self, db: AsyncSession, hours: int) -> int:
        """Get failed workflow runs in last N hours"""
        cutoff = datetime.now(timezone.utc) - timedelta(hours=hours)
        result = await db.execute(
            select(func.count(WorkflowRun.id)).where(
                WorkflowRun.status == "failed", WorkflowRun.created_at >= cutoff
            )
        )
        return result.scalar_one()

    async def _get_total_revenue(self, db: AsyncSession) -> float:
        """Get total revenue"""
        result = await db.execute(
            select(func.sum(Transaction.amount)).where(
                Transaction.status == "completed"
            )
        )
        return result.scalar_one() or 0.0

    async def _get_revenue_this_month(self, db: AsyncSession) -> float:
        """Get revenue for current month"""
        now = datetime.now(timezone.utc)
        start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        result = await db.execute(
            select(func.sum(Transaction.amount)).where(
                Transaction.status == "completed",
                Transaction.created_at >= start_of_month,
            )
        )
        return result.scalar_one() or 0.0

    # ========== User Management (Section 2) ==========

    async def get_user_stats(self, db: AsyncSession, user_id: str) -> dict[str, Any]:
        """Get aggregated statistics for a specific user"""

        # Workflow run count
        workflow_count_result = await db.execute(
            select(func.count(WorkflowRun.id)).where(WorkflowRun.user_id == user_id)
        )
        workflow_count = workflow_count_result.scalar_one()

        # TODO: Add message count, lead count, etc.

        return {
            "workflow_runs": workflow_count,
            "message_count": 0,  # TODO: Implement
            "lead_count": 0,  # TODO: Implement
        }

    # ========== Revenue Analytics (Section 3) ==========

    async def get_revenue_analytics(self, db: AsyncSession) -> dict[str, Any]:
        """Get revenue analytics (aggregated)"""
        # Total revenue
        total_revenue = await self._get_total_revenue(db)

        # Revenue by plan
        # Note: This assumes metadata contains pricing_plan_name
        # In a real app, we might want to join with PricingPlan table
        # But for now, we'll do a simple aggregation if possible or just return 0s
        # Since we are storing plan name in metadata, we can try to query it
        # However, querying JSON fields can be database specific.
        # For simplicity in this iteration, we will fetch all transactions and aggregate in python
        # or just return 0s for breakdown if too complex for now.

        # Let's fetch all completed transactions to aggregate by plan
        result = await db.execute(
            select(Transaction).where(Transaction.status == "completed")
        )
        transactions = result.scalars().all()

        by_plan = {
            "Iniciador": 0.0,
            "Negocio Pro": 0.0,
            "Escala Máxima": 0.0,
        }

        for txn in transactions:
            plan_name = txn.payment_metadata.get("pricing_plan_name")
            if plan_name in by_plan:
                by_plan[plan_name] += txn.amount

        return {
            "total": total_revenue,
            "by_plan": by_plan,
            "trends": [],  # TODO: Implement trends
        }

    # ========== Workflow Analytics (Section 4) ==========

    async def get_workflow_stats(self, db: AsyncSession) -> dict[str, Any]:
        """Get workflow system statistics"""

        # Total executions
        total_result = await db.execute(select(func.count(WorkflowRun.id)))
        total_executions = total_result.scalar_one()

        # Success rate
        completed_result = await db.execute(
            select(func.count(WorkflowRun.id)).where(WorkflowRun.status == "completed")
        )
        completed_count = completed_result.scalar_one()
        success_rate = (
            (completed_count / total_executions * 100) if total_executions > 0 else 0
        )

        # Active runs
        active_result = await db.execute(
            select(func.count(WorkflowRun.id)).where(
                WorkflowRun.status == "in_progress"
            )
        )
        active_runs = active_result.scalar_one()

        return {
            "total_executions": total_executions,
            "success_rate": round(success_rate, 2),
            "active_runs": active_runs,
            "avg_execution_time": 0,  # TODO: Calculate from execution logs
            "error_types": [],  # TODO: Parse from error logs
        }
