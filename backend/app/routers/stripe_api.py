import stripe  # type: ignore
from fastapi import APIRouter, HTTPException

from backend.app.config import settings
from backend.app.dependencies import CredentialServiceDep, CurrentUser
from backend.app.schemas.stripe import StripeCustomerCreate, StripeSubscriptionCreate


def _ensure_https_scheme(url: str) -> str:
    if not url.startswith("http://") and not url.startswith("https://"):
        return f"https://{url}"
    return url


stripe.api_key = settings.stripe_secret_key

router = APIRouter(prefix="/stripe", tags=["Stripe"])


@router.post("/create-customer")
async def create_stripe_customer(
    customer_data: StripeCustomerCreate,
    current_user: CurrentUser,
    credential_service: CredentialServiceDep,
):
    try:
        customer = stripe.Customer.create(
            email=customer_data.email,
            name=customer_data.name,
            description=f"Customer for {current_user.email}",
        )
        await credential_service.save_stripe_customer_id(current_user.id, customer.id)
        return {"customer_id": customer.id}
    except stripe.StripeError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/create-subscription")
async def create_stripe_subscription(
    subscription_data: StripeSubscriptionCreate,
    current_user: CurrentUser,
    credential_service: CredentialServiceDep,
):
    stripe_customer_id = await credential_service.get_stripe_customer_id(
        current_user.id
    )
    if not stripe_customer_id:
        raise HTTPException(
            status_code=400, detail="Stripe customer not found for this user."
        )

    try:
        subscription = stripe.Subscription.create(
            customer=stripe_customer_id,
            items=[{"price": subscription_data.price_id}],
            payment_behavior="default_incomplete",
            expand=["latest_invoice.payment_intent"],
        )
        if not subscription.latest_invoice:
            raise HTTPException(
                status_code=500,
                detail="Stripe subscription created but no latest_invoice found.",
            )
        if not subscription.latest_invoice.payment_intent:
            raise HTTPException(
                status_code=500,
                detail="Stripe subscription created but no payment_intent found.",
            )
        return {
            "subscription_id": subscription.id,
            "client_secret": subscription.latest_invoice.payment_intent.client_secret,
        }
    except stripe.StripeError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/customer-portal")
async def get_customer_portal_session(
    current_user: CurrentUser,
    credential_service: CredentialServiceDep,
):
    stripe_customer_id = await credential_service.get_stripe_customer_id(
        current_user.id
    )
    if not stripe_customer_id:
        raise HTTPException(
            status_code=400, detail="Stripe customer not found for this user."
        )

    try:
        session = stripe.billing_portal.Session.create(
            customer=stripe_customer_id,
            return_url=_ensure_https_scheme(settings.stripe_customer_portal_return_url),
        )
        return {"url": session.url}
    except stripe.StripeError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/subscription-status")
async def get_subscription_status(
    current_user: CurrentUser,
    credential_service: CredentialServiceDep,
):
    stripe_customer_id = await credential_service.get_stripe_customer_id(
        current_user.id
    )
    if not stripe_customer_id:
        return {"status": "no_subscription"}

    try:
        subscriptions = stripe.Subscription.list(
            customer=stripe_customer_id, status="active"
        )
        if subscriptions.data:
            return {"status": "active", "subscription": subscriptions.data[0]}
        else:
            return {"status": "no_subscription"}
    except stripe.StripeError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/message-packages")
async def get_message_packages():
    try:
        products = stripe.Product.list(active=True)
        message_packages = []
        for product in products.data:
            prices = stripe.Price.list(product=product.id, active=True)
            for price in prices.data:
                if price.type == "one_time":
                    message_packages.append(
                        {
                            "id": product.id,
                            "name": product.name,
                            "description": product.description,
                            "price_id": price.id,
                            "unit_amount": price.unit_amount,
                            "currency": price.currency,
                        }
                    )
        return message_packages
    except stripe.StripeError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/create-checkout-session")
async def create_checkout_session(
    price_id: str,
    current_user: CurrentUser,
    credential_service: CredentialServiceDep,
):
    stripe_customer_id = await credential_service.get_stripe_customer_id(
        current_user.id
    )

    if not stripe_customer_id:
        try:
            customer = stripe.Customer.create(
                email=current_user.email,
                name=current_user.email,  # Using email as name if no other name is available
                description=f"Customer for {current_user.email}",
            )
            await credential_service.save_stripe_customer_id(
                current_user.id, customer.id
            )
            stripe_customer_id = customer.id
        except stripe.StripeError as e:
            raise HTTPException(status_code=400, detail=str(e))

    print(
        f"DEBUG: stripe_customer_portal_return_url = {settings.stripe_customer_portal_return_url}"
    )

    try:
        checkout_session = stripe.checkout.Session.create(
            customer=stripe_customer_id,
            line_items=[
                {
                    "price": price_id,
                    "quantity": 1,
                }
            ],
            mode="payment",
            success_url=_ensure_https_scheme(
                settings.stripe_customer_portal_return_url + "?success=true"
            ),
            cancel_url=_ensure_https_scheme(
                settings.stripe_customer_portal_return_url + "?canceled=true"
            ),
        )
        return {"url": checkout_session.url}
    except stripe.StripeError as e:
        raise HTTPException(status_code=400, detail=str(e))
