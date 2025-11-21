from typing import Any, Dict, List

from fastapi import APIRouter, HTTPException

from backend.app.dependencies import CurrentUser, ReportServiceDep


router = APIRouter(tags=["reports"])


@router.get("/message-usage", response_model=Dict[str, Any])
async def get_message_usage_report(
    current_user: CurrentUser,
    report_service: ReportServiceDep,
):
    return await report_service.get_message_usage_stats(user_id=current_user.id)


@router.get("/sessions", response_model=Dict[str, Any])
async def get_sessions_report(
    current_user: CurrentUser,
    report_service: ReportServiceDep,
    skip: int = 0,
    limit: int = 20,
):
    """
    Get a list of chat sessions for agents owned by the current user.
    Includes workflow context, message counts, and last activity.
    """
    return await report_service.get_sessions(
        user_id=current_user.id, skip=skip, limit=limit
    )


@router.get("/sessions/{session_id}/messages", response_model=List[Dict[str, Any]])
async def get_session_messages(
    session_id: str,
    current_user: CurrentUser,
    report_service: ReportServiceDep,
):
    """
    Get all messages for a specific chat session.
    Verifies that the session belongs to an agent owned by the current user.
    """
    messages = await report_service.get_session_messages(
        session_id=session_id, user_id=current_user.id
    )

    if messages is None:
        raise HTTPException(
            status_code=404, detail="Session not found or access denied"
        )

    return messages
