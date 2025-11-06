from typing import List

from fastapi import APIRouter, Depends, HTTPException, status

from backend.app.dependencies import (
    get_current_user,
    AgentCRUDDep,
    CredentialServiceDep,
)
from backend.app.models.user import User
from backend.app.schemas.agent import (
    AgentCreate,
    AgentRead,
    AgentUpdate,
    TwilioCredentials,
)


router = APIRouter(prefix="/agents", tags=["agents"])


@router.post("/", response_model=AgentRead, status_code=status.HTTP_201_CREATED)
async def create_agent_endpoint(
    agent: AgentCreate,
    agent_crud: AgentCRUDDep,
    current_user: User = Depends(get_current_user),
):
    return await agent_crud.create_agent(agent=agent, user_id=current_user.id)


@router.get("/{agent_id}", response_model=AgentRead)
async def get_agent_endpoint(
    agent_id: str,
    agent_crud: AgentCRUDDep,
    current_user: User = Depends(get_current_user),
):
    db_agent = await agent_crud.get_agent(agent_id=agent_id, user_id=current_user.id)
    if db_agent is None:
        raise HTTPException(status_code=404, detail="Agent not found")
    return db_agent


@router.get("/{agent_id}/credits", response_model=int)
async def get_agent_credits_endpoint(
    agent_id: str,
    agent_crud: AgentCRUDDep,
    current_user: User = Depends(get_current_user),
):
    db_agent = await agent_crud.get_agent(agent_id=agent_id, user_id=current_user.id)
    if db_agent is None:
        raise HTTPException(status_code=404, detail="Agent not found")
    return db_agent.message_credits


@router.post("/{agent_id}/credits/add", response_model=AgentRead)
async def add_agent_credits_endpoint(
    agent_id: str,
    amount: int,
    agent_crud: AgentCRUDDep,
    current_user: User = Depends(get_current_user),
):
    db_agent = await agent_crud.add_agent_credits(
        agent_id=agent_id, user_id=current_user.id, amount=amount
    )
    if db_agent is None:
        raise HTTPException(status_code=404, detail="Agent not found")
    return db_agent


@router.get("/", response_model=List[AgentRead])
async def get_agents_endpoint(
    agent_crud: AgentCRUDDep,
    current_user: User = Depends(get_current_user),
    skip: int = 0,
    limit: int = 100,
):
    return await agent_crud.get_agents(user_id=current_user.id, skip=skip, limit=limit)


@router.put("/{agent_id}", response_model=AgentRead)
async def update_agent_endpoint(
    agent_id: str,
    agent: AgentUpdate,
    agent_crud: AgentCRUDDep,
    current_user: User = Depends(get_current_user),
):
    db_agent = await agent_crud.update_agent(
        agent_id=agent_id, agent=agent, user_id=current_user.id
    )
    if db_agent is None:
        raise HTTPException(status_code=404, detail="Agent not found")
    return db_agent


@router.delete("/{agent_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_agent_endpoint(
    agent_id: str,
    agent_crud: AgentCRUDDep,
    current_user: User = Depends(get_current_user),
):
    success = await agent_crud.delete_agent(agent_id=agent_id, user_id=current_user.id)
    if not success:
        raise HTTPException(status_code=404, detail="Agent not found")
    return {"message": "Agent deleted successfully"}


@router.post("/{agent_id}/twilio-credentials", response_model=AgentRead)
async def save_twilio_credentials_endpoint(
    agent_id: str,
    twilio_credentials: TwilioCredentials,
    agent_crud: AgentCRUDDep,
    credential_service: CredentialServiceDep,
    current_user: User = Depends(get_current_user),
):
    db_agent = await agent_crud.get_agent(agent_id=agent_id, user_id=current_user.id)
    if db_agent is None:
        raise HTTPException(status_code=404, detail="Agent not found")

    # Save Twilio credentials using the CredentialService
    await credential_service.create_credential(
        user_id=current_user.id,
        credential_type=f"twilio_credentials_{agent_id}",  # Unique type per agent
        data=twilio_credentials.model_dump(),
    )

    return db_agent


@router.post("/{agent_id}/lead-webhook", response_model=str)
async def generate_lead_webhook_url_endpoint(
    agent_id: str,
    agent_crud: AgentCRUDDep,
    current_user: User = Depends(get_current_user),
):
    db_agent = await agent_crud.get_agent(agent_id=agent_id, user_id=current_user.id)
    if db_agent is None:
        raise HTTPException(status_code=404, detail="Agent not found")

    # For now, the client_id for the webhook will be the agent_id itself.
    # In a more complex system, you might generate a separate, more obscure ID.
    webhook_url = f"/webhooks/lead/{agent_id}"
    return webhook_url


@router.get("/{agent_id}/lead-webhook", response_model=str)
async def get_lead_webhook_url_endpoint(
    agent_id: str,
    agent_crud: AgentCRUDDep,
    current_user: User = Depends(get_current_user),
):
    db_agent = await agent_crud.get_agent(agent_id=agent_id, user_id=current_user.id)
    if db_agent is None:
        raise HTTPException(status_code=404, detail="Agent not found")

    webhook_url = f"/webhooks/lead/{agent_id}"
    return webhook_url
