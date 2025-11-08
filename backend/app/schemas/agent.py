from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class AgentBase(BaseModel):
    name: str
    description: Optional[str] = None
    persona: Optional[str] = None
    initial_prompts: Optional[str] = None
    workflow_schema: Optional[dict] = None
    message_credits: Optional[int] = 0


class AgentCreate(AgentBase):
    pass


class AgentUpdate(AgentBase):
    pass


class AgentRead(AgentBase):
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TwilioCredentials(BaseModel):
    sid: str
    auth_token: str
    phone_number: str
