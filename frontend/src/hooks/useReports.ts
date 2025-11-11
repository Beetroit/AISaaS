import { useQuery } from "@tanstack/react-query";
import { getMessageUsageReport, MessageUsageReport } from "../lib/api/reports";

export function useMessageUsageReport() {
  return useQuery<MessageUsageReport, Error>({
    queryKey: ["messageUsageReport"],
    queryFn: getMessageUsageReport,
  });
}