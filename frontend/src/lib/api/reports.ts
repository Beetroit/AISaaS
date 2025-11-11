import { callApi } from "./core";

export interface MessageUsageReport {
  total_messages: number;
  messages_per_agent: { [agentId: string]: number };
  messages_over_time: { date: string; count: number }[];
}

export async function getMessageUsageReport(): Promise<MessageUsageReport> {
  return callApi<MessageUsageReport>("/reports/message-usage");
}