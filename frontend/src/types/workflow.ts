import { Edge, Node } from "reactflow";

export interface NodeType {
    type: string;
    name: string;
    description: string;
    inputs: Record<string, string>;
    outputs: Record<string, string>;
}

export interface WorkflowNode extends Node {
    id: string;
    type: string;
    data: Record<string, unknown>;
    position: { x: number; y: number };
}

export type WorkflowEdge = Edge & {
    id: string;
    source: string;
    target: string;
    sourceHandle?: string;
    targetHandle?: string;
}

export interface WorkflowSchema {
    nodes: WorkflowNode[];
    edges: WorkflowEdge[];
}

export interface WorkflowBase {
    name: string;
    description?: string;
    workflow_schema: WorkflowSchema;
    knowledge_base_document_ids?: string[];
}

 
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface WorkflowCreate extends WorkflowBase {}

export interface WorkflowUpdate extends Partial<WorkflowBase> {
    name?: string;
    workflow_schema?: WorkflowSchema;
}

export interface Workflow extends WorkflowBase {
    id: string;
    user_id: string;
    created_at: string;
    updated_at: string;
}

export interface WorkflowRunBase {
    agent_id: string;
    workflow_id: string;
    chat_session_id?: string;
    lead_id?: string;
    credential_id?: string;
    status: string;
    initial_data: Record<string, unknown>;
}

 
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface WorkflowRunCreate extends WorkflowRunBase {}

export interface WorkflowRunUpdate extends Partial<WorkflowRunBase> {
    status?: string;
    end_time?: string; // datetime string
}

export interface WorkflowRun extends WorkflowRunBase {
    id: string;
    created_at: string;
    updated_at: string;
    end_time?: string;
}
