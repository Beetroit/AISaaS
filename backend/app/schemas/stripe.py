from pydantic import BaseModel
from typing import Optional, Dict, Any, List


class StripeProduct(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    active: bool
    metadata: Dict[str, Any]


class StripePrice(BaseModel):
    id: str
    product: str  # ID of the product this price is for
    active: bool
    unit_amount: Optional[int] = None  # Amount in cents
    currency: str
    type: str  # e.g., 'recurring', 'one_time'
    recurring: Optional[Dict[str, Any]] = None  # Details for recurring prices
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
