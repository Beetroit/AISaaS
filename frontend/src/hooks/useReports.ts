import { useQuery } from "@tanstack/react-query";
import {
  getMessageUsageReport,
  getSessionsReport,
  getSessionMessages,
  MessageUsageReport,
  SessionsReportResponse,
  MessageReportItem
} from "../lib/api/reports";

export function useMessageUsageReport() {
  return useQuery<MessageUsageReport, Error>({
    queryKey: ["messageUsageReport"],
    queryFn: getMessageUsageReport,
  });
}

export function useSessionsReport(skip: number = 0, limit: number = 20) {
  return useQuery<SessionsReportResponse, Error>({
    queryKey: ["sessionsReport", skip, limit],
    queryFn: () => getSessionsReport(skip, limit),
  });
}

export function useSessionMessages(sessionId: string | null) {
  return useQuery<MessageReportItem[], Error>({
    queryKey: ["sessionMessages", sessionId],
    queryFn: () => getSessionMessages(sessionId!),
    enabled: !!sessionId,
  });
}