from typing import List, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from backend.app.models.chat_session import ChatSession
from backend.app.schemas.chat_session import ChatSessionCreate, ChatSessionUpdate


class ChatSessionCRUD:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create_chat_session(self, chat_session: ChatSessionCreate) -> ChatSession:
        db_chat_session = ChatSession(**chat_session.model_dump())
        self.session.add(db_chat_session)
        await self.session.flush()

        return db_chat_session

    async def get_chat_session(self, chat_session_id: str) -> Optional[ChatSession]:
        stmt = select(ChatSession).where(ChatSession.id == chat_session_id)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_chat_session_with_messages(
        self, chat_session_id: str
    ) -> Optional[ChatSession]:
        stmt = (
            select(ChatSession)
            .options(selectinload(ChatSession.messages))
            .where(ChatSession.id == chat_session_id)
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_chat_session_by_external_id(
        self, agent_id: str, external_id: str
    ) -> Optional[ChatSession]:
        stmt = select(ChatSession).where(
            ChatSession.agent_id == agent_id, ChatSession.external_id == external_id
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_chat_sessions(
        self, user_id: str, skip: int = 0, limit: int = 100
    ) -> List[ChatSession]:
        stmt = (
            select(ChatSession)
            .where(ChatSession.user_id == user_id)
            .offset(skip)
            .limit(limit)
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def update_chat_session(
        self, chat_session_id: str, chat_session: ChatSessionUpdate
    ) -> Optional[ChatSession]:
        db_chat_session = await self.get_chat_session(chat_session_id)
        if db_chat_session:
            for key, value in chat_session.model_dump(exclude_unset=True).items():
                setattr(db_chat_session, key, value)
            await self.session.flush()

        return db_chat_session

    async def delete_chat_session(self, chat_session_id: str) -> bool:
        db_chat_session = await self.get_chat_session(chat_session_id)
        if db_chat_session:
            await self.session.delete(db_chat_session)
            await self.session.flush()
            return True
        return False
