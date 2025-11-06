from typing import Optional, List, Dict, Any
from datetime import datetime

from pydantic import BaseModel


class ChatSessionBase(BaseModel):
    user_id: str
    agent_id: str
    external_id: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    status: Optional[str] = "active"
    current_workflow_step: Optional[str] = None
    chat_history: List[Dict[str, Any]] = []


class ChatSessionCreate(ChatSessionBase):
    pass


class ChatSessionUpdate(BaseModel):
    external_id: Optional[str] = None
    end_time: Optional[datetime] = None
    status: Optional[str] = None
    chat_history: Optional[List[Dict[str, Any]]] = None


class ChatSessionRead(ChatSessionBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
