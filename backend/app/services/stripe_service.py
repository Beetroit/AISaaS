import stripe
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.config import logger, settings
from backend.app.crud.pricing_plan_crud import PricingPlanCRUD
from backend.app.crud.user_crud import UserCRUD
from backend.app.models.transaction import Transaction


class StripeService:
    def __init__(self, user_crud: UserCRUD, pricing_plan_crud: PricingPlanCRUD):
        self.user_crud = user_crud
        self.pricing_plan_crud = pricing_plan_crud
        stripe.api_key = settings.stripe_secret_key

    async def handle_checkout_session_completed(
        self, session: stripe.checkout.Session, db: AsyncSession
    ):
        """Handle checkout session completed event."""
        logger.info(f"Checkout session {session.id} completed")
        logger.info(f"Checkout session details: {session}")
        customer_id = session.customer
        price_id = None

        # Retrieve line items to find the price_id
        # For one-time purchases, line_items are directly on the session
        # For subscriptions, you might need to fetch the subscription object
        if session.mode == "payment":  # One-time payment for message packages
            line_items = stripe.checkout.Session.list_line_items(session.id, limit=1)
            if line_items and line_items.data:
                price_id = line_items.data[0].price.id
        elif session.mode == "subscription":  # Initial payment for a subscription
            if session.subscription:
                subscription = stripe.Subscription.retrieve(session.subscription)
                if subscription.items and subscription.items.data:
                    price_id = subscription.items.data[0].price.id

        if not price_id:
            logger.error(f"Could not find price_id in checkout session {session.id}")
            return

        user_id = session.get("client_reference_id")
        user = None

        if user_id:
            user = await self.user_crud.get_user_by_id(db, user_id)

        if not user:
            logger.warning(
                f"Could not find user by client_reference_id: {user_id}. Falling back to customer ID."
            )
            customer_id = session.customer
            user = await self.user_crud.get_user_by_stripe_customer_id(customer_id)

        if not user and session.customer_details and session.customer_details.email:
            # Fallback: if user not found by customer_id, try by email
            user = await self.user_crud.get_user_by_email(
                session.customer_details.email
            )
            if user:
                # If found by email, update their stripe_customer_id
                user.stripe_customer_id = str(customer_id)
                await db.flush()
                logger.info(
                    f"User {user.id} found by email, updated stripe_customer_id to {customer_id}"
                )

        if not user:
            logger.error(
                f"User not found for client_reference_id: {user_id}, Stripe customer ID: {customer_id} or email: {session.customer_details.email if session.customer_details else 'N/A'}"
            )
            return

        # Find the pricing plan by Stripe price ID
        pricing_plan = await self.pricing_plan_crud.get_pricing_plan_by_stripe_price_id(
            db, price_id
        )
        if not pricing_plan:
            logger.error(f"Pricing plan not found for Stripe price ID: {price_id}")
            return

        # Update user credits
        if pricing_plan.credits:
            await self.user_crud.update_user_credits(user.id, pricing_plan.credits)
            logger.info(
                f"User {user.id} credits updated by {pricing_plan.credits} after checkout session {session.id}"
            )
        else:
            logger.warning(f"Pricing plan {pricing_plan.id} has no credits to add.")

        # Create transaction record
        transaction = Transaction(
            user_id=user.id,
            amount=session.amount_total / 100.0 if session.amount_total else 0.0,
            currency=session.currency or "usd",
            status="completed",
            stripe_payment_id=session.payment_intent or session.id,
            payment_metadata={
                "pricing_plan_id": pricing_plan.id,
                "pricing_plan_name": pricing_plan.name,
                "credits": pricing_plan.credits,
                "session_id": session.id,
            },
        )
        db.add(transaction)
        await db.flush()
        logger.info(
            f"Transaction recorded for user {user.id}: {transaction.amount} {transaction.currency}"
        )

        # TODO: Handle subscription status updates if session.mode == "subscription"
        # This would involve updating the user's subscription status in the database
        # based on the session.subscription ID.

    def create_product(
        self, name: str, description: str | None = None
    ) -> stripe.Product:
        """Create a new product in Stripe."""
        try:
            return stripe.Product.create(name=name, description=description)
        except stripe.StripeError as e:
            logger.error(f"Error creating Stripe product: {e}")
            raise e

    def create_price(
        self, product_id: str, amount_cents: int, currency: str = "usd"
    ) -> stripe.Price:
        """Create a new price for a product in Stripe."""
        try:
            return stripe.Price.create(
                product=product_id,
                unit_amount=amount_cents,
                currency=currency,
                # Recurring prices would need 'recurring={"interval": "month"}' or similar
                # For now, assuming one-time or we can add a parameter for recurring
            )
        except stripe.StripeError as e:
            logger.error(f"Error creating Stripe price: {e}")
            raise e

    def update_product(
        self, product_id: str, name: str | None = None, description: str | None = None
    ) -> stripe.Product:
        """Update an existing product in Stripe."""
        try:
            params = {}
            if name:
                params["name"] = name
            if description:
                params["description"] = description

            if not params:
                return stripe.Product.retrieve(product_id)

            return stripe.Product.modify(product_id, **params)
        except stripe.StripeError as e:
            logger.error(f"Error updating Stripe product: {e}")
            raise e

    def archive_price(self, price_id: str) -> stripe.Price:
        """Archive a price in Stripe (since prices are immutable)."""
        try:
            return stripe.Price.modify(price_id, active=False)
        except stripe.StripeError as e:
            logger.error(f"Error archiving Stripe price: {e}")
            raise e

    def archive_product(self, product_id: str) -> stripe.Product:
        """Archive a product in Stripe."""
        try:
            return stripe.Product.modify(product_id, active=False)
        except stripe.StripeError as e:
            logger.error(f"Error archiving Stripe product: {e}")
            raise e
