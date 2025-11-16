from fastapi import APIRouter, Depends

from backend.app.crud.pricing_plan_crud import PricingPlanCRUD
from backend.app.dependencies import DBSession, get_pricing_plan_crud

router = APIRouter(prefix="/pricing", tags=["pricing"])


@router.get("/plans")
async def get_pricing_plans_endpoint(
    db_session: DBSession,
    pricing_plan_crud: PricingPlanCRUD = Depends(get_pricing_plan_crud),
):
    """Get available pricing plans for the landing page - No authentication required."""
    async with db_session as session:
        plans = await pricing_plan_crud.get_all_pricing_plans(session)
        return plans
