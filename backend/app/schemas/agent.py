from datetime import datetime
from typing import Any, Dict, Optional

from pydantic import BaseModel, field_validator
from backend.app.services.workflow_actions.factory import ActionFactory


# Helper function to validate a single edge
def validate_edge(
    edge: Dict[str, Any], nodes: Dict[str, Any], action_factory: ActionFactory
):
    source_id = edge.get("source")
    target_id = edge.get("target")
    source_handle = edge.get("sourceHandle")
    target_handle = edge.get("targetHandle")

    if not all([source_id, target_id, source_handle, target_handle]):
        raise ValueError(f"Edge {edge.get('id', '')} is missing required fields.")

    # Type checker validation
    if not source_id or not target_id or not source_handle or not target_handle:
        raise ValueError("Edge handles and node IDs cannot be None.")

    source_node = nodes.get(source_id)
    target_node = nodes.get(target_id)

    if not source_node or not target_node:
        raise ValueError(f"Edge {edge.get('id', '')} connects to a non-existent node.")

    source_action = action_factory.get_action(source_node["type"])
    target_action = action_factory.get_action(target_node["type"])

    source_output_type = source_action.outputs.get(source_handle)
    target_input_type = target_action.inputs.get(target_handle)

    if source_output_type is None:
        raise ValueError(
            f"Source handle '{source_handle}' not found on node '{source_id}'."
        )

    if target_input_type is None:
        raise ValueError(
            f"Target handle '{target_handle}' not found on node '{target_id}'."
        )

    # Basic type checking: 'any' can connect to anything.
    if (
        "any" not in [source_output_type, target_input_type]
        and source_output_type != target_input_type
    ):
        raise ValueError(
            f"Type mismatch on edge {edge.get('id', '')}: "
            f"Cannot connect '{source_output_type}' to '{target_input_type}'."
        )


class AgentBase(BaseModel):
    name: str
    description: Optional[str] = None
    persona: Optional[str] = None
    initial_prompts: Optional[str] = None
    workflow_schema: Optional[Dict[str, Any]] = None
    message_credits: Optional[int] = 0

    @field_validator("workflow_schema")
    def validate_workflow_schema(
        cls, v: Optional[Dict[str, Any]]
    ) -> Optional[Dict[str, Any]]:
        if v is None:
            return v

        nodes_list = v.get("nodes")
        edges_list = v.get("edges")

        if not isinstance(nodes_list, list) or not isinstance(edges_list, list):
            raise ValueError("Workflow schema must contain 'nodes' and 'edges' lists.")

        nodes = {node["id"]: node for node in nodes_list}

        # Validate Start and End nodes
        start_nodes = [n for n in nodes_list if n.get("type") == "start"]
        end_nodes = [n for n in nodes_list if n.get("type") == "end"]

        if len(start_nodes) != 1:
            raise ValueError("Workflow must have exactly one start node.")
        if len(end_nodes) == 0:
            raise ValueError("Workflow must have at least one end node.")

        # Validate all edges
        action_factory = ActionFactory()
        for edge in edges_list:
            try:
                validate_edge(edge, nodes, action_factory)
            except (ValueError, KeyError) as e:
                raise ValueError(f"Edge validation failed: {e}") from e

        # TODO: Add validation for orphaned nodes (nodes not connected to any edge)

        return v


class AgentCreate(AgentBase):
    pass


class AgentUpdate(AgentBase):
    name: Optional[str] = None  # Make all fields optional for update


class AgentRead(AgentBase):
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TwilioCredentials(BaseModel):
    sid: str
    auth_token: str
    phone_number: str
