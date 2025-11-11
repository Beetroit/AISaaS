from typing import Optional, List
from datetime import datetime

from pydantic import BaseModel

from backend.app.schemas.message import MessageRead


class ChatSessionBase(BaseModel):
    user_id: str
    agent_id: str
    external_id: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    status: Optional[str] = "active"
    current_workflow_step: Optional[str] = None


class ChatSessionCreate(ChatSessionBase):
    pass


class ChatSessionUpdate(BaseModel):
    external_id: Optional[str] = None
    end_time: Optional[datetime] = None
    status: Optional[str] = None


class ChatSessionRead(ChatSessionBase):
    id: str
    created_at: datetime
    updated_at: datetime
    messages: List[MessageRead] = []

    class Config:
        from_attributes = True
