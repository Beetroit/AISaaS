from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from starlette.responses import Response

from backend.app.dependencies import CurrentUser, LeadCRUDDep
from backend.app.models.user import User
from backend.app.schemas.lead import LeadCreate, LeadRead, LeadUpdate

router = APIRouter(prefix="/leads", tags=["leads"])


@router.post("/", response_model=LeadRead, status_code=status.HTTP_201_CREATED)
async def create_lead_endpoint(
    lead: LeadCreate,
    lead_crud: LeadCRUDDep,
    current_user: User = Depends(CurrentUser),
):
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Lead creation via this endpoint requires agent_id and chat_session_id context.",
    )


@router.get("/", response_model=List[LeadRead])
async def get_leads_endpoint(
    lead_crud: LeadCRUDDep,
    current_user: User = Depends(CurrentUser),
    skip: int = 0,
    limit: int = 100,
):
    return await lead_crud.get_leads_by_user_id(
        user_id=current_user.id, skip=skip, limit=limit
    )


@router.get("/{lead_id}", response_model=LeadRead)
async def get_lead_endpoint(
    lead_id: str,
    lead_crud: LeadCRUDDep,
    current_user: User = Depends(CurrentUser),
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
    current_user: User = Depends(CurrentUser),
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
    current_user: User = Depends(CurrentUser),
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
