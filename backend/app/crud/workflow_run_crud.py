from typing import List, Optional

from sqlalchemy import delete, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from backend.app.models.workflow_run import WorkflowRun
from backend.app.schemas.workflow_run import WorkflowRunCreate, WorkflowRunUpdate


class WorkflowRunCRUD:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create_workflow_run(
        self, workflow_run_data: WorkflowRunCreate, user_id: str
    ) -> WorkflowRun:
        db_workflow_run = WorkflowRun(
            user_id=user_id,
            agent_id=workflow_run_data.agent_id,
            workflow_id=workflow_run_data.workflow_id,
            chat_session_id=workflow_run_data.chat_session_id,
            lead_id=workflow_run_data.lead_id,
            credential_id=workflow_run_data.credential_id,
            status=workflow_run_data.status,
            initial_data=workflow_run_data.initial_data,
        )
        self.session.add(db_workflow_run)

        await self.session.flush()
        return db_workflow_run

    async def get_workflow_run(
        self, workflow_run_id: str, user_id: str
    ) -> Optional[WorkflowRun]:
        result = await self.session.execute(
            select(WorkflowRun)
            .where(WorkflowRun.id == workflow_run_id)
            .where(WorkflowRun.user_id == user_id)
        )
        return result.scalars().first()

    async def get_workflow_runs_by_agent(self, agent_id: str) -> List[WorkflowRun]:
        result = await self.session.execute(
            select(WorkflowRun).where(WorkflowRun.agent_id == agent_id)
        )
        return list(result.scalars().all())

    async def get_workflow_runs_by_workflow(
        self, workflow_id: str
    ) -> List[WorkflowRun]:
        result = await self.session.execute(
            select(WorkflowRun).where(WorkflowRun.workflow_id == workflow_id)
        )
        return list(result.scalars().all())

    async def update_workflow_run(
        self, workflow_run_id: str, workflow_run_data: WorkflowRunUpdate
    ) -> Optional[WorkflowRun]:
        stmt = (
            update(WorkflowRun)
            .where(WorkflowRun.id == workflow_run_id)
            .values(
                status=workflow_run_data.status, end_time=workflow_run_data.end_time
            )
            .returning(WorkflowRun)
        )
        result = await self.session.execute(stmt)
        db_workflow_run = result.scalars().first()

        return db_workflow_run

    async def delete_workflow_run(self, workflow_run_id: str) -> bool:
        stmt = delete(WorkflowRun).where(WorkflowRun.id == workflow_run_id)
        await self.session.execute(stmt)

        return True

    async def get_workflow_runs_for_user(
        self,
        user_id: str,
        agent_id: Optional[str] = None,
        workflow_id: Optional[str] = None,
        skip: int = 0,
        limit: int = 100,
    ) -> List[WorkflowRun]:
        from backend.app.models.agent import Agent

        # Get user agents
        user_agents_stmt = select(Agent.id).where(Agent.user_id == user_id)
        user_agent_ids = (await self.session.execute(user_agents_stmt)).scalars().all()

        base_stmt = select(WorkflowRun).where(WorkflowRun.agent_id.in_(user_agent_ids))

        if agent_id:
            # Verify agent belongs to user (agent_id should be in user_agent_ids, but double-check)
            if agent_id not in user_agent_ids:
                return []
            base_stmt = base_stmt.where(WorkflowRun.agent_id == agent_id)

        if workflow_id:
            # Verify workflow belongs to user by joining or separate query
            # For simplicity, assume if agent is checked, workflow is linked, but to be safe, we can add filter later
            base_stmt = base_stmt.where(WorkflowRun.workflow_id == workflow_id)

        stmt = base_stmt.offset(skip).limit(limit)

        result = await self.session.execute(stmt)
        return list(result.scalars().all())
