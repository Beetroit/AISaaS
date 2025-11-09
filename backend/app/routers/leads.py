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
    # Note: chat_session_id and agent_id would typically come from the context
    # where the lead is created (e.g., a webhook or an agent interaction).
    # For a direct API call, these might need to be provided or derived.
    # For simplicity here, we'll use placeholders or assume they are part of LeadCreate
    # if the frontend is creating a lead directly.
    # However, the backend LeadCreate schema does not include agent_id or chat_session_id.
    # The CRUD method requires them. This needs to be reconciled.
    # For now, let's assume a simplified create that might be used internally or
    # that these fields are passed in a way that the CRUD can handle.
    # Given the current LeadCreate schema, we cannot directly pass agent_id and chat_session_id.
    # Let's adjust the create_lead_endpoint to reflect the current schema and CRUD.
    # The CRUD's create_lead expects user_id, agent_id, chat_session_id.
    # The LeadCreate schema only has email, phone, name, source, qualification_status, contact_info.
    # This means a direct POST to /leads/ from frontend would need to provide these.
    # For now, I will make a simplified version that might need adjustment.

    # Reconciling: The LeadCreate schema does not contain agent_id or chat_session_id.
    # The LeadCRUD.create_lead method *requires* them.
    # This implies that leads are not typically created directly via this endpoint
    # without an associated agent/chat_session context.
    # For the purpose of exposing a basic CRUD, I will temporarily make agent_id and chat_session_id
    # optional in the endpoint, but this is a design inconsistency that should be noted.
    # A better approach would be to have a LeadCreateWithContext schema.

    # For now, let's assume agent_id and chat_session_id are passed as query parameters or
    # are part of a more complex LeadCreate schema if the frontend is to create them.
    # Given the current backend structure, direct creation via this endpoint is tricky.
    # I will implement GET, PUT, DELETE first, as they are clearer.
    # For POST, I will raise an HTTPException for now, indicating it needs context.
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
    # Filter leads by current user's ID
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
