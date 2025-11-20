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


@router.post(
    "/{workflow_run_id}/start",
    response_model=WorkflowRunRead,
    status_code=status.HTTP_200_OK,
)
async def start_workflow_run_endpoint(
    workflow_run_id: str,
    current_user: CurrentUser,
    workflow_run_crud: WorkflowRunCRUDDep,
):
    """
    Set the status of a workflow run to 'in_progress'.
    This allows a dormant run to become active and handle incoming webhooks.
    """
    workflow_run = await workflow_run_crud.get_workflow_run(
        workflow_run_id, user_id=current_user.id
    )
    if not workflow_run:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Workflow run not found"
        )

    # Ensure the workflow run is owned by the current user
    if workflow_run.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to modify this workflow run",
        )

    # Update the status field
    from backend.app.schemas.enums import WorkflowRunStatus

    update_data = WorkflowRunUpdate(status=WorkflowRunStatus.IN_PROGRESS)
    updated_run = await workflow_run_crud.update_workflow_run(
        workflow_run_id, update_data
    )

    return updated_run


@router.post(
    "/{workflow_run_id}/set-default",
    response_model=WorkflowRunRead,
    status_code=status.HTTP_200_OK,
)
async def set_default_workflow_run_endpoint(
    workflow_run_id: str,
    current_user: CurrentUser,
    workflow_run_crud: WorkflowRunCRUDDep,
):
    """
    Mark this workflow run as the default template for its agent.
    When new chat sessions start, they will clone this run's configuration.
    Only one template is allowed per agent - setting a new one clears the old one.
    """
    workflow_run = await workflow_run_crud.get_workflow_run(
        workflow_run_id, user_id=current_user.id
    )
    if not workflow_run:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Workflow run not found"
        )

    # Ensure the workflow run is owned by the current user
    if workflow_run.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to modify this workflow run",
        )

    # Clear any existing template for this agent
    from sqlalchemy import update
    from backend.app.models.workflow_run import WorkflowRun

    # Get the session from the crud
    db_session = workflow_run_crud.session

    # Clear all other templates for this agent
    stmt = (
        update(WorkflowRun)
        .where(
            WorkflowRun.agent_id == workflow_run.agent_id,
            WorkflowRun.user_id == current_user.id,
            WorkflowRun.is_template,
        )
        .values(is_template=False)
    )
    await db_session.execute(stmt)

    # Set this run as the template
    workflow_run.is_template = True
    db_session.add(workflow_run)
    await db_session.flush()
    await db_session.refresh(workflow_run)

    return workflow_run


@router.post("/bulk-delete", status_code=status.HTTP_200_OK)
async def bulk_delete_workflow_runs_endpoint(
    workflow_run_ids: List[str],
    current_user: CurrentUser,
    workflow_run_crud: WorkflowRunCRUDDep,
):
    """Delete multiple workflow runs. Only deletes runs owned by current user."""
    # Verify all runs belong to current user
    for run_id in workflow_run_ids:
        run = await workflow_run_crud.get_workflow_run(run_id, user_id=current_user.id)
        if not run:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Workflow run {run_id} not found or not owned by user",
            )

    # Delete all runs
    deleted_count = await workflow_run_crud.delete_workflow_runs_bulk(workflow_run_ids)

    return {"deleted_count": deleted_count, "deleted_ids": workflow_run_ids}
