export type JsonPrimitive = string | number | boolean | null;
export type JsonArray = JsonValue[];
export type JsonObject = { [key: string]: JsonValue };
export type JsonValue = JsonPrimitive | JsonArray | JsonObject;

export interface AgentBase {
  name: string;
  description?: string;
  persona?: string;
  initial_prompts?: string;
  workflow_schema?: Record<string, JsonValue>
  message_credits?: number;
}

export interface AgentCreate extends AgentBase {
  _?: never
}

export interface AgentUpdate extends AgentBase {
  _?: never
}

export interface AgentRead extends AgentBase {
  id: string;
  user_id: string;
  created_at: string
  updated_at: string
}

export interface TwilioCredentials {
  sid: string;
  auth_token: string;
  phone_number: string;
}
