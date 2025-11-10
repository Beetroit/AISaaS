from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.models.knowledge_base_document import (
    DocumentStatus,
    KnowledgeBaseDocument,
)
from backend.app.schemas.knowledge_base_document import KnowledgeBaseDocumentCreate


class KnowledgeBaseDocumentCRUD:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create_knowledge_base_document(
        self, doc: KnowledgeBaseDocumentCreate
    ) -> KnowledgeBaseDocument:
        db_doc = KnowledgeBaseDocument(**doc.model_dump(exclude_unset=True))
        self.session.add(db_doc)
        await self.session.flush()

        return db_doc

    async def get_knowledge_base_document_by_id(
        self, doc_id: str
    ) -> KnowledgeBaseDocument | None:
        result = await self.session.execute(
            select(KnowledgeBaseDocument).where(KnowledgeBaseDocument.id == doc_id)
        )
        return result.scalars().first()

    async def get_knowledge_base_document_by_content_hash_and_user_id(
        self, content_hash: str, user_id: str
    ) -> KnowledgeBaseDocument | None:
        result = await self.session.execute(
            select(KnowledgeBaseDocument).where(
                KnowledgeBaseDocument.content_hash == content_hash,
                KnowledgeBaseDocument.user_id == user_id,
            )
        )
        return result.scalars().first()

    async def get_knowledge_base_documents_by_user_id(
        self, user_id: str
    ) -> list[KnowledgeBaseDocument]:
        stmt = select(KnowledgeBaseDocument).where(
            KnowledgeBaseDocument.user_id == user_id
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def get_knowledge_base_documents_by_agent_id(
        self, agent_id: str
    ) -> list[KnowledgeBaseDocument]:
        result = await self.session.execute(
            select(KnowledgeBaseDocument).where(
                KnowledgeBaseDocument.agent_id == agent_id
            )
        )
        return list(result.scalars().all())

    async def update_document_status(
        self, document_id: str, user_id: str, new_status: DocumentStatus
    ) -> Optional[KnowledgeBaseDocument]:
        db_doc = await self.get_knowledge_base_document_by_id(document_id)
        if db_doc and db_doc.user_id == user_id:
            db_doc.status = new_status
            await self.session.flush()
            return db_doc
        return None

    async def get_document_file_path_by_id(
        self, document_id: str, user_id: str
    ) -> str | None:
        db_doc = await self.get_knowledge_base_document_by_id(document_id)
        if db_doc and db_doc.user_id == user_id:
            return db_doc.file_path
        return None

    async def delete_knowledge_base_document(self, doc: KnowledgeBaseDocument) -> None:
        await self.session.delete(doc)
        await self.session.flush()
