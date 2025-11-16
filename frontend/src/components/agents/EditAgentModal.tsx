"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import React, { useCallback, useState } from "react";
import { useAgent, useUpdateAgent } from "../../hooks/useAgents";
 
import { AgentUpdate, AgentWorkflowSchema } from "../../types/agent";
import { WorkflowEditor } from "./WorkflowEditor";

import { toast } from "sonner";

interface EditAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  agentId: string;
}

export default function EditAgentModal({ isOpen, onClose, agentId }: EditAgentModalProps) {
  const { data: agent, isLoading, error } = useAgent(agentId);
  const [formState, setFormState] = useState<Partial<AgentUpdate>>({});
  const [workflowSchema, setWorkflowSchema] = useState<AgentWorkflowSchema | null>(null);

  const updateAgentMutation = useUpdateAgent();

  React.useEffect(() => {
    if (agent) {
      setFormState({
        name: agent.name,
        description: agent.description,
        persona: agent.persona,
        initial_prompts: agent.initial_prompts,
      });
      setWorkflowSchema(agent.workflow_schema || { nodes: [], edges: [] });
    }
  }, [agent]);

  const handleSchemaChange = useCallback((schema: AgentWorkflowSchema) => {
    setWorkflowSchema(schema);
  }, []);

  if (!isOpen) return null;
  if (isLoading) return <div>Loading...</div>;
  if (error || !agent) return <div>Error loading agent.</div>;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedAgent: AgentUpdate = {
      ...formState,
      workflow_schema: workflowSchema || undefined,
    };

    updateAgentMutation.mutate(
      { agentId: agent.id, agent: updatedAgent },
      {
        onSuccess: () => {
          toast.success("Agent updated successfully!");
          onClose();
        },
        onError: (error) => {
          console.error("Failed to update agent:", error.message);
          toast.error(`Failed to update agent: ${error.message}`);
        },
      }
    );
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex justify-center items-center">
      <div className="relative mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white dark:bg-gray-800">
        <div className="text-right">
          <button
            className="text-gray-400 hover:text-gray-600 text-2xl font-semibold"
            onClick={onClose}
          >
            &times;
          </button>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4 text-center">
          Edit Agent: {agent.name}
        </h2>

        <Tabs defaultValue="details">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="workflow">Workflow</TabsTrigger>
          </TabsList>
          <TabsContent value="details">
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              {/* Form fields for name, description, etc. */}
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 rounded-md font-semibold hover:bg-blue-700 transition duration-150"
                disabled={updateAgentMutation.isPending}
              >
                {updateAgentMutation.isPending ? "Saving..." : "Save Changes"}
              </button>
            </form>
          </TabsContent>
          <TabsContent value="workflow">
            {workflowSchema && (
              <WorkflowEditor
                initialSchema={workflowSchema}
                onSchemaChange={handleSchemaChange}
              />
            )}
            <button
              onClick={handleSubmit}
              className="w-full mt-4 bg-blue-600 text-white py-2 rounded-md font-semibold hover:bg-blue-700 transition duration-150"
              disabled={updateAgentMutation.isPending}
            >
              {updateAgentMutation.isPending ? "Saving..." : "Save Workflow"}
            </button>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
