import { Edge, Node } from "reactflow";

export interface AgentWorkflowSchema {
    nodes: Node[];
    edges: Edge[];
}

export interface AgentBase {
    name: string;
    description?: string;
    persona?: string;
    initial_prompts?: string;
    workflow_schema?: AgentWorkflowSchema | null;
    message_credits?: number;
}

export type AgentCreate = AgentBase;

export interface AgentUpdate extends Partial<AgentBase> {
    name?: string;
}

export interface AgentRead extends AgentBase {
    id: string;
    user_id: string;
    created_at: string;
    updated_at: string;
}

export interface TwilioCredentials {
    sid: string;
    auth_token: string;
    phone_number: string;
}