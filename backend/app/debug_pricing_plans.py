import asyncio
import sys
from pathlib import Path
from sqlalchemy import select

# Add the project root to the Python path
project_root = Path(__file__).parent.parent.parent
sys.path.append(str(project_root))

from backend.app.database import AsyncSessionLocal  # noqa: E402
from backend.app.models.pricing_plan import PricingPlan  # noqa: E402


async def list_pricing_plans():
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(PricingPlan))
        plans = result.scalars().all()
        print(f"Found {len(plans)} pricing plans in DB:")
        for plan in plans:
            print(f"ID: {plan.id}")
            print(f"Name: {plan.name}")
            print(f"Stripe Price ID: {plan.stripe_price_id}")
            print(f"Credits: {plan.credits}")
            print("-" * 20)

    print("\nListing ALL Stripe Products and Prices:")
    import stripe
    from backend.app.config import settings

    stripe.api_key = settings.stripe_secret_key

    try:
        products = stripe.Product.list(limit=100, active=True)
        print(f"Found {len(products.data)} active products in Stripe:")
        for product in products.data:
            print(f"Product: {product.name} (ID: {product.id})")
            prices = stripe.Price.list(product=product.id, limit=100)
            for price in prices.data:
                print(
                    f"  - Price: {price.unit_amount} {price.currency} (ID: {price.id}, Type: {price.type}, Active: {price.active})"
                )
            print("-" * 10)
    except Exception as e:
        print(f"Error listing Stripe products: {e}")


if __name__ == "__main__":
    asyncio.run(list_pricing_plans())
