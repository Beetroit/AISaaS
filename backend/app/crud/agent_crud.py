from typing import List, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.models.agent import Agent
from backend.app.schemas.agent import AgentCreate, AgentUpdate


class AgentCRUD:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create_agent(self, agent: AgentCreate, user_id: str) -> Agent:
        db_agent = Agent(**agent.model_dump(), user_id=user_id)
        self.session.add(db_agent)
        await self.session.flush()

        return db_agent

    async def get_agent(self, agent_id: str, user_id: str) -> Optional[Agent]:
        stmt = select(Agent).where(Agent.id == agent_id, Agent.user_id == user_id)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_agents(
        self, user_id: str, skip: int = 0, limit: int = 100
    ) -> List[Agent]:
        stmt = select(Agent).where(Agent.user_id == user_id).offset(skip).limit(limit)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def update_agent(
        self, agent_id: str, agent: AgentUpdate, user_id: str
    ) -> Optional[Agent]:
        db_agent = await self.get_agent(agent_id, user_id)
        if db_agent:
            for key, value in agent.model_dump(exclude_unset=True).items():
                setattr(db_agent, key, value)
            await self.session.flush()

        return db_agent

    async def delete_agent(self, agent_id: str, user_id: str) -> bool:
        db_agent = await self.get_agent(agent_id, user_id)
        if db_agent:
            await self.session.delete(db_agent)
            await self.session.flush()
            return True
        return False

    async def add_agent_credits(
        self, agent_id: str, user_id: str, amount: int
    ) -> Optional[Agent]:
        db_agent = await self.get_agent(agent_id, user_id)
        if db_agent:
            db_agent.message_credits += amount
            await self.session.flush()

        return db_agent
