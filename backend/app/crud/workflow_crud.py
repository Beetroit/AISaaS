from typing import List, Optional

from sqlalchemy import delete, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from backend.app.models.workflow import Workflow
from backend.app.schemas.workflow import WorkflowCreate, WorkflowUpdate


class WorkflowCRUD:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create_workflow(
        self, workflow_data: WorkflowCreate, user_id: str
    ) -> Workflow:
        db_workflow = Workflow(
            name=workflow_data.name,
            description=workflow_data.description,
            user_id=user_id,
            workflow_schema=workflow_data.workflow_schema.model_dump(mode="json"),
            knowledge_base_document_ids=workflow_data.knowledge_base_document_ids or [],
        )
        self.session.add(db_workflow)

        await self.session.flush()
        return db_workflow

    async def get_workflow(self, workflow_id: str, user_id: str) -> Optional[Workflow]:
        result = await self.session.execute(
            select(Workflow).where(
                Workflow.id == workflow_id, Workflow.user_id == user_id
            )
        )
        return result.scalars().first()

    async def get_workflows_by_user(self, user_id: str) -> List[Workflow]:
        result = await self.session.execute(
            select(Workflow).where(Workflow.user_id == user_id)
        )
        return list(result.scalars().all())

    async def update_workflow(
        self, workflow_id: str, workflow_data: WorkflowUpdate
    ) -> Optional[Workflow]:
        stmt = (
            update(Workflow)
            .where(Workflow.id == workflow_id)
            .values(
                name=workflow_data.name,
                description=workflow_data.description,
                workflow_schema=workflow_data.workflow_schema.model_dump(mode="json")
                if workflow_data.workflow_schema
                else None,
                knowledge_base_document_ids=workflow_data.knowledge_base_document_ids,
            )
            .returning(Workflow)
        )
        result = await self.session.execute(stmt)
        db_workflow = result.scalars().first()

        return db_workflow

    async def delete_workflow(self, workflow_id: str) -> bool:
        stmt = delete(Workflow).where(Workflow.id == workflow_id)
        await self.session.execute(stmt)

        return True
