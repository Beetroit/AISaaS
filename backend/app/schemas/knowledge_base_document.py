from pydantic import BaseModel
from datetime import datetime
from backend.app.models.knowledge_base_document import DocumentStatus


class KnowledgeBaseDocumentBase(BaseModel):
    filename: str
    content_hash: str
    user_id: str
    agent_id: str | None = None
    status: DocumentStatus = DocumentStatus.UNPROCESSED
    file_path: str | None = None


class KnowledgeBaseDocumentCreate(KnowledgeBaseDocumentBase):
    pass


class KnowledgeBaseDocumentResponse(KnowledgeBaseDocumentBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
