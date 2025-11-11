from datetime import datetime
from typing import Any, Dict, Optional

from pydantic import BaseModel


class CredentialBase(BaseModel):
    user_id: str
    credential_type: str
    credentials_data: Dict[str, Any]


class CredentialCreate(CredentialBase):
    pass


class CredentialUpdate(BaseModel):
    credentials_data: Optional[Dict[str, Any]] = None


class CredentialRead(CredentialBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
