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


class TwilioCredentialCreate(BaseModel):
    """Schema for creating/updating Twilio credentials"""

    twilio_account_sid: str
    twilio_auth_token: str
    twilio_phone_number: str


class TwilioCredentialResponse(BaseModel):
    """Schema for Twilio credential response (without sensitive data)"""

    id: str
    credential_type: str
    phone_number: str | None
    has_account_sid: bool
    has_auth_token: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
