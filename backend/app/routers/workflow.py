from fastapi import APIRouter

from backend.app.services.workflow_actions.factory import ActionFactory

router = APIRouter(prefix="/workflows", tags=["workflows"])


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
