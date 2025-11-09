from typing import List, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.models.lead import Lead
from backend.app.schemas.lead import LeadCreate, LeadUpdate


class LeadCRUD:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create_lead(
        self, lead: LeadCreate, user_id: str, agent_id: str, chat_session_id: str
    ) -> Lead:
        db_lead = Lead(
            **lead.model_dump(),
            user_id=user_id,
            agent_id=agent_id,
            chat_session_id=chat_session_id,
        )
        self.session.add(db_lead)
        await self.session.flush()

        return db_lead

    async def get_lead(self, lead_id: str) -> Optional[Lead]:
        stmt = select(Lead).where(Lead.id == lead_id)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_lead_by_chat_session_id(self, chat_session_id: str) -> Optional[Lead]:
        stmt = select(Lead).where(Lead.chat_session_id == chat_session_id)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_leads(self, skip: int = 0, limit: int = 100) -> List[Lead]:
        stmt = select(Lead).offset(skip).limit(limit)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def get_leads_by_user_id(
        self, user_id: str, skip: int = 0, limit: int = 100
    ) -> List[Lead]:
        stmt = select(Lead).where(Lead.user_id == user_id).offset(skip).limit(limit)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def update_lead(self, lead_id: str, lead: LeadUpdate) -> Optional[Lead]:
        db_lead = await self.get_lead(lead_id)
        if db_lead:
            for key, value in lead.model_dump(exclude_unset=True).items():
                setattr(db_lead, key, value)
            await self.session.flush()

        return db_lead

    async def delete_lead(self, lead_id: str) -> bool:
        db_lead = await self.get_lead(lead_id)
        if db_lead:
            await self.session.delete(db_lead)
            await self.session.flush()
            return True
        return False

    async def update_lead_status(self, lead_id: str, new_status: str) -> Optional[Lead]:
        db_lead = await self.get_lead(lead_id)
        if db_lead:
            db_lead.qualification_status = new_status
            await self.session.flush()

        return db_lead
