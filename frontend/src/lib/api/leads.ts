import { callApi } from "./core";
import { LeadRead, LeadUpdate } from "../../types/lead";

export async function getLeads(skip: number = 0, limit: number = 100): Promise<LeadRead[]> {
  return callApi<LeadRead[]>(`/leads/?skip=${skip}&limit=${limit}`);
}

export async function getLead(leadId: string): Promise<LeadRead> {
  return callApi<LeadRead>(`/leads/${leadId}`);
}

export async function updateLead(leadId: string, lead: LeadUpdate): Promise<LeadRead> {
  return callApi<LeadRead>(`/leads/${leadId}`, {
    method: "PUT",
    body: lead,
  });
}

export async function deleteLead(leadId: string): Promise<void> {
  return callApi<void>(`/leads/${leadId}`, {
    method: "DELETE",
  });
}
