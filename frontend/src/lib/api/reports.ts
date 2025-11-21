import { callApi } from "./core";

export interface MessageUsageReport {
  total_messages: number;
  messages_per_agent: { [agentId: string]: number };
  messages_over_time: { date: string; count: number }[];
}

export interface SessionReportItem {
  chat_session_id: string;
  external_id: string | null;
  agent_name: string;
  workflow_run_id: string | null;
  workflow_name: string | null;
  status: string;
  workflow_status: string | null;
  current_step: string | null;
  start_time: string | null;
  message_count: number;
  last_message_at: string | null;
  lead_id: string | null;
}

export interface SessionsReportResponse {
  sessions: SessionReportItem[];
  total: number;
  skip: number;
  limit: number;
}

export interface MessageReportItem {
  id: string;
  chat_session_id: string;
  role: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export async function getMessageUsageReport(): Promise<MessageUsageReport> {
  return callApi<MessageUsageReport>("/reports/message-usage");
}

export async function getSessionsReport(skip: number = 0, limit: number = 20): Promise<SessionsReportResponse> {
  return callApi<SessionsReportResponse>(`/reports/sessions?skip=${skip}&limit=${limit}`);
}

export async function getSessionMessages(sessionId: string): Promise<MessageReportItem[]> {
  return callApi<MessageReportItem[]>(`/reports/sessions/${sessionId}/messages`);
}