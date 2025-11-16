import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addAgentCredits,
  createAgent,
  deleteAgent,
  getAgent,
  getAgentCredits,
  getAgents,
  updateAgent,
} from "../lib/api/agents";
import {
  getLeadMapping,
  getLeadWebhookUrl,
  saveLeadMapping,
  saveTwilioCredentials,
} from "../lib/api/credentials";
import { AgentCreate, AgentRead, AgentUpdate, TwilioCredentials } from "../types/agent";
import { AppCredential } from "../types/credential";
import { LeadMappingConfig } from "../types/lead";
import { useUser } from "./useUser";

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
  const { user } = useUser();
  const userId = user?.id;
  return useQuery<AppCredential | null, Error>({
    queryKey: ["leadWebhookUrl", userId, agentId],
    queryFn: () => (userId && agentId ? getLeadWebhookUrl(userId) : Promise.resolve(null)),
    enabled: !!userId && !!agentId,
  });
}

export function useGetLeadMapping(agentId: string) {
  const { user } = useUser();
  const userId = user?.id;
  return useQuery<AppCredential | null, Error>({
    queryKey: ["leadMapping", userId, agentId],
    queryFn: () => (userId && agentId ? getLeadMapping(userId) : Promise.resolve(null)),
    enabled: !!userId && !!agentId,
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
  const { user } = useUser();
  const userId = user?.id;
  return useMutation<AppCredential, Error, { credentials: TwilioCredentials }>({
    mutationFn: ({ credentials }) => (userId ? saveTwilioCredentials(credentials) : Promise.reject(new Error("User not authenticated."))),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["twilioCredentials"] })
    },
  });
}

export function useSaveLeadMapping() {
  const queryClient = useQueryClient();
  const { user } = useUser();
  const userId = user?.id;
  return useMutation<AppCredential, Error, { config: LeadMappingConfig }>({
    mutationFn: ({ config }) => (userId ? saveLeadMapping(userId, config) : Promise.reject(new Error("User not authenticated."))),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leadMapping"] });
    },
  });
}
