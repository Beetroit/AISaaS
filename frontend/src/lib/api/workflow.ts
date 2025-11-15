import { NodeType } from "@/types/workflow";
import { get } from "./core";

export async function getNodeTypes(): Promise<NodeType[]> {
    return get<NodeType[]>("/workflow/node-types");
}
