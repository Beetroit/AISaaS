from typing import Any, Dict, List

from sqlalchemy import func, select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.models.agent import Agent
from backend.app.models.chat_session import ChatSession
from backend.app.models.message import Message
from backend.app.models.workflow import Workflow
from backend.app.models.workflow_run import WorkflowRun


class ReportService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_message_usage_stats(self, user_id: str) -> Dict[str, Any]:
        # Get agents owned by the user
        agents_stmt = select(Agent.id).where(Agent.user_id == user_id)

        # Get total messages sent by the user's agents (and users interacting with them)
        total_messages_stmt = (
            select(func.count(Message.id))
            .join(ChatSession, Message.chat_session_id == ChatSession.id)
            .where(ChatSession.agent_id.in_(agents_stmt))
        )
        total_messages = (
            await self.db.execute(total_messages_stmt)
        ).scalar_one_or_none() or 0

        # Get messages per agent
        messages_per_agent_stmt = (
            select(ChatSession.agent_id, func.count(Message.id))
            .join(ChatSession, Message.chat_session_id == ChatSession.id)
            .where(ChatSession.agent_id.in_(agents_stmt))
            .group_by(ChatSession.agent_id)
        )
        messages_per_agent_results = (
            await self.db.execute(messages_per_agent_stmt)
        ).all()

        messages_per_agent = {
            agent_id: count for agent_id, count in messages_per_agent_results
        }

        return {
            "total_messages": total_messages,
            "messages_per_agent": messages_per_agent,
            "messages_over_time": [],
        }

    async def get_sessions(
        self, user_id: str, skip: int = 0, limit: int = 20
    ) -> Dict[str, Any]:
        # Get agents owned by the user
        agents_stmt = select(Agent.id).where(Agent.user_id == user_id)

        # Main query for sessions
        stmt = (
            select(
                ChatSession,
                Agent.name.label("agent_name"),
                Workflow.name.label("workflow_name"),
                WorkflowRun.status.label("workflow_status"),
                WorkflowRun.id.label("workflow_run_id"),
                func.count(Message.id).label("message_count"),
                func.max(Message.created_at).label("last_message_at"),
            )
            .join(Agent, ChatSession.agent_id == Agent.id)
            .outerjoin(WorkflowRun, ChatSession.id == WorkflowRun.chat_session_id)
            .outerjoin(Workflow, WorkflowRun.workflow_id == Workflow.id)
            .outerjoin(Message, ChatSession.id == Message.chat_session_id)
            .where(ChatSession.agent_id.in_(agents_stmt))
            .group_by(
                ChatSession.id,
                Agent.name,
                Workflow.name,
                WorkflowRun.status,
                WorkflowRun.id,
            )
            .order_by(desc("last_message_at"))
            .offset(skip)
            .limit(limit)
        )

        results = (await self.db.execute(stmt)).all()

        sessions = []
        for row in results:
            session = row.ChatSession
            sessions.append(
                {
                    "chat_session_id": session.id,
                    "external_id": session.external_id,
                    "agent_name": row.agent_name,
                    "workflow_run_id": row.workflow_run_id,
                    "workflow_name": row.workflow_name,
                    "status": session.status,
                    "workflow_status": row.workflow_status,
                    "current_step": session.current_workflow_step,
                    "start_time": session.start_time.isoformat()
                    if session.start_time
                    else None,
                    "message_count": row.message_count,
                    "last_message_at": row.last_message_at.isoformat()
                    if row.last_message_at
                    else None,
                    "lead_id": session.lead_id,
                }
            )

        # Get total count for pagination
        count_stmt = select(func.count(ChatSession.id)).where(
            ChatSession.agent_id.in_(agents_stmt)
        )
        total_count = (await self.db.execute(count_stmt)).scalar_one_or_none() or 0

        return {
            "sessions": sessions,
            "total": total_count,
            "skip": skip,
            "limit": limit,
        }

    async def get_session_messages(
        self, session_id: str, user_id: str
    ) -> List[Dict[str, Any]]:
        # Verify ownership
        session_stmt = (
            select(ChatSession)
            .join(Agent, ChatSession.agent_id == Agent.id)
            .where(ChatSession.id == session_id, Agent.user_id == user_id)
        )
        session = (await self.db.execute(session_stmt)).scalar_one_or_none()

        if not session:
            return None

        # Get messages
        messages_stmt = (
            select(Message)
            .where(Message.chat_session_id == session_id)
            .order_by(Message.created_at)
        )
        messages = (await self.db.execute(messages_stmt)).scalars().all()

        return [message.to_dict() for message in messages]
