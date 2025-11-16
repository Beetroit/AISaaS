import { AgentCreate, AgentRead, AgentUpdate } from "../../types/agent";
import { callApi } from "./core";

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
