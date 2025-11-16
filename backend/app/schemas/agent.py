from datetime import datetime
from typing import Optional, List

from pydantic import BaseModel, Field


class AgentBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=500)
    persona: Optional[str] = Field(None, max_length=1000)
    initial_prompts: Optional[str] = Field(None, max_length=2000)
    message_credits: Optional[int] = 0
    workflow_ids: Optional[List[str]] = Field(None)


class AgentCreate(AgentBase):
    pass


class AgentUpdate(AgentBase):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=500)
    persona: Optional[str] = Field(None, max_length=1000)
    initial_prompts: Optional[str] = Field(None, max_length=2000)
    message_credits: Optional[int] = None
    workflow_ids: Optional[List[str]] = Field(None)


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
