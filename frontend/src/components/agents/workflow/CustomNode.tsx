"use client";

import { Handle, Position, NodeProps } from "reactflow";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { XIcon } from "lucide-react";
import { NodeType } from "@/types/workflow";

// Assuming the node's data will be the NodeType definition
export type CustomNodeData = NodeType;

export function CustomNode({ id, data, onClick, onDelete }: NodeProps<CustomNodeData> & { onClick: (id: string, data: CustomNodeData) => void, onDelete: (id: string) => void }) {
  return (
    <Card className="w-48 shadow-md cursor-pointer">
      <CardHeader className="bg-gray-100 dark:bg-gray-800 p-2 rounded-t-lg flex flex-row items-center justify-between">
        <CardTitle className="text-sm text-center flex-grow" onClick={() => onClick(id, data)}>{data.name}</CardTitle>
        <Button variant="ghost" size="icon" className="w-6 h-6" onClick={(e) => { e.stopPropagation(); onDelete(id); }}>
          <XIcon className="h-4 w-4 text-red-500" />
        </Button>
      </CardHeader>
      <CardContent className="p-2">
        <div className="text-xs text-gray-500">{data.description}</div>
        {Object.keys(data.inputs).length > 0 && (
          <div className="mt-2">
            <h4 className="text-xs font-semibold">Inputs:</h4>
            {Object.entries(data.inputs).map(([key, value]) => (
              <div key={key} className="text-xs">
                {key}: {value}
              </div>
            ))}
          </div>
        )}
        {Object.keys(data.outputs).length > 0 && (
          <div className="mt-2">
            <h4 className="text-xs font-semibold">Outputs:</h4>
            {Object.entries(data.outputs).map(([key, value]) => (
              <div key={key} className="text-xs">
                {key}: {value}
              </div>
            ))}
          </div>
        )}
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
