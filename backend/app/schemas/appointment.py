from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class AppointmentBase(BaseModel):
    appointment_time: datetime
    status: Optional[str] = "scheduled"
    notes: Optional[str] = None


class AppointmentCreate(AppointmentBase):
    user_id: str
    agent_id: str
    lead_id: str


class AppointmentUpdate(AppointmentBase):
    appointment_time: Optional[datetime] = None
    status: Optional[str] = None
    notes: Optional[str] = None


class AppointmentRead(AppointmentBase):
    id: str
    user_id: str
    agent_id: str
    lead_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
