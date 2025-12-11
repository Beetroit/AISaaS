from typing import List, Optional
from pydantic import BaseModel, EmailStr


class UserCreate(BaseModel):
    email: EmailStr
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str


class UserResponse(BaseModel):
    id: str
    email: EmailStr
    is_active: bool
    is_admin: bool
    is_super_admin: bool
    message_credits: int
    agent_ids: List[str] = []
    whitelisted_phone_numbers: Optional[List[str]] = None
    allowed_admin_endpoints: Optional[List[str]] = None

    class Config:
        from_attributes = True


class UserAdminUpdate(BaseModel):
    is_active: Optional[bool] = None
    is_admin: Optional[bool] = None
    is_super_admin: Optional[bool] = None
    message_credits: Optional[int] = None
    whitelisted_phone_numbers: Optional[List[str]] = None
    allowed_admin_endpoints: Optional[List[str]] = None
