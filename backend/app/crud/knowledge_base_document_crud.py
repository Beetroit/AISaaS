from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from backend.app.models.knowledge_base_document import KnowledgeBaseDocument
from backend.app.schemas.knowledge_base_document import KnowledgeBaseDocumentCreate


class KnowledgeBaseDocumentCRUD:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create_knowledge_base_document(
        self, doc: KnowledgeBaseDocumentCreate
    ) -> KnowledgeBaseDocument:
        db_doc = KnowledgeBaseDocument(**doc.model_dump())
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
        result = await self.session.execute(
            select(KnowledgeBaseDocument).where(
                KnowledgeBaseDocument.user_id == user_id
            )
        )
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

    async def delete_knowledge_base_document(self, doc: KnowledgeBaseDocument) -> None:
        await self.session.delete(doc)
        await self.session.flush()
