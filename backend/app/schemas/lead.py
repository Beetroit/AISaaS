from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class LeadBase(BaseModel):
    email: Optional[str] = None
    phone_number: Optional[str] = None
    name: Optional[str] = None
    source: Optional[str] = None
    status: Optional[str] = "New"
    # Add other relevant lead fields here


class LeadCreate(LeadBase):
    pass


class LeadResponse(LeadBase):
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
