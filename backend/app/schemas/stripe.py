from typing import Any, Dict, List, Optional

from pydantic import BaseModel


class StripeProduct(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    active: bool
    metadata: Dict[str, Any]


class StripePrice(BaseModel):
    id: str
    product: str
    active: bool
    unit_amount: Optional[int] = None
    currency: str
    type: str
    recurring: Optional[Dict[str, Any]] = None
    metadata: Dict[str, Any]


class StripeCheckoutSessionCreate(BaseModel):
    price_id: str
    quantity: int = 1
    success_url: str
    cancel_url: str
    customer_email: Optional[str] = None


class StripeSubscription(BaseModel):
    id: str
    customer: str
    status: str
    current_period_end: int
    cancel_at_period_end: bool
    items: List[Dict[str, Any]]


class StripeCustomerPortalSessionCreate(BaseModel):
    customer_id: str
    return_url: str


class StripeCustomerCreate(BaseModel):
    email: str
    name: Optional[str] = None


class StripeSubscriptionCreate(BaseModel):
    price_id: str
