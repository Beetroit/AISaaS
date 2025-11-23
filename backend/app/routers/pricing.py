from fastapi import APIRouter, Depends, HTTPException, status

from backend.app.crud.pricing_plan_crud import PricingPlanCRUD
from backend.app.dependencies import (
    AdminUser,
    DBSession,
    StripeServiceDep,
    get_pricing_plan_crud,
)
from backend.app.schemas.pricing_plan import (
    PricingPlanCreate,
    PricingPlanResponse,
    PricingPlanUpdate,
)
import stripe

router = APIRouter(prefix="/pricing", tags=["pricing"])


@router.get("/plans", response_model=list[PricingPlanResponse])
async def get_pricing_plans_endpoint(
    db_session: DBSession,
    pricing_plan_crud: PricingPlanCRUD = Depends(get_pricing_plan_crud),
):
    """Get available pricing plans for the landing page - No authentication required."""
    plans = await pricing_plan_crud.get_all_pricing_plans(db_session)
    return [PricingPlanResponse(**plan) for plan in plans]


@router.post("/admin/plans", response_model=PricingPlanResponse)
async def create_pricing_plan(
    plan_data: PricingPlanCreate,
    admin_user: AdminUser,
    stripe_service: StripeServiceDep,
    db_session: DBSession,
    pricing_plan_crud: PricingPlanCRUD = Depends(get_pricing_plan_crud),
):
    """Create a new pricing plan and sync with Stripe."""
    # 1. Create Stripe Product
    try:
        stripe_product = stripe_service.create_product(
            name=plan_data.name, description=plan_data.description
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to create Stripe product: {str(e)}",
        )

    # 2. Create Stripe Price
    try:
        amount_cents = int(plan_data.price * 100)
        stripe_price = stripe_service.create_price(
            product_id=stripe_product.id, amount_cents=amount_cents
        )
    except Exception as e:
        # TODO: Rollback product creation?
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to create Stripe price: {str(e)}",
        )

    # 3. Create DB Pricing Plan
    try:
        db_plan_data = plan_data.model_dump()
        db_plan_data["stripe_price_id"] = stripe_price.id
        db_plan_data["price"] = str(plan_data.price)  # Store as string

        new_plan = await pricing_plan_crud.create_pricing_plan(db_session, db_plan_data)
        return PricingPlanResponse.model_validate(new_plan)
    except Exception as e:
        # Rollback: Archive Stripe Price and Product
        try:
            stripe_service.archive_price(stripe_price.id)
            stripe_service.archive_product(stripe_product.id)
        except Exception as rollback_error:
            # Log rollback failure but raise original error
            # In a real system, we might want to alert on this specific failure
            print(f"Rollback failed: {rollback_error}")

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create pricing plan in database: {str(e)}",
        )


@router.put("/admin/plans/{plan_id}", response_model=PricingPlanResponse)
async def update_pricing_plan(
    plan_id: str,
    plan_update: PricingPlanUpdate,
    admin_user: AdminUser,
    stripe_service: StripeServiceDep,
    db_session: DBSession,
    pricing_plan_crud: PricingPlanCRUD = Depends(get_pricing_plan_crud),
):
    """Update a pricing plan and sync with Stripe."""
    current_plan = await pricing_plan_crud.get_pricing_plan_by_id(db_session, plan_id)
    if not current_plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Pricing plan not found"
        )

    # Handle Stripe Updates
    if current_plan.stripe_price_id:
        try:
            # Retrieve price to get product ID
            stripe_price = stripe.Price.retrieve(current_plan.stripe_price_id)
            product_id = stripe_price.product

            # Update Product Name/Description if changed
            if plan_update.name or plan_update.description:
                stripe_service.update_product(
                    product_id=product_id,  # type: ignore
                    name=plan_update.name,
                    description=plan_update.description,
                )

            # Handle Price Change
            if plan_update.price is not None:
                new_amount_cents = int(plan_update.price * 100)
                if stripe_price.unit_amount != new_amount_cents:
                    # Archive old price
                    stripe_service.archive_price(current_plan.stripe_price_id)
                    # Create new price
                    new_stripe_price = stripe_service.create_price(
                        product_id=product_id,  # type: ignore
                        amount_cents=new_amount_cents,
                    )
                    # Update DB with new price ID
                    current_plan.stripe_price_id = new_stripe_price.id
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to sync with Stripe: {str(e)}",
            )

    # Update DB
    update_data = plan_update.model_dump(exclude_unset=True)
    if "price" in update_data:
        update_data["price"] = str(
            update_data["price"]
        )  # Convert float to string for DB

    updated_plan = await pricing_plan_crud.update_pricing_plan(
        db_session, plan_id, update_data
    )
    return PricingPlanResponse.model_validate(updated_plan)


@router.delete("/admin/plans/{plan_id}", response_model=PricingPlanResponse)
async def deactivate_pricing_plan(
    plan_id: str,
    admin_user: AdminUser,
    db_session: DBSession,
    pricing_plan_crud: PricingPlanCRUD = Depends(get_pricing_plan_crud),
):
    """Deactivate a pricing plan."""
    plan = await pricing_plan_crud.deactivate_pricing_plan(db_session, plan_id)
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Pricing plan not found"
        )
    return PricingPlanResponse.model_validate(plan)
