from typing import Any, Dict, List

from fastapi import APIRouter
from backend.app.services.workflow_actions.factory import ActionFactory

router = APIRouter(prefix="/workflow", tags=["workflow"])


@router.get("/node-types", response_model=List[Dict[str, Any]])
async def get_node_types():
    """
    Returns a list of all available workflow node types, including their
    names, descriptions, and I/O signatures. This endpoint is used by the
    frontend to build the workflow editor UI.
    """
    actions = ActionFactory.get_all_actions()
    return [action.get_schema() for action in actions.values()]
