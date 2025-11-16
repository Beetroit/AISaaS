"use client";

import React, { useCallback, useMemo, useState } from "react";
import ReactFlow, {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  Background,
  Controls,
  OnConnect,
  OnEdgesChange,
  OnNodesChange
} from "reactflow";
import "reactflow/dist/style.css";

import { AgentWorkflowSchema } from "@/types/agent";
import { NodeType, WorkflowEdge, WorkflowNode } from "@/types/workflow";
import { CustomNode } from "./workflow/CustomNode";
import { NodePalette } from "./workflow/NodePalette";

interface WorkflowEditorProps {
  initialSchema: AgentWorkflowSchema | null;
  onSchemaChange: (schema: AgentWorkflowSchema) => void;
}

let id = 0;
const getId = () => `dndnode_${id++}`;

export const WorkflowEditor = ({ initialSchema, onSchemaChange }: WorkflowEditorProps) => {
  const nodeTypes = useMemo(() => ({ custom: CustomNode }), []);

  const [nodes, setNodes] = useState<WorkflowNode[]>(initialSchema?.nodes || []);
  const [edges, setEdges] = useState<WorkflowEdge[]>(initialSchema?.edges || []);

  const onNodesChange: OnNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds) as WorkflowNode[]),
    [setNodes]
  );
  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds) as WorkflowEdge[]),
    [setEdges]
  );

  const onConnect: OnConnect = useCallback(
    (connection) => setEdges((eds) => addEdge(connection, eds) as WorkflowEdge[]),
    [setEdges]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const reactFlowBounds = event.currentTarget.getBoundingClientRect();
      const nodeType: NodeType = JSON.parse(
        event.dataTransfer.getData("application/reactflow")
      );

      if (typeof nodeType === "undefined" || !nodeType) {
        return;
      }

      const position = {
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      };

      const newNode: WorkflowNode = {
        id: getId(),
        type: 'custom',
        position,
        data: { ...nodeType },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    []
  );

  // Notify parent of schema changes
  React.useEffect(() => {
    onSchemaChange({ nodes, edges });
  }, [nodes, edges, onSchemaChange]);

  return (
    <div className="flex h-[600px] border rounded-md">
      <NodePalette />
      <div className="flex-grow" onDragOver={onDragOver} onDrop={onDrop}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
        >
          <Background />
          <Controls />
        </ReactFlow>
      </div>
    </div>
  );
};
