from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime


class LeadBase(BaseModel):
    email: Optional[str] = None
    phone_number: Optional[str] = None
    name: Optional[str] = None
    source: Optional[str] = None
    qualification_status: Optional[str] = "unqualified"
    contact_info: Optional[Dict[str, Any]] = None
    # Add other relevant lead fields here


class LeadCreate(LeadBase):
    pass


class LeadUpdate(BaseModel):
    email: Optional[str] = None
    phone_number: Optional[str] = None
    name: Optional[str] = None
    source: Optional[str] = None
    qualification_status: Optional[str] = None
    contact_info: Optional[Dict[str, Any]] = None


class LeadRead(LeadBase):
    id: str
    user_id: str
    agent_id: str
    chat_session_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
