import { useQuery } from "@tanstack/react-query";
import { getNodeTypes } from "../lib/api/workflow";
import { NodeType } from "../types/workflow";

export function useNodeTypes() {
  return useQuery<NodeType[], Error>({
    queryKey: ["nodeTypes"],
    queryFn: getNodeTypes,
  });
}
