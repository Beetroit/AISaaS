from fastapi import APIRouter, Depends

from backend.app.crud.node_type_crud import NodeTypeCRUD
from backend.app.dependencies import DBSession, get_node_type_crud
from backend.app.services.workflow_actions.factory import ActionFactory

router = APIRouter(prefix="/workflows", tags=["workflows"])


@router.get("/node-types")
async def get_node_types_endpoint(
    db_session: DBSession,
    node_type_crud: NodeTypeCRUD = Depends(get_node_type_crud),
):
    """Get available workflow node types for the workflow editor - Combines ActionFactory and database nodes."""
    all_nodes = []

    # Get ActionFactory core workflow actions
    try:
        action_classes = ActionFactory.get_all_actions()
        for action_class in action_classes.values():
            action_instance = action_class()
            schema = action_instance.get_schema()
            # Convert ActionFactory schema format to match database format
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

    # Get database business nodes
    try:
        async with db_session as session:
            database_nodes = await node_type_crud.get_all_node_types(session)
            all_nodes.extend(database_nodes)
    except Exception as e:
        print(f"Warning: Could not load database nodes: {e}")

    return all_nodes
