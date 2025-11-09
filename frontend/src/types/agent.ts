export interface AgentBase {
  name: string;
  description?: string;
  persona?: string;
  initial_prompts?: string;
  workflow_schema?: Record<string, any>; // Using Record<string, any> for dict
  message_credits?: number;
}

export interface AgentCreate extends AgentBase {}

export interface AgentUpdate extends AgentBase {}

export interface AgentRead extends AgentBase {
  id: string;
  user_id: string;
  created_at: string; // datetime serialized as ISO string
  updated_at: string; // datetime serialized as ISO string
}

export interface TwilioCredentials {
  sid: string;
  auth_token: string;
  phone_number: string;
}
