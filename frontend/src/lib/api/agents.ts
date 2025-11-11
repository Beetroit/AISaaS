import { callApi } from "./core";
import { AgentCreate, AgentRead, AgentUpdate, TwilioCredentials } from "../../types/agent";
import { LeadMappingConfig } from "../../types/lead"; // Import LeadMappingConfig

export async function createAgent(agent: AgentCreate): Promise<AgentRead> {
  return callApi<AgentRead>("/agents/", {
    method: "POST",
    body: agent,
  });
}

export async function getAgent(agentId: string): Promise<AgentRead> {
  return callApi<AgentRead>(`/agents/${agentId}`);
}

export async function getAgentCredits(agentId: string): Promise<number> {
  return callApi<number>(`/agents/${agentId}/credits`);
}

export async function addAgentCredits(agentId: string, amount: number): Promise<AgentRead> {
  return callApi<AgentRead>(`/agents/${agentId}/credits/add?amount=${amount}`, {
    method: "POST",
  });
}

export async function getAgents(skip: number = 0, limit: number = 100): Promise<AgentRead[]> {
  return callApi<AgentRead[]>(`/agents/?skip=${skip}&limit=${limit}`);
}

export async function updateAgent(agentId: string, agent: AgentUpdate): Promise<AgentRead> {
  return callApi<AgentRead>(`/agents/${agentId}`, {
    method: "PUT",
    body: agent,
  });
}

export async function deleteAgent(agentId: string): Promise<void> {
  return callApi<void>(`/agents/${agentId}`, {
    method: "DELETE",
  });
}

export async function saveTwilioCredentials(
  agentId: string,
  credentials: TwilioCredentials
): Promise<AgentRead> {
  return callApi<AgentRead>(`/agents/${agentId}/twilio-credentials`, {
    method: "POST",
    body: credentials,
  });
}

export async function getLeadWebhookUrl(agentId: string): Promise<string> {
  return callApi<string>(`/agents/${agentId}/lead-webhook`);
}

export async function getLeadMapping(agentId: string): Promise<LeadMappingConfig> {
  return callApi<LeadMappingConfig>(`/agents/${agentId}/lead-mapping`);
}

export async function saveLeadMapping(
  agentId: string,
  config: LeadMappingConfig
): Promise<LeadMappingConfig> {
  return callApi<LeadMappingConfig>(`/agents/${agentId}/lead-mapping`, {
    method: "POST",
    body: config,
  });
}
