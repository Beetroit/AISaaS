from typing import List, Optional

from fastapi import APIRouter, HTTPException, status

from backend.app.dependencies import (
    AgentWorkflowServiceDep,
    CurrentUser,
    WorkflowRunCRUDDep,
)
from backend.app.schemas.workflow_run import (
    WorkflowRunCreate,
    WorkflowRunRead,
    WorkflowRunUpdate,
)

router = APIRouter(prefix="/workflow-runs", tags=["workflow-runs"])


@router.post("/", response_model=WorkflowRunRead, status_code=status.HTTP_201_CREATED)
async def create_workflow_run_endpoint(
    workflow_run_data: WorkflowRunCreate,
    current_user: CurrentUser,
    workflow_run_crud: WorkflowRunCRUDDep,
    agent_workflow_service: AgentWorkflowServiceDep,
):
    """Create and initiate a new workflow run."""
    # Ensure the agent belongs to the current user (optional, but good practice)
    # This check might be more complex if agents can be shared.
    # For now, assuming agent_id in workflow_run_data belongs to current_user.
    workflow_run_data.user_id = current_user.id

    created_workflow_run = await workflow_run_crud.create_workflow_run(
        workflow_run_data=workflow_run_data
    )

    # Execute the workflow
    await agent_workflow_service.execute_workflow(
        workflow_run_id=created_workflow_run.id,
        user_message=workflow_run_data.initial_data.get(
            "user_message", "Workflow initiated manually."
        ),
    )

    return created_workflow_run


@router.get("/", response_model=List[WorkflowRunRead])
async def get_workflow_runs_list_endpoint(
    current_user: CurrentUser,
    agent_workflow_service: AgentWorkflowServiceDep,
    agent_id: Optional[str] = None,
    workflow_id: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
):
    """Retrieve a list of workflow runs for the current user, with optional filtering."""
    workflow_runs = await agent_workflow_service.get_workflow_runs(
        user_id=current_user.id,
        agent_id=agent_id,
        workflow_id=workflow_id,
        skip=skip,
        limit=limit,
    )
    return workflow_runs


@router.get("/{workflow_run_id}", response_model=WorkflowRunRead)
async def get_workflow_run_endpoint(
    workflow_run_id: str,
    current_user: CurrentUser,
    workflow_run_crud: WorkflowRunCRUDDep,
):
    """Retrieve a single workflow run by its ID."""
    workflow_run = await workflow_run_crud.get_workflow_run(
        workflow_run_id, user_id=current_user.id
    )
    if not workflow_run:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Workflow run not found"
        )
    # The authorization check is now handled within the CRUD method,
    # as get_workflow_run now filters by user_id.
    return workflow_run


@router.put("/{workflow_run_id}", response_model=WorkflowRunRead)
async def update_workflow_run_endpoint(
    workflow_run_id: str,
    workflow_run_data: WorkflowRunUpdate,
    current_user: CurrentUser,
    workflow_run_crud: WorkflowRunCRUDDep,
):
    """Update a workflow run."""
    # First, get the existing workflow run to ensure it exists and belongs to the user
    existing_run = await workflow_run_crud.get_workflow_run(
        workflow_run_id, user_id=current_user.id
    )
    if not existing_run:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Workflow run not found"
        )

    # Now, update it
    updated_run = await workflow_run_crud.update_workflow_run(
        workflow_run_id, workflow_run_data
    )
    if not updated_run:
        # This case should ideally not be reached if the above check passes
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workflow run could not be updated.",
        )
    return updated_run


@router.post("/start/{workflow_run_id}", response_model=WorkflowRunRead)
async def start_workflow_run_endpoint(
    workflow_run_id: str,
    current_user: CurrentUser,
    workflow_run_crud: WorkflowRunCRUDDep,
):
    """Start a workflow run by setting its status to 'in_progress'."""
    # First, get the existing workflow run to ensure it exists and belongs to the user
    existing_run = await workflow_run_crud.get_workflow_run(
        workflow_run_id, user_id=current_user.id
    )
    if not existing_run:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Workflow run not found"
        )

    # Update status to in_progress
    update_data = WorkflowRunUpdate(status="in_progress")
    updated_run = await workflow_run_crud.update_workflow_run(
        workflow_run_id, update_data
    )

    if not updated_run:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to start workflow run.",
        )

    return updated_run
