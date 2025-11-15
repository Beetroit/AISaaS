"use client";

import { Handle, Position, NodeProps } from "reactflow";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { NodeType } from "@/types/workflow";

// Assuming the node's data will be the NodeType definition
export type CustomNodeData = NodeType;

export function CustomNode({ data }: NodeProps<CustomNodeData>) {
  return (
    <Card className="w-48 shadow-md">
      <CardHeader className="bg-gray-100 dark:bg-gray-800 p-2 rounded-t-lg">
        <CardTitle className="text-sm text-center">{data.name}</CardTitle>
      </CardHeader>
      <CardContent className="p-2">
        <div className="text-xs text-gray-500">{data.description}</div>
      </CardContent>

      {/* Input Handles */}
      {Object.keys(data.inputs).map((handleId, index) => (
        <Handle
          key={handleId}
          type="target"
          position={Position.Left}
          id={handleId}
          style={{ top: `${(index + 1) * 25}%` }}
        />
      ))}

      {/* Output Handles */}
      {Object.keys(data.outputs).map((handleId, index) => (
        <Handle
          key={handleId}
          type="source"
          position={Position.Right}
          id={handleId}
          style={{ top: `${(index + 1) * 25}%` }}
        />
      ))}
    </Card>
  );
}
