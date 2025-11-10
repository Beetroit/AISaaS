import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { deleteLead, getLead, getLeads, updateLead } from "../lib/api/leads";
import { LeadRead, LeadUpdate } from "../types/lead";

// --- Queries ---

export function useLeads(skip: number = 0, limit: number = 100) {
  return useQuery<LeadRead[], Error>({
    queryKey: ["leads", { skip, limit }],
    queryFn: () => getLeads(skip, limit),
  });
}

export function useLead(leadId: string) {
  return useQuery<LeadRead, Error>({
    queryKey: ["lead", leadId],
    queryFn: () => getLead(leadId),
    enabled: !!leadId, // Only run query if leadId is available
  });
}

// --- Mutations ---

export function useUpdateLead() {
  const queryClient = useQueryClient();
  return useMutation<LeadRead, Error, { leadId: string; lead: LeadUpdate }>({
    mutationFn: ({ leadId, lead }) => updateLead(leadId, lead),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["leads"] })
      queryClient.invalidateQueries({ queryKey: ["lead", data.id] })
    },
  });
}

export function useDeleteLead() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (leadId: string) => deleteLead(leadId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] })
    },
  });
}
