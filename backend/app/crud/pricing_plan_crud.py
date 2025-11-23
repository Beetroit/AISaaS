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
                "stripe_price_id": plan.stripe_price_id,
                "name": plan.name,
                "description": plan.description,
                "credits": plan.credits,
                "price": plan.price,
                "features": plan.features or [],
                "popular": plan.popular,
                "is_active": plan.is_active,
            }
            for plan in pricing_plans
        ]

    @staticmethod
    async def get_pricing_plan_by_id(db: AsyncSession, plan_id: str):
        """Get a specific pricing plan by ID."""
        result = await db.execute(select(PricingPlan).where(PricingPlan.id == plan_id))
        return result.scalar_one_or_none()

    @staticmethod
    async def get_pricing_plan_by_stripe_price_id(
        db: AsyncSession, stripe_price_id: str
    ):
        """Get a specific pricing plan by Stripe Price ID."""
        result = await db.execute(
            select(PricingPlan).where(PricingPlan.stripe_price_id == stripe_price_id)
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def create_pricing_plan(db: AsyncSession, plan_data: dict):
        """Create a new pricing plan."""
        db_plan = PricingPlan(**plan_data)
        db.add(db_plan)
        await db.flush()

        return db_plan

    @staticmethod
    async def update_pricing_plan(db: AsyncSession, plan_id: str, plan_data: dict):
        """Update an existing pricing plan."""
        db_plan = await PricingPlanCRUD.get_pricing_plan_by_id(db, plan_id)
        if not db_plan:
            return None

        for key, value in plan_data.items():
            setattr(db_plan, key, value)

        await db.flush()
        return db_plan

    @staticmethod
    async def deactivate_pricing_plan(db: AsyncSession, plan_id: str):
        """Deactivate a pricing plan (soft delete)."""
        db_plan = await PricingPlanCRUD.get_pricing_plan_by_id(db, plan_id)
        if not db_plan:
            return None

        db_plan.is_active = False
        await db.flush()
        return db_plan
