from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class MessageBase(BaseModel):
    chat_session_id: str
    role: str
    content: str


class MessageCreate(MessageBase):
    pass


class MessageUpdate(BaseModel):
    role: Optional[str] = None
    content: Optional[str] = None


class MessageRead(MessageBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
