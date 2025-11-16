from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field


class WorkflowRunBase(BaseModel):
    agent_id: str
    workflow_id: str
    chat_session_id: Optional[str] = None
    lead_id: Optional[str] = None
    credential_id: Optional[str] = None
    status: str = Field("in_progress", max_length=50)
    initial_data: Dict[str, Any] = Field(default_factory=dict)


class WorkflowRunCreate(WorkflowRunBase):
    pass


class WorkflowRunUpdate(BaseModel):
    status: Optional[str] = Field(None, max_length=50)
    end_time: Optional[datetime] = None


class WorkflowRunRead(WorkflowRunBase):
    id: str
    created_at: datetime
    updated_at: datetime
    end_time: Optional[datetime] = None

    class Config:
        from_attributes = True
