from pydantic import BaseModel


class ServiceAccountCreate(BaseModel):
    name: str
    api_key: str


class ServiceAccountResponse(BaseModel):
    id: str
    name: str
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True
