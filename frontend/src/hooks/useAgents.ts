import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addAgentCredits,
  createAgent,
  deleteAgent,
  getAgent,
  getAgentCredits,
  getAgents,
  getLeadWebhookUrl,
  saveTwilioCredentials,
  updateAgent,
  getLeadMapping,
  saveLeadMapping,
} from "../lib/api/agents";
import { AgentCreate, AgentRead, AgentUpdate, TwilioCredentials } from "../types/agent";
import { LeadMappingConfig } from "../types/lead";

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
    enabled: !!agentId,
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

export function useGetLeadMapping(agentId: string) {
  return useQuery<LeadMappingConfig, Error>({
    queryKey: ["leadMapping", agentId],
    queryFn: () => getLeadMapping(agentId),
    enabled: !!agentId,
  });
}

// --- Mutations ---

export function useCreateAgent() {
  const queryClient = useQueryClient();
  return useMutation<AgentRead, Error, AgentCreate>({
    mutationFn: (agent: AgentCreate) => createAgent(agent),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agents"] })
    },
  });
}

export function useUpdateAgent() {
  const queryClient = useQueryClient();
  return useMutation<AgentRead, Error, { agentId: string; agent: AgentUpdate }>({
    mutationFn: ({ agentId, agent }) => updateAgent(agentId, agent),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["agents"] })
      queryClient.invalidateQueries({ queryKey: ["agent", data.id] })
    },
  });
}

export function useDeleteAgent() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (agentId: string) => deleteAgent(agentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agents"] })
    },
  });
}

export function useAddAgentCredits() {
  const queryClient = useQueryClient();
  return useMutation<AgentRead, Error, { agentId: string; amount: number }>({
    mutationFn: ({ agentId, amount }) => addAgentCredits(agentId, amount),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["agentCredits", data.id] })
      queryClient.invalidateQueries({ queryKey: ["agent", data.id] })
    },
  });
}

export function useSaveTwilioCredentials() {
  const queryClient = useQueryClient();
  return useMutation<AgentRead, Error, { agentId: string; credentials: TwilioCredentials }>({
    mutationFn: ({ agentId, credentials }) => saveTwilioCredentials(agentId, credentials),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["agent", data.id] })
    },
  });
}

export function useSaveLeadMapping() {
  const queryClient = useQueryClient();
  return useMutation<LeadMappingConfig, Error, { agentId: string; config: LeadMappingConfig }>({
    mutationFn: ({ agentId, config }) => saveLeadMapping(agentId, config),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["leadMapping", variables.agentId] });

      queryClient.invalidateQueries({ queryKey: ["agent", variables.agentId] });
    },
  });
}
