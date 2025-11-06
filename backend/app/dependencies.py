from contextlib import asynccontextmanager
from typing import Any, AsyncGenerator

import chromadb
from chromadb.api import ClientAPI
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.config import settings
from backend.app.crud.knowledge_base_document_crud import KnowledgeBaseDocumentCRUD
from backend.app.crud.user_crud import UserCRUD
from backend.app.database import AsyncSessionLocal
from backend.app.services.ai_service import AIService
from backend.app.services.document_processor_service import DocumentProcessorService
from backend.app.services.openai_service import OpenAIService
from backend.app.services.retrieval_service import RetrievalService

# Initialize ChromaDB client
chroma_client = chromadb.HttpClient(
    host=settings.chroma_host, port=settings.chroma_port
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        yield session
        try:
            await session.commit()
        except Exception:
            await session.rollback()
            raise


@asynccontextmanager
async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        yield session
        try:
            await session.commit()
        except Exception:
            await session.rollback()
            raise


def get_user_crud(session: AsyncSession = Depends(get_db)) -> UserCRUD:
    return UserCRUD(session)


def get_knowledge_base_document_crud(
    session: AsyncSession = Depends(get_db),
) -> KnowledgeBaseDocumentCRUD:
    return KnowledgeBaseDocumentCRUD(session)


def get_chroma_client() -> ClientAPI:
    return chroma_client


def get_openai_service() -> OpenAIService:
    return OpenAIService()


def get_document_processor_service(
    ai_service: AIService = Depends(get_openai_service),
    chroma_client: Any = Depends(get_chroma_client),
) -> DocumentProcessorService:
    return DocumentProcessorService(ai_service=ai_service, chroma_client=chroma_client)


def get_retrieval_service(
    ai_service: AIService = Depends(get_openai_service),
    chroma_client: ClientAPI = Depends(get_chroma_client),
) -> RetrievalService:
    return RetrievalService(ai_service=ai_service, chroma_client=chroma_client)
