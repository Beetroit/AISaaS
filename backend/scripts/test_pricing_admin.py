import asyncio
import sys
import os
from unittest.mock import MagicMock, patch

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), "../.."))

from backend.app.schemas.pricing_plan import PricingPlanCreate, PricingPlanUpdate
from backend.app.routers.pricing import (
    create_pricing_plan,
    update_pricing_plan,
)
from backend.app.models.user import User


async def test_pricing_admin():
    print("Starting Pricing Admin Verification...")

    # Mock Dependencies
    mock_db_session = MagicMock()
    mock_session = MagicMock()
    mock_db_session.__aenter__.return_value = mock_session

    mock_stripe_service = MagicMock()
    mock_pricing_plan_crud = MagicMock()

    mock_admin_user = User(id="admin_id", email="admin@example.com", is_admin=True)

    # Test Create Plan
    print("\nTesting Create Plan...")
    plan_data = PricingPlanCreate(
        name="Test Plan",
        description="Test Description",
        credits=100,
        price=10.0,
        features=["Feature 1"],
        popular=False,
    )

    # Mock Stripe responses
    mock_stripe_product = MagicMock()
    mock_stripe_product.id = "prod_test"
    mock_stripe_service.create_product.return_value = mock_stripe_product

    mock_stripe_price = MagicMock()
    mock_stripe_price.id = "price_test"
    mock_stripe_service.create_price.return_value = mock_stripe_price

    # Mock DB response
    mock_db_plan = MagicMock()
    mock_db_plan.id = "plan_test"
    mock_db_plan.name = "Test Plan"
    mock_db_plan.price = "10.0"
    mock_db_plan.stripe_price_id = "price_test"
    mock_db_plan.is_active = True
    mock_pricing_plan_crud.create_pricing_plan.return_value = mock_db_plan

    result = await create_pricing_plan(
        plan_data,
        mock_admin_user,
        mock_stripe_service,
        mock_db_session,
        mock_pricing_plan_crud,
    )

    print(f"Create Result: {result.name} (ID: {result.id})")
    assert result.name == "Test Plan"
    assert result.stripe_price_id == "price_test"
    mock_stripe_service.create_product.assert_called_once()
    mock_stripe_service.create_price.assert_called_once()

    # Test Update Plan (Price Change)
    print("\nTesting Update Plan (Price Change)...")
    plan_update = PricingPlanUpdate(price=20.0)

    # Mock existing plan
    mock_existing_plan = MagicMock()
    mock_existing_plan.id = "plan_test"
    mock_existing_plan.stripe_price_id = "price_test"
    mock_pricing_plan_crud.get_pricing_plan_by_id.return_value = mock_existing_plan

    # Mock Stripe retrieve
    mock_stripe_price_obj = MagicMock()
    mock_stripe_price_obj.product = "prod_test"
    mock_stripe_price_obj.unit_amount = 1000  # 10.00

    with patch("stripe.Price.retrieve", return_value=mock_stripe_price_obj):
        # Mock new price creation
        mock_new_stripe_price = MagicMock()
        mock_new_stripe_price.id = "price_new"
        mock_stripe_service.create_price.return_value = mock_new_stripe_price

        # Mock DB update
        mock_updated_plan = MagicMock()
        mock_updated_plan.id = "plan_test"
        mock_updated_plan.price = "20.0"
        mock_updated_plan.stripe_price_id = "price_new"
        mock_pricing_plan_crud.update_pricing_plan.return_value = mock_updated_plan

        result = await update_pricing_plan(
            "plan_test",
            plan_update,
            mock_admin_user,
            mock_stripe_service,
            mock_db_session,
            mock_pricing_plan_crud,
        )

        print(
            f"Update Result: Price {result.price}, Stripe ID {result.stripe_price_id}"
        )
        assert result.stripe_price_id == "price_new"
        mock_stripe_service.archive_price.assert_called_with("price_test")
        mock_stripe_service.create_price.assert_called()

    print("\nVerification Successful!")


if __name__ == "__main__":
    asyncio.run(test_pricing_admin())
