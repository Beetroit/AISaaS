from sqlalchemy import select, true
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.models.pricing_plan import PricingPlan


class PricingPlanCRUD:
    @staticmethod
    async def get_all_pricing_plans(db: AsyncSession):
        """Get all active pricing plans from database."""
        result = await db.execute(
            select(PricingPlan).where(PricingPlan.is_active == true())
        )
        pricing_plans = result.scalars().all()
        return [
            {
                "id": str(plan.id),
                "name": plan.name,
                "description": plan.description,
                "credits": plan.credits,
                "price": plan.price,
                "features": plan.features or [],
                "popular": plan.popular,
            }
            for plan in pricing_plans
        ]

    @staticmethod
    async def get_pricing_plan_by_id(db: AsyncSession, plan_id: str):
        """Get a specific pricing plan by ID."""
        result = await db.execute(select(PricingPlan).where(PricingPlan.id == plan_id))
        return result.scalar_one_or_none()

    @staticmethod
    async def create_pricing_plan(db: AsyncSession, plan_data: dict):
        """Create a new pricing plan."""
        db_plan = PricingPlan(**plan_data)
        db.add(db_plan)
        await db.flush()

        return db_plan
