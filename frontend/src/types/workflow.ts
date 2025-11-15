export interface NodeType {
    type: string;
    name: string;
    description: string;
    inputs: Record<string, string>;
    outputs: Record<string, string>;
}
