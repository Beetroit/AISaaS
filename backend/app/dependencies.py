from contextlib import asynccontextmanager
from typing import Annotated, Any, AsyncGenerator

import chromadb
from chromadb.api import ClientAPI
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from backend.app.config import settings
from backend.app.crud.agent_crud import AgentCRUD
from backend.app.crud.appointment_crud import AppointmentCRUD
from backend.app.crud.chat_session_crud import ChatSessionCRUD, select
from backend.app.crud.knowledge_base_document_crud import KnowledgeBaseDocumentCRUD
from backend.app.crud.lead_crud import LeadCRUD
from backend.app.crud.message_crud import MessageCRUD
from backend.app.crud.node_type_crud import NodeTypeCRUD
from backend.app.crud.pricing_plan_crud import PricingPlanCRUD
from backend.app.crud.user_crud import UserCRUD
from backend.app.crud.workflow_crud import WorkflowCRUD
from backend.app.crud.workflow_run_crud import WorkflowRunCRUD
from backend.app.database import AsyncSessionLocal
from backend.app.models.user import User
from backend.app.security import is_token_blacklisted
from backend.app.services.agent_workflow_service import AgentWorkflowService
from backend.app.services.ai_service import AIService
from backend.app.services.credential_service import CredentialService
from backend.app.services.document_processor_service import DocumentProcessorService
from backend.app.services.google_calendar_service import GoogleCalendarService
from backend.app.services.messaging_service import MessagingService
from backend.app.services.openai_service import OpenAIService
from backend.app.services.retrieval_service import RetrievalService
from backend.app.services.twilio_service import TwilioService
from backend.app.services.webhook_service import WebhookService

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


def get_agent_crud(session: AsyncSession = Depends(get_db)) -> AgentCRUD:
    return AgentCRUD(session)


def get_chat_session_crud(session: AsyncSession = Depends(get_db)) -> ChatSessionCRUD:
    return ChatSessionCRUD(session)


def get_appointment_crud(session: AsyncSession = Depends(get_db)) -> AppointmentCRUD:
    return AppointmentCRUD(session)


def get_lead_crud(session: AsyncSession = Depends(get_db)) -> LeadCRUD:
    return LeadCRUD(session)


def get_message_crud(session: AsyncSession = Depends(get_db)) -> MessageCRUD:
    return MessageCRUD(session)


def get_knowledge_base_document_crud(
    session: AsyncSession = Depends(get_db),
) -> KnowledgeBaseDocumentCRUD:
    return KnowledgeBaseDocumentCRUD(session)


def get_workflow_crud(session: AsyncSession = Depends(get_db)) -> WorkflowCRUD:
    return WorkflowCRUD(session)


def get_workflow_run_crud(session: AsyncSession = Depends(get_db)) -> WorkflowRunCRUD:
    return WorkflowRunCRUD(session)


def get_node_type_crud(session: AsyncSession = Depends(get_db)) -> NodeTypeCRUD:
    return NodeTypeCRUD()


def get_pricing_plan_crud(session: AsyncSession = Depends(get_db)) -> PricingPlanCRUD:
    return PricingPlanCRUD()


def get_chroma_client() -> ClientAPI:
    return chroma_client


def get_openai_service() -> OpenAIService:
    return OpenAIService()


def get_twilio_service() -> TwilioService:
    return TwilioService()


def get_messaging_service(
    twilio_service: TwilioService = Depends(get_twilio_service),
) -> MessagingService:
    return twilio_service


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


def get_google_calendar_service(
    db: AsyncSession = Depends(get_db),
    credential_service: CredentialService = Depends(get_credential_service),
) -> GoogleCalendarService:
    return GoogleCalendarService(db=db, credential_service=credential_service)


