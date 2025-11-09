import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createAgent,
  getAgent,
  getAgentCredits,
  addAgentCredits,
  getAgents,
  updateAgent,
  deleteAgent,
  saveTwilioCredentials,
  getLeadWebhookUrl,
} from "../lib/api/agents";
import { AgentCreate, AgentRead, AgentUpdate, TwilioCredentials } from "../types/agent";

// --- Queries ---

export function useAgents(skip: number = 0, limit: number = 100) {
  return useQuery<AgentRead[], Error>({
    queryKey: ["agents", { skip, limit }],
    queryFn: () => getAgents(skip, limit),
  });
}

export function useAgent(agentId: string) {
  return useQuery<AgentRead, Error>({
    queryKey: ["agent", agentId],
    queryFn: () => getAgent(agentId),
    enabled: !!agentId, // Only run query if agentId is available
  });
}

export function useAgentCredits(agentId: string) {
  return useQuery<number, Error>({
    queryKey: ["agentCredits", agentId],
    queryFn: () => getAgentCredits(agentId),
    enabled: !!agentId,
  });
}

export function useLeadWebhookUrl(agentId: string) {
  return useQuery<string, Error>({
    queryKey: ["leadWebhookUrl", agentId],
    queryFn: () => getLeadWebhookUrl(agentId),
    enabled: !!agentId,
  });
}

// --- Mutations ---

export function useCreateAgent() {
  const queryClient = useQueryClient();
  return useMutation<AgentRead, Error, AgentCreate>({
    mutationFn: (agent: AgentCreate) => createAgent(agent),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agents"] }); // Invalidate all agents list
    },
  });
}

export function useUpdateAgent() {
  const queryClient = useQueryClient();
  return useMutation<AgentRead, Error, { agentId: string; agent: AgentUpdate }>({
    mutationFn: ({ agentId, agent }) => updateAgent(agentId, agent),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["agents"] }); // Invalidate all agents list
      queryClient.invalidateQueries({ queryKey: ["agent", data.id] }); // Invalidate specific agent
    },
  });
}

export function useDeleteAgent() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (agentId: string) => deleteAgent(agentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agents"] }); // Invalidate all agents list
    },
  });
}

export function useAddAgentCredits() {
  const queryClient = useQueryClient();
  return useMutation<AgentRead, Error, { agentId: string; amount: number }>({
    mutationFn: ({ agentId, amount }) => addAgentCredits(agentId, amount),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["agentCredits", data.id] }); // Invalidate specific agent credits
      queryClient.invalidateQueries({ queryKey: ["agent", data.id] }); // Invalidate specific agent
    },
  });
}

export function useSaveTwilioCredentials() {
  const queryClient = useQueryClient();
  return useMutation<AgentRead, Error, { agentId: string; credentials: TwilioCredentials }>({
    mutationFn: ({ agentId, credentials }) => saveTwilioCredentials(agentId, credentials),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["agent", data.id] }); // Invalidate specific agent
    },
  });
}
