from typing import List, Optional

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from backend.app.models.agent import Agent
from backend.app.models.agent_workflow import AgentWorkflow
from backend.app.models.user import User
from backend.app.models.workflow import Workflow
from backend.app.schemas.agent import AgentCreate, AgentUpdate


class AgentCRUD:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def _set_agent_workflows(
        self, db_agent: Agent, workflow_ids: Optional[List[str]]
    ):
        # Clear existing associations
        await self.session.execute(
            delete(AgentWorkflow).where(AgentWorkflow.agent_id == db_agent.id)
        )
        db_agent.workflows.clear()  # Clear the relationship collection

        if workflow_ids:
            # Fetch workflows to associate
            workflows_stmt = select(Workflow).where(Workflow.id.in_(workflow_ids))
            result = await self.session.execute(workflows_stmt)
            workflows_to_add = result.scalars().all()

            for workflow in workflows_to_add:
                db_agent.workflows.append(workflow)
        await self.session.flush()

    async def associate_workflow_with_agent(
        self, agent_id: str, workflow_id: str, user_id: str
    ) -> bool:
        # Verify agent belongs to user
        agent_stmt = select(Agent).where(Agent.id == agent_id, Agent.user_id == user_id)
        agent_result = await self.session.execute(agent_stmt)
        db_agent = agent_result.scalar_one_or_none()
        if not db_agent:
            return False

        # Verify workflow belongs to user
        workflow_stmt = select(Workflow).where(
            Workflow.id == workflow_id, Workflow.user_id == user_id
        )
        workflow_result = await self.session.execute(workflow_stmt)
        db_workflow = workflow_result.scalar_one_or_none()
        if not db_workflow:
            return False

        # Check if association already exists
        association_stmt = select(AgentWorkflow).where(
            AgentWorkflow.agent_id == agent_id, AgentWorkflow.workflow_id == workflow_id
        )
        existing = await self.session.execute(association_stmt)
        if existing.scalar_one_or_none():
            return True  # Already associated, consider success

        # Add association
        association = AgentWorkflow(agent_id=agent_id, workflow_id=workflow_id)
        self.session.add(association)

        return True

    async def remove_workflow_from_agent(
        self, agent_id: str, workflow_id: str, user_id: str
    ) -> bool:
        # Verify agent and workflow belong to user
        agent_stmt = select(Agent).where(Agent.id == agent_id, Agent.user_id == user_id)
        agent_result = await self.session.execute(agent_stmt)
        db_agent = agent_result.scalar_one_or_none()
        if not db_agent:
            return False

        workflow_stmt = select(Workflow).where(
            Workflow.id == workflow_id, Workflow.user_id == user_id
        )
        workflow_result = await self.session.execute(workflow_stmt)
        db_workflow = workflow_result.scalar_one_or_none()
        if not db_workflow:
            return False

        # Remove association
        stmt = delete(AgentWorkflow).where(
            AgentWorkflow.agent_id == agent_id,
            AgentWorkflow.workflow_id == workflow_id,
        )
        await self.session.execute(stmt)

        return True

    async def create_agent(self, agent: AgentCreate, user_id: str) -> Agent:
        agent_data = agent.model_dump(exclude_unset=True, exclude={"workflow_ids"})
        db_agent = Agent(**agent_data, user_id=user_id)
        self.session.add(db_agent)
        await self.session.flush()

        if agent.workflow_ids:
            await self._set_agent_workflows(db_agent, agent.workflow_ids)

        return db_agent

    async def get_agent(self, agent_id: str, user_id: str) -> Optional[Agent]:
        stmt = (
            select(Agent)
            .options(selectinload(Agent.workflows))
            .where(Agent.id == agent_id, Agent.user_id == user_id)
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_agents(
        self, user_id: str, skip: int = 0, limit: int = 100
    ) -> List[Agent]:
        stmt = (
            select(Agent)
            .options(selectinload(Agent.workflows))
            .where(Agent.user_id == user_id)
            .offset(skip)
            .limit(limit)
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def update_agent(
        self, agent_id: str, agent: AgentUpdate, user_id: str
    ) -> Optional[Agent]:
        db_agent = await self.get_agent(agent_id, user_id)
        if db_agent:
            update_data = agent.model_dump(exclude_unset=True, exclude={"workflow_ids"})
            for key, value in update_data.items():
                setattr(db_agent, key, value)

            if (
                agent.workflow_ids is not None
            ):  # Only update if workflow_ids is explicitly provided
                await self._set_agent_workflows(db_agent, agent.workflow_ids)

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
        if not db_agent:
            return None

        # Fetch the user
        user_stmt = select(User).where(User.id == user_id)
        user = (await self.session.execute(user_stmt)).scalar_one_or_none()

        if not user:
            # This should ideally not happen if user_id is valid from CurrentUser
            return None

        if user.message_credits < amount:
            # Insufficient credits in user's balance
            return None

        # Deduct from user's balance
        user.message_credits -= amount
        self.session.add(user)

        # Add to agent's balance
        db_agent.message_credits += amount
        self.session.add(db_agent)

        await self.session.flush()  # Flush both changes

        return db_agent
