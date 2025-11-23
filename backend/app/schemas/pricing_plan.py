from typing import List, Optional
from pydantic import BaseModel


class PricingPlanBase(BaseModel):
    name: str
    description: Optional[str] = None
    credits: int = 0
    price: float  # Price in USD (e.g., 10.00)
    features: List[str] = []
    popular: bool = False


class PricingPlanCreate(PricingPlanBase):
    pass


class PricingPlanUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    credits: Optional[int] = None
    price: Optional[float] = None
    features: Optional[List[str]] = None
    popular: Optional[bool] = None
    is_active: Optional[bool] = None


class PricingPlanResponse(PricingPlanBase):
    id: str
    stripe_price_id: Optional[str] = None
    is_active: bool
    price: str  # Return as string to match DB model, or maybe we should cast to float?
    # The DB model has it as String. Let's keep it consistent with DB for now
    # but the Base has it as float.
    # Actually, let's override price in Response to be float if we want to be nice,
    # or string if we want to be exact to DB.
    # Let's make it float in Response for consistency with Base.

    class Config:
        from_attributes = True


# We need to handle the conversion from DB string to float in the response if we use from_attributes
# Or we can just let Pydantic handle it if the string is parseable.
