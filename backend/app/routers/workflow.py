from typing import List

from fastapi import APIRouter, HTTPException, status

from backend.app.dependencies import (
    AgentWorkflowServiceDep,
    CurrentUser,
    DBSession,
    WorkflowCRUDDep,
    WorkflowRunCRUDDep,
)
from backend.app.schemas.workflow import WorkflowCreate, WorkflowRead
from backend.app.schemas.workflow_run import WorkflowRunCreate, WorkflowRunRead
from backend.app.services.workflow_actions.factory import ActionFactory

router = APIRouter(prefix="/workflows", tags=["workflows"])


@router.post("/", response_model=WorkflowRead, status_code=status.HTTP_201_CREATED)
async def create_workflow_endpoint(
    workflow_data: WorkflowCreate,
    current_user: CurrentUser,
    workflow_crud: WorkflowCRUDDep,
    db: DBSession,
):
    """Create a new workflow."""
    created_workflow = await workflow_crud.create_workflow(
        workflow_data=workflow_data, user_id=current_user.id
    )
    return created_workflow


@router.get("/node-types")
async def get_node_types_endpoint():
    """Get available workflow node types for the workflow editor - Uses ActionFactory for dynamic discovery."""
    all_nodes = []

    # Get ActionFactory core workflow actions
    try:
        action_classes = ActionFactory.get_all_actions()
        for action_class in action_classes.values():
            action_instance = action_class()
            schema = action_instance.get_schema()
            # Convert ActionFactory schema format to match expected frontend format
            all_nodes.append(
                {
                    "type": schema["type"],
                    "name": schema["name"],
                    "description": schema["description"],
                    "inputs": schema["inputs"],
                    "outputs": schema["outputs"],
                }
            )
    except Exception as e:
        print(f"Warning: Could not load ActionFactory actions: {e}")

    return all_nodes


@router.get("/", response_model=List[WorkflowRead])
async def get_workflows_endpoint(
    current_user: CurrentUser,
    workflow_crud: WorkflowCRUDDep,
):
    """Retrieve all workflows for the current user."""
    workflows = await workflow_crud.get_workflows_by_user(user_id=current_user.id)
    return workflows


@router.get("/{workflow_id}", response_model=WorkflowRead)
async def get_workflow_endpoint(
    workflow_id: str,
    current_user: CurrentUser,
    workflow_crud: WorkflowCRUDDep,
):
    """Retrieve a single workflow by its ID."""
    workflow = await workflow_crud.get_workflow(
        workflow_id=workflow_id, user_id=current_user.id
    )
    if not workflow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Workflow not found"
        )
    return workflow


@router.post(
    "/runs", response_model=WorkflowRunRead, status_code=status.HTTP_201_CREATED
)
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

    created_workflow_run = await workflow_run_crud.create_workflow_run(
        workflow_run_data=workflow_run_data, user_id=current_user.id
    )

    # Execute the workflow
    await agent_workflow_service.execute_workflow(
        workflow_run_id=created_workflow_run.id,
        user_message=workflow_run_data.initial_data.get(
            "user_message", "Workflow initiated manually."
        ),
    )

    return created_workflow_run


@router.get("/runs/{workflow_run_id}", response_model=WorkflowRunRead)
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
