
import { WorkflowSchema } from "./workflow";

export interface AgentBase {
    name: string;
    description?: string;
    persona?: string;
    initial_prompts?: string;
    message_credits?: number;
    workflow_ids?: string[];
}

export type AgentCreate = AgentBase;

export interface AgentUpdate extends Partial<AgentBase> {
    name?: string;
    workflow_schema?: WorkflowSchema;
}

export interface AgentRead extends AgentBase {
    id: string;
    user_id: string;
    created_at: string;
    updated_at: string;
    workflow_schema: WorkflowSchema;
}

export type AgentWorkflowSchema = WorkflowSchema;

export interface TwilioCredentials extends Record<string, unknown> {
    twilio_account_sid: string;
    twilio_auth_token: string;
    twilio_phone_number: string;
}
