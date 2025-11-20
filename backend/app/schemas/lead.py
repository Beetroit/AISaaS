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
    qualification_status: Optional[str] = None
    source: Optional[str] = None
    contact_info: Optional[Dict[str, Any]] = None
    notes: Optional[str] = None


class LeadRead(BaseModel):
    id: str
    user_id: str
    agent_id: str
    chat_session_id: str
    qualification_status: str = "unqualified"
    source: Optional[str] = None
    contact_info: Optional[Dict[str, Any]] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
