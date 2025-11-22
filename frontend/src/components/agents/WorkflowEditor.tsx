"use client";

import React, { useCallback, useMemo, useState } from "react";
import { useNodeTypes } from "@/hooks/useWorkflow";
import ReactFlow, {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  Background,
  Controls,
  OnConnect,
  OnEdgesChange,
  OnNodesChange,
  NodeProps
} from "reactflow";
import "reactflow/dist/style.css";

import { AgentWorkflowSchema } from "@/types/agent";
import { NodeType, WorkflowEdge, WorkflowNode } from "@/types/workflow";
import { CustomNode } from "./workflow/CustomNode";
import { NodeConfigurationModal } from "./workflow/NodeConfigurationModal"; // Placeholder import
import { NodePalette } from "./workflow/NodePalette";

interface WorkflowEditorProps {
  initialSchema: AgentWorkflowSchema | null;
  onSchemaChange: (schema: AgentWorkflowSchema) => void;
}

let id = 0;
const getId = () => `dndnode_${id++}`;

export const WorkflowEditor = ({ initialSchema, onSchemaChange }: WorkflowEditorProps) => {
  const [nodes, setNodes] = useState<WorkflowNode[]>(initialSchema?.nodes || []);
  const [edges, setEdges] = useState<WorkflowEdge[]>(initialSchema?.edges || []);

  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [editingNodeData, setEditingNodeData] = useState<Record<string, unknown> | null>(null);
  const [editingNodeTypeSchema, setEditingNodeTypeSchema] = useState<NodeType | null>(null);

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

  const handleNodeDataSave = useCallback((nodeId: string, newData: Record<string, unknown>) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, ...newData } }
          : node
      )
    );
    setEditingNodeId(null); // Close modal after saving
    setEditingNodeData(null);
    setEditingNodeTypeSchema(null);
  }, []);

  const { data: availableNodeTypes } = useNodeTypes();

  const handleNodeClick = useCallback((id: string, data: NodeType) => {
    setEditingNodeId(id);
    setEditingNodeData(data as unknown as Record<string, unknown>); // Use data directly from the prop

    // Try to find the latest schema for this node type
    const freshSchema = availableNodeTypes?.find((nt) => nt.type === data.type);
    setEditingNodeTypeSchema(freshSchema || data);
  }, [availableNodeTypes]);

  const handleNodeDelete = useCallback((nodeId: string) => {
    setNodes((nds) => nds.filter((node) => node.id !== nodeId));
    setEdges((eds) =>
      eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId)
    );
  }, []);

  const memoizedNodeTypes = useMemo(() => ({
    custom: (props: NodeProps) => <CustomNode {...props} onClick={handleNodeClick} onDelete={handleNodeDelete} />,
  }), [handleNodeClick, handleNodeDelete]);

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
          nodeTypes={memoizedNodeTypes}
          fitView
        >
          <Background />
          <Controls />
        </ReactFlow>
      </div>
      {editingNodeId && editingNodeTypeSchema && (
        <NodeConfigurationModal
          nodeId={editingNodeId}
          nodeData={editingNodeData || {}}
          nodeTypeSchema={editingNodeTypeSchema}
          onSave={handleNodeDataSave}
          onClose={() => setEditingNodeId(null)}
        />
      )}
    </div>
  );
};