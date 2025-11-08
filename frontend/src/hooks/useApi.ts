import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { callApi } from "../lib/api";

// --- Auth Hooks ---
export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const formData = new URLSearchParams();
      formData.append("username", email);
      formData.append("password", password);
      return callApi<{ access_token: string }>("/auth/token", { method: "POST", body: formData, isFormData: true });
    },
    onSuccess: (data) => {
      localStorage.setItem("access_token", data.access_token);
      queryClient.invalidateQueries({ queryKey: ["userMe"] });
    },
  });
}

export function useRegister() {
  return useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      return callApi<{ message: string }>("/auth/register", { method: "POST", body: { email, password } });
    },
  });
}

export function useUserMe() {
  return useQuery({
    queryKey: ["userMe"],
    queryFn: () => callApi<{ email: string; id: string }>("/users/me"),
    enabled: !!localStorage.getItem("access_token"), // Only fetch if token exists
  });
}

// --- Document Hooks ---
export function useDocuments(agentId: string) {
  return useQuery({
    queryKey: ["documents", agentId],
    queryFn: () => callApi<any[]>(`/agents/${agentId}/documents/`),
    enabled: !!agentId,
  });
}

export function useUploadDocuments() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ agentId, formData }: { agentId: string; formData: FormData }) => {
      return callApi<any>(`/agents/${agentId}/documents/upload-document/`, { method: "POST", body: formData, isFormData: true });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["documents", variables.agentId] });
    },
  });
}

export function useRemoveDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ agentId, documentId }: { agentId: string; documentId: string }) => {
      return callApi<any>(`/agents/${agentId}/documents/remove-document/${documentId}`, { method: "DELETE" });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["documents", variables.agentId] });
    },
  });
}

// --- Google Calendar Hooks ---
export function useGoogleCalendarAuthorize() {
  return useMutation({
    mutationFn: () => callApi<any>("/auth/google/authorize"),
  });
}

// --- Twilio Hooks ---
export function useSaveTwilioCredentials() {
  return useMutation({
    mutationFn: async ({ agentId, credentials }: { agentId: string; credentials: any }) => {
      return callApi<any>(`/agents/${agentId}/twilio-credentials`, { method: "POST", body: credentials });
    },
  });
}

// --- Lead Webhook Hooks ---
export function useLeadWebhookUrl(agentId: string) {
  return useQuery({
    queryKey: ["leadWebhookUrl", agentId],
    queryFn: () => callApi<{ url: string }>(`/agents/${agentId}/lead-webhook`),
    enabled: !!agentId,
  });
}

export function useGenerateLeadWebhookUrl() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (agentId: string) => {
      return callApi<{ url: string }>(`/agents/${agentId}/lead-webhook`, { method: "POST" });
    },
    onSuccess: (_, agentId) => {
      queryClient.invalidateQueries({ queryKey: ["leadWebhookUrl", agentId] });
    },
  });
}

// --- Appointment Hooks ---
export function useAppointments(agentId: string) {
  return useQuery({
    queryKey: ["appointments", agentId],
    queryFn: () => callApi<any[]>(`/appointments/?agent_id=${agentId}`),
    enabled: !!agentId,
  });
}

// --- Lead Hooks ---
export function useLeads(agentId: string) {
  return useQuery({
    queryKey: ["leads", agentId],
    queryFn: () => callApi<any[]>(`/leads/?agent_id=${agentId}`),
    enabled: !!agentId,
  });
}

// --- Agent Hooks ---
export function useAgentDetails(agentId: string) {
  return useQuery({
    queryKey: ["agentDetails", agentId],
    queryFn: () => callApi<any>(`/agents/${agentId}`),
    enabled: !!agentId,
  });
}

export function useCreateAgent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (agentData: any) => {
      return callApi<any>("/agents/", { method: "POST", body: agentData });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agents"] }); // Invalidate all agents list
    },
  });
}
