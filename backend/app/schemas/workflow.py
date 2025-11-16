from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field, field_validator


class WorkflowNode(BaseModel):
    id: str
    type: str
    data: Dict[str, Any]
    position: Dict[str, float]


class WorkflowEdge(BaseModel):
    id: str
    source: str
    target: str
    sourceHandle: Optional[str] = None
    targetHandle: Optional[str] = None


class WorkflowSchema(BaseModel):
    nodes: List[WorkflowNode]
    edges: List[WorkflowEdge]

    @field_validator("nodes")
    @classmethod
    def validate_nodes(cls, nodes):
        if not nodes:
            raise ValueError("Workflow must contain at least one node.")
        start_nodes = [node for node in nodes if node.type == "start"]
        if len(start_nodes) != 1:
            raise ValueError("Workflow must contain exactly one 'start' node.")
        end_nodes = [node for node in nodes if node.type == "end"]
        if not end_nodes:
            raise ValueError("Workflow must contain at least one 'end' node.")
        return nodes

    @field_validator("edges")
    @classmethod
    def validate_edges(cls, edges, values):
        nodes = values.get("nodes", [])
        node_ids = {node.id for node in nodes}

        for edge in edges:
            if edge.source not in node_ids:
                raise ValueError(
                    f"Edge source node '{edge.source}' not found in workflow nodes."
                )
            if edge.target not in node_ids:
                raise ValueError(
                    f"Edge target node '{edge.target}' not found in workflow nodes."
                )
        return edges


class WorkflowBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=256)
    description: Optional[str] = Field(None, max_length=1024)
    workflow_schema: WorkflowSchema
    knowledge_base_document_ids: Optional[List[str]] = Field(None)


class WorkflowCreate(WorkflowBase):
    pass


class WorkflowUpdate(WorkflowBase):
    name: Optional[str] = Field(None, min_length=1, max_length=256)
    workflow_schema: Optional[WorkflowSchema] = None


class WorkflowRead(WorkflowBase):
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
