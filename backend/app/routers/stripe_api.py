import stripe
from fastapi import APIRouter, HTTPException

from backend.app.config import logger, settings
from backend.app.dependencies import CredentialServiceDep, CurrentUser, UserCRUDDep
from backend.app.schemas.stripe import StripeCustomerCreate, StripeSubscriptionCreate

stripe.api_key = settings.stripe_secret_key


def _ensure_https_scheme(url: str) -> str:
    if not url.startswith("http://") and not url.startswith("https://"):
        return f"https://{url}"
    return url


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
        if not subscription.latest_invoice.payment_intent:  # type: ignore
            raise HTTPException(
                status_code=500,
                detail="Stripe subscription created but no payment_intent found.",
            )
        return {
            "subscription_id": subscription.id,
            "client_secret": subscription.latest_invoice.payment_intent.client_secret,  # type: ignore
        }
    except stripe.InvalidRequestError as e:
        if "No such customer" in str(e):
            logger.warning(
                f"Stripe customer {stripe_customer_id} not found. Recreating..."
            )
            try:
                customer = stripe.Customer.create(
                    email=current_user.email,
                    name=current_user.email,
                    description=f"Customer for {current_user.email}",
                )
                await credential_service.update_credential(
                    current_user.id, "stripe_customer_id", {"customer_id": customer.id}
                )
                subscription = stripe.Subscription.create(
                    customer=customer.id,
                    items=[{"price": subscription_data.price_id}],
                    payment_behavior="default_incomplete",
                    expand=["latest_invoice.payment_intent"],
                )
                if not subscription.latest_invoice:
                    raise HTTPException(
                        status_code=500,
                        detail="Stripe subscription created but no latest_invoice found.",
                    )
                if not subscription.latest_invoice.payment_intent:  # type: ignore
                    raise HTTPException(
                        status_code=500,
                        detail="Stripe subscription created but no payment_intent found.",
                    )
                return {
                    "subscription_id": subscription.id,
                    "client_secret": subscription.latest_invoice.payment_intent.client_secret,  # type: ignore
                }
            except stripe.StripeError as retry_e:
                raise HTTPException(status_code=400, detail=str(retry_e))
        raise HTTPException(status_code=400, detail=str(e))
    except stripe.StripeError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/customer-portal")
async def get_customer_portal_session(
    prev_url: str,
    current_user: CurrentUser,
    credential_service: CredentialServiceDep,
):
    logger.info(f"DEBUG: prev_url = {prev_url}")
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
            return_url=_ensure_https_scheme(prev_url + "?stripe_status=success"),
        )
        return {"url": session.url}
    except stripe.InvalidRequestError as e:
        if "No such customer" in str(e):
            logger.warning(
                f"Stripe customer {stripe_customer_id} not found. Recreating..."
            )
            try:
                customer = stripe.Customer.create(
                    email=current_user.email,
                    name=current_user.email,
                    description=f"Customer for {current_user.email}",
                )
                await credential_service.update_credential(
                    current_user.id, "stripe_customer_id", {"customer_id": customer.id}
                )
                session = stripe.billing_portal.Session.create(
                    customer=customer.id,
                    return_url=_ensure_https_scheme(
                        prev_url + "?stripe_status=success"
                    ),
                )
                return {"url": session.url}
            except stripe.StripeError as retry_e:
                raise HTTPException(status_code=400, detail=str(retry_e))
        raise HTTPException(status_code=400, detail=str(e))
    except stripe.StripeError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/account-status")
async def get_account_status(
    current_user: CurrentUser,
):
    """
    Returns the user's account status, including credit balance.
    Since we use a credit-based system (Pay As You Go), we don't check for active subscriptions.
    """
    return {
        "status": "active",
        "credits": current_user.message_credits,
        "plan_name": "Pay As You Go",
    }


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
    prev_url: str,
    current_user: CurrentUser,
    credential_service: CredentialServiceDep,
):
    stripe_customer_id = await credential_service.get_stripe_customer_id(
        current_user.id
    )
    logger.info(f"DEBUG: prev_url = {prev_url}")

    if not stripe_customer_id:
        try:
            customer = stripe.Customer.create(
                email=current_user.email,
                name=current_user.email,
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
            client_reference_id=current_user.id,
            line_items=[
                {
                    "price": price_id,
                    "quantity": 1,
                }
            ],
            mode="payment",
            success_url=_ensure_https_scheme(prev_url + "?stripe_status=success"),
            cancel_url=_ensure_https_scheme(prev_url + "?stripe_status=failed"),
        )
        return {"url": checkout_session.url}
    except stripe.InvalidRequestError as e:
        if "No such customer" in str(e):
            logger.warning(
                f"Stripe customer {stripe_customer_id} not found. Recreating..."
            )
            try:
                customer = stripe.Customer.create(
                    email=current_user.email,
                    name=current_user.email,
                    description=f"Customer for {current_user.email}",
                )
                # Update the credential in the database
                await credential_service.update_credential(
                    current_user.id, "stripe_customer_id", {"customer_id": customer.id}
                )
                # Retry creating the checkout session with the new customer ID
                checkout_session = stripe.checkout.Session.create(
                    customer=customer.id,
                    client_reference_id=current_user.id,
                    line_items=[
                        {
                            "price": price_id,
                            "quantity": 1,
                        }
                    ],
                    mode="payment",
                    success_url=_ensure_https_scheme(
                        prev_url + "?stripe_status=success"
                    ),
                    cancel_url=_ensure_https_scheme(prev_url + "?stripe_status=failed"),
                )
                return {"url": checkout_session.url}
            except stripe.StripeError as retry_e:
                raise HTTPException(status_code=400, detail=str(retry_e))
        raise HTTPException(status_code=400, detail=str(e))
    except stripe.StripeError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/testing/update-balance")
async def update_balance(
    user_id: str,
    credits: int,
    user_crud: UserCRUDDep,
):
    try:
        user = await user_crud.update_user_credits(user_id, credits)
        return {"user_id": user.id, "new_balance": user.message_credits}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
