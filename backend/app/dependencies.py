from contextlib import asynccontextmanager
from typing import Annotated, Any, AsyncGenerator

import chromadb
import jose.jwt
from chromadb.api import ClientAPI
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.config import settings
from backend.app.crud.knowledge_base_document_crud import KnowledgeBaseDocumentCRUD
from backend.app.crud.user_crud import UserCRUD
from backend.app.database import AsyncSessionLocal
from backend.app.models.user import User
from backend.app.schemas.token import TokenData
from backend.app.services.ai_service import AIService
from backend.app.services.credential_service import CredentialService
from backend.app.services.document_processor_service import DocumentProcessorService
from backend.app.services.openai_service import OpenAIService
from backend.app.services.retrieval_service import RetrievalService

# Initialize ChromaDB client
chroma_client = chromadb.HttpClient(
    host=settings.chroma_host, port=settings.chroma_port
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token")


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


def get_credential_service(
    session: AsyncSession = Depends(get_db),
) -> CredentialService:
    return CredentialService(session)


async def get_current_user(
    db: Annotated[AsyncSession, Depends(get_db)], token: str = Depends(oauth2_scheme)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jose.jwt.decode(
            token, settings.secret_key, algorithms=[settings.algorithm]
        )
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        token_data = TokenData(email=email)
    except JWTError:
        raise credentials_exception
    user_crud = UserCRUD(db)
    if token_data.email is None:
        raise credentials_exception  # Should not happen due to earlier check, but for type safety
    user = await user_crud.get_user_by_email(token_data.email)
    if user is None:
        raise credentials_exception
    return user


# Type annotations for dependencies
UserCRUDDep = Annotated[UserCRUD, Depends(get_user_crud)]
CredentialServiceDep = Annotated[CredentialService, Depends(get_credential_service)]
CurrentUser = Annotated[User, Depends(get_current_user)]
DBSession = Annotated[AsyncSession, Depends(get_db)]
