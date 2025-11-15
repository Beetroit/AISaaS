"use client";

import { useNodeTypes } from "@/hooks/useWorkflow";
import { NodeType } from "@/types/workflow";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

export function NodePalette() {
  const { data: nodeTypes, isLoading, error } = useNodeTypes();

  const onDragStart = (event: React.DragEvent, nodeType: NodeType) => {
    const nodeInfo = JSON.stringify(nodeType);
    event.dataTransfer.setData("application/reactflow", nodeInfo);
    event.dataTransfer.effectAllowed = "move";
  };

  if (isLoading) return <div>Loading nodes...</div>;
  if (error) return <div>Error loading nodes.</div>;

  return (
    <aside className="w-64 border-r bg-gray-50 dark:bg-gray-900 p-2">
      <h2 className="text-lg font-semibold mb-4">Nodes</h2>
      <ScrollArea className="h-full">
        <div className="space-y-2">
          {nodeTypes?.map((nodeType) => (
            <Card
              key={nodeType.type}
              className="p-2 cursor-grab"
              draggable
              onDragStart={(event) => onDragStart(event, nodeType)}
            >
              <CardHeader className="p-2">
                <CardTitle className="text-sm">{nodeType.name}</CardTitle>
              </CardHeader>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </aside>
  );
}
