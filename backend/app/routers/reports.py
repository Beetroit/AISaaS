from typing import Any, Dict

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.dependencies import CurrentUser, get_db_session, MessageCRUDDep
from backend.app.models.chat_session import ChatSession
from backend.app.models.message import Message


router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("/message-usage", response_model=Dict[str, Any])
async def get_message_usage_report(
    current_user: CurrentUser,
    message_crud: MessageCRUDDep,
    db: AsyncSession = Depends(get_db_session),
):
    # Get total messages sent by the user (across all agents)
    total_messages_stmt = (
        select(func.count(Message.id))
        .join(ChatSession, Message.chat_session_id == ChatSession.id)
        .where(ChatSession.user_id == current_user.id)
    )
    total_messages = (await db.execute(total_messages_stmt)).scalar_one_or_none() or 0

    # Get messages per agent
    messages_per_agent_stmt = (
        select(ChatSession.agent_id, func.count(Message.id))
        .join(ChatSession, Message.chat_session_id == ChatSession.id)
        .where(ChatSession.user_id == current_user.id)
        .group_by(ChatSession.agent_id)
    )
    messages_per_agent_results = (await db.execute(messages_per_agent_stmt)).all()

    messages_per_agent = {
        agent_id: count for agent_id, count in messages_per_agent_results
    }

    # Get messages over time (e.g., daily count for the last 30 days)
    messages_over_time_stmt = (
        select(func.date(Message.created_at), func.count(Message.id))
        .join(ChatSession, Message.chat_session_id == ChatSession.id)
        .where(
            ChatSession.user_id == current_user.id,
            Message.created_at
            >= func.now() - func.cast("30 days", type_=func.interval),
        )
        .group_by(func.date(Message.created_at))
        .order_by(func.date(Message.created_at))
    )
    messages_over_time_results = (await db.execute(messages_over_time_stmt)).all()

    messages_over_time = [
        {"date": date.isoformat(), "count": count}
        for date, count in messages_over_time_results
    ]

    return {
        "total_messages": total_messages,
        "messages_per_agent": messages_per_agent,
        "messages_over_time": messages_over_time,
    }
