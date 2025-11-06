from __future__ import annotations
from pydantic import BaseModel, Field
from typing import Dict, Any
from datetime import datetime


class LeadMappingConfig(BaseModel):
    # Maps incoming webhook field names to Lead model field names
    # Example: {"webhook_email": "email", "webhook_name": "name"}
    field_map: Dict[str, str] = Field(default_factory=dict)
    # Optional default values for Lead fields not present in webhook or for overrides
    default_values: Dict[str, Any] = Field(default_factory=dict)


class LeadMappingCreate(BaseModel):
    user_id: str
    config: LeadMappingConfig


class LeadMappingResponse(BaseModel):
    id: str
    user_id: str
    credential_type: str  # This will be 'lead_mapping'
    credentials_data: LeadMappingConfig  # Store the config here
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
