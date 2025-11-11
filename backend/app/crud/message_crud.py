from typing import List, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.models.message import Message
from backend.app.schemas.message import MessageCreate, MessageUpdate


class MessageCRUD:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create_message(self, message: MessageCreate) -> Message:
        db_message = Message(**message.model_dump())
        self.session.add(db_message)
        await self.session.flush()
        return db_message

    async def get_message(self, message_id: str) -> Optional[Message]:
        stmt = select(Message).where(Message.id == message_id)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_messages_by_chat_session(
        self, chat_session_id: str, skip: int = 0, limit: int = 100
    ) -> List[Message]:
        stmt = (
            select(Message)
            .where(Message.chat_session_id == chat_session_id)
            .offset(skip)
            .limit(limit)
            .order_by(Message.created_at)
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def update_message(
        self, message_id: str, message: MessageUpdate
    ) -> Optional[Message]:
        db_message = await self.get_message(message_id)
        if db_message:
            for key, value in message.model_dump(exclude_unset=True).items():
                setattr(db_message, key, value)
            await self.session.flush()
        return db_message

    async def delete_message(self, message_id: str) -> bool:
        db_message = await self.get_message(message_id)
        if db_message:
            await self.session.delete(db_message)
            await self.session.flush()
            return True
        return False
