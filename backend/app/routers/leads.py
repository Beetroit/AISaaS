from typing import List

from fastapi import APIRouter, HTTPException, status
from starlette.responses import Response

from backend.app.dependencies import CurrentUser, LeadCRUDDep
from backend.app.schemas.lead import LeadCreate, LeadRead, LeadUpdate
from backend.app.config import logger

router = APIRouter(prefix="/leads", tags=["leads"])


@router.post("/", response_model=LeadRead, status_code=status.HTTP_201_CREATED)
async def create_lead_endpoint(
    lead: LeadCreate,
    lead_crud: LeadCRUDDep,
    current_user: CurrentUser,
):
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Lead creation via this endpoint requires agent_id and chat_session_id context.",
    )


@router.get("/", response_model=List[LeadRead])
async def get_leads_endpoint(
    lead_crud: LeadCRUDDep,
    current_user: CurrentUser,
    skip: int = 0,
    limit: int = 100,
):
    # Get all agent IDs owned by the current user
    agent_ids = [agent.id for agent in current_user.agents]
    logger.info(f"Fetching leads for user {current_user.id}, agent_ids: {agent_ids}")

    # Return leads collected by those agents
    leads = await lead_crud.get_leads_by_agent_ids(
        agent_ids=agent_ids, skip=skip, limit=limit
    )
    logger.info(f"Found {len(leads)} leads")
    return leads


@router.get("/{lead_id}", response_model=LeadRead)
async def get_lead_endpoint(
    lead_id: str,
    lead_crud: LeadCRUDDep,
    current_user: CurrentUser,
):
    db_lead = await lead_crud.get_lead(lead_id=lead_id)
    if db_lead is None:
        raise HTTPException(status_code=404, detail="Lead not found")
    if db_lead.user_id != current_user.id:
        raise HTTPException(
            status_code=403, detail="Not authorized to access this lead"
        )
    return db_lead


@router.put("/{lead_id}", response_model=LeadRead)
async def update_lead_endpoint(
    lead_id: str,
    lead: LeadUpdate,
    lead_crud: LeadCRUDDep,
    current_user: CurrentUser,
):
    db_lead = await lead_crud.get_lead(lead_id=lead_id)
    if db_lead is None:
        raise HTTPException(status_code=404, detail="Lead not found")
    if db_lead.user_id != current_user.id:
        raise HTTPException(
            status_code=403, detail="Not authorized to update this lead"
        )

    updated_lead = await lead_crud.update_lead(lead_id=lead_id, lead=lead)
    if updated_lead is None:
        raise HTTPException(status_code=500, detail="Failed to update lead")
    return updated_lead


@router.delete("/{lead_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_lead_endpoint(
    lead_id: str,
    lead_crud: LeadCRUDDep,
    current_user: CurrentUser,
):
    db_lead = await lead_crud.get_lead(lead_id=lead_id)
    if db_lead is None:
        raise HTTPException(status_code=404, detail="Lead not found")
    if db_lead.user_id != current_user.id:
        raise HTTPException(
            status_code=403, detail="Not authorized to delete this lead"
        )

    success = await lead_crud.delete_lead(lead_id=lead_id)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to delete lead")
    return Response(status_code=status.HTTP_204_NO_CONTENT)