def get_agent_workflow_service(
    ai_service: AIService = Depends(get_openai_service),
    agent_crud: AgentCRUD = Depends(get_agent_crud),
    lead_crud: LeadCRUD = Depends(get_lead_crud),
    chat_session_crud: ChatSessionCRUD = Depends(get_chat_session_crud),
    message_crud: MessageCRUD = Depends(get_message_crud),
    credential_service: CredentialService = Depends(get_credential_service),
    messaging_service: MessagingService = Depends(get_messaging_service),
    workflow_crud: WorkflowCRUD = Depends(get_workflow_crud),
    workflow_run_crud: WorkflowRunCRUD = Depends(get_workflow_run_crud),
) -> AgentWorkflowService:
    return AgentWorkflowService(
        ai_service=ai_service,
        agent_crud=agent_crud,
        lead_crud=lead_crud,
        chat_session_crud=chat_session_crud,
        message_crud=message_crud,
        credential_service=credential_service,
        messaging_service=messaging_service,
        workflow_crud=workflow_crud,
        workflow_run_crud=workflow_run_crud,
    )


def get_webhook_service(
    chat_session_crud: ChatSessionCRUD = Depends(get_chat_session_crud),
    lead_crud: LeadCRUD = Depends(get_lead_crud),
    message_crud: MessageCRUD = Depends(get_message_crud),
    workflow_run_crud: WorkflowRunCRUD = Depends(get_workflow_run_crud),
    agent_workflow_service=Depends(get_agent_workflow_service),
    credential_service=Depends(get_credential_service),
) -> "WebhookService":
    from backend.app.services.webhook_service import WebhookService

    return WebhookService(
        chat_session_crud=chat_session_crud,
        lead_crud=lead_crud,
        message_crud=message_crud,
        workflow_run_crud=workflow_run_crud,
        agent_workflow_service=agent_workflow_service,
        credential_service=credential_service,
    )


async def get_current_user(
    token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)
):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(
            token, settings.secret_key, algorithms=[settings.algorithm]
        )
        user_id: str = payload.get("sub")
        jti: str = payload.get("jti")

        if user_id is None or jti is None:
            raise credentials_exception

        if await is_token_blacklisted(jti):
            raise credentials_exception

    except JWTError:
        raise credentials_exception

    user = await db.execute(
        select(User).options(selectinload(User.agents)).where(User.id == user_id)
    )
    user = user.scalars().first()
    if user is None:
        raise credentials_exception
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User is inactive",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


UserCRUDDep = Annotated[UserCRUD, Depends(get_user_crud)]
AgentCRUDDep = Annotated[AgentCRUD, Depends(get_agent_crud)]
ChatSessionCRUDDep = Annotated[ChatSessionCRUD, Depends(get_chat_session_crud)]
AppointmentCRUDDep = Annotated[AppointmentCRUD, Depends(get_appointment_crud)]
LeadCRUDDep = Annotated[LeadCRUD, Depends(get_lead_crud)]
MessageCRUDDep = Annotated[MessageCRUD, Depends(get_message_crud)]
KnowledgeBaseDocumentCRUDDep = Annotated[
    KnowledgeBaseDocumentCRUD, Depends(get_knowledge_base_document_crud)
]
WorkflowCRUDDep = Annotated[WorkflowCRUD, Depends(get_workflow_crud)]
WorkflowRunCRUDDep = Annotated[WorkflowRunCRUD, Depends(get_workflow_run_crud)]
NodeTypeCRUDDep = Annotated[NodeTypeCRUD, Depends(get_node_type_crud)]
PricingPlanCRUDDep = Annotated[PricingPlanCRUD, Depends(get_pricing_plan_crud)]
CredentialServiceDep = Annotated[CredentialService, Depends(get_credential_service)]
CurrentUser = Annotated[User, Depends(get_current_user)]
DBSession = Annotated[AsyncSession, Depends(get_db)]
AgentWorkflowServiceDep = Annotated[
    AgentWorkflowService, Depends(get_agent_workflow_service)
]
OpenAIServiceDep = Annotated[OpenAIService, Depends(get_openai_service)]
DocumentProcessorServiceDep = Annotated[
    DocumentProcessorService, Depends(get_document_processor_service)
]
RetrievalServiceDep = Annotated[RetrievalService, Depends(get_retrieval_service)]
GoogleCalendarServiceDep = Annotated[
    GoogleCalendarService, Depends(get_google_calendar_service)
]
ChromaClientDep = Annotated[ClientAPI, Depends(get_chroma_client)]
WebhookServiceDep = Annotated["WebhookService", Depends(get_webhook_service)]
