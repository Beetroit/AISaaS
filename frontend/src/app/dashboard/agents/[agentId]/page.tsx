"use client";

import { WorkflowEditor } from "@/components/agents/WorkflowEditor";
import { Button } from "@/components/ui/button";
import { getAgent, updateAgent } from "@/lib/api/agents";
import { AgentRead as Agent, AgentUpdate, AgentWorkflowSchema } from "@/types/agent";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

// Imports from details/page.tsx
import LeadMappingModal from '@/components/agents/LeadMappingModal';
import TwilioConfigModal from '@/components/agents/TwilioConfigModal';
import { useLeadWebhookUrl } from '@/hooks/useAgents';

export default function AgentDetailPage() {
  const params = useParams();
  const agentId = params.agentId as string;
  const queryClient = useQueryClient();

  const [formState, setFormState] = useState({
    name: "",
    description: "",
    persona: "",
    initialPrompts: "",
  });
  const [workflowSchema, setWorkflowSchema] = useState<AgentWorkflowSchema | null>(null);

  const [isTwilioConfigModalOpen, setIsTwilioConfigModalOpen] = useState(false);
  const [isLeadMappingModalOpen, setIsLeadMappingModalOpen] = useState(false);

  const { data: agent, isLoading } = useQuery<Agent>({
    queryKey: ["agent", agentId],
    queryFn: () => getAgent(agentId),
    enabled: !!agentId,
  });

  const { data: leadWebhookUrl, isLoading: isLoadingLeadWebhookUrl } = useLeadWebhookUrl(agentId);

  useEffect(() => {
    if (agent) {
      setTimeout(() => {
        setFormState({
          name: agent.name,
          description: agent.description || "",
          persona: agent.persona || "",
          initialPrompts: agent.initial_prompts || "",
        });
        setWorkflowSchema(agent.workflow_schema || { nodes: [], edges: [] });
      }, 0);
    }
  }, [agent]);

  const updateAgentMutation = useMutation({
    mutationFn: (updatedAgent: AgentUpdate) =>
      updateAgent(agentId, updatedAgent),
    onSuccess: () => {
      toast.success("Agent updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["agent", agentId] });
    },
    onError: (error) => {
      toast.error("Failed to update agent: " + error.message);
    },
  });

  const handleSave = () => {
    if (!agent) {
      toast.error("Agent data not loaded yet.");
      return;
    }

    const payload: AgentUpdate = {
      ...formState,
      workflow_schema: workflowSchema,
    };

    updateAgentMutation.mutate(payload);
  };

  const handleSchemaChange = useCallback((schema: AgentWorkflowSchema) => {
    setWorkflowSchema(schema);
  }, []);

  const handleCopyWebhookUrl = () => {
    if (leadWebhookUrl) {
      navigator.clipboard.writeText(`${process.env.NEXT_PUBLIC_API_BASE_URL}${leadWebhookUrl}`);
      toast.success("Webhook URL copied to clipboard!");
    }
  };

  if (isLoading) {
    return <div>Loading agent details...</div>;
  }

  if (!agent) {
    return <div>Agent not found.</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Edit Agent: {agent.name}</h1>
        <Button onClick={handleSave} disabled={updateAgentMutation.isPending}>
          {updateAgentMutation.isPending ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      {/* Agent Details Form */}
      <div className="space-y-6 p-4 border rounded-md bg-white dark:bg-gray-800 shadow">
        <h2 className="text-xl font-bold mb-4">Agent Configuration</h2>
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Name
          </label>
          <input
            type="text"
            id="name"
            value={formState.name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormState(prev => ({ ...prev, name: e.target.value }))}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
        </div>
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Description
          </label>
          <textarea
            id="description"
            value={formState.description}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormState(prev => ({ ...prev, description: e.target.value }))}
            rows={3}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          ></textarea>
        </div>
        <div>
          <label htmlFor="persona" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Persona
          </label>
          <textarea
            id="persona"
            value={formState.persona}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormState(prev => ({ ...prev, persona: e.target.value }))}
            rows={3}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          ></textarea>
        </div>
        <div>
          <label htmlFor="initialPrompts" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Initial Prompts
          </label>
          <textarea
            id="initialPrompts"
            value={formState.initialPrompts}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormState(prev => ({ ...prev, initialPrompts: e.target.value }))}
            rows={3}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          ></textarea>
        </div>
      </div>

      {/* Workflow Editor */}
      <div className="mt-8 p-4 border rounded-md bg-white dark:bg-gray-800 shadow">
        <h2 className="text-xl font-bold mb-4">Workflow Editor</h2>
        {workflowSchema && (
          <WorkflowEditor initialSchema={workflowSchema} onSchemaChange={handleSchemaChange} />
        )}
      </div>

      {/* Lead Webhook URL */}
      <div className="mt-8 p-4 border rounded-md bg-white dark:bg-gray-800 shadow">
        <h2 className="text-xl font-bold mb-4">Lead Intake Webhook</h2>
        {isLoadingLeadWebhookUrl ? (
          <p>Loading webhook URL...</p>
        ) : (
          leadWebhookUrl && (
            <div className="flex items-center space-x-2">
              <p className="break-all bg-gray-100 dark:bg-gray-700 p-2 rounded-md text-sm">
                {`${process.env.NEXT_PUBLIC_API_BASE_URL}${leadWebhookUrl}`}
              </p>
              <Button
                onClick={handleCopyWebhookUrl}
                className="bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 px-3 py-1 rounded-md text-sm hover:bg-gray-300 dark:hover:bg-gray-500"
              >
                Copy
              </Button>
            </div>
          )
        )}
      </div>

      {/* Lead Mapping Configuration */}
      <div className="mt-8 p-4 border rounded-md bg-white dark:bg-gray-800 shadow">
        <h2 className="text-xl font-bold mb-4">Lead Mapping Configuration</h2>
        <Button
          onClick={() => setIsLeadMappingModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Configure Lead Mapping
        </Button>
      </div>

      {/* Twilio Configuration */}
      <div className="mt-8 p-4 border rounded-md bg-white dark:bg-gray-800 shadow">
        <h2 className="text-xl font-bold mb-4">Twilio Configuration</h2>
        <Button
          onClick={() => setIsTwilioConfigModalOpen(true)}
          className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700"
        >
          Configure Twilio Credentials
        </Button>
      </div>

      {isTwilioConfigModalOpen && agent && (
        <TwilioConfigModal
          isOpen={isTwilioConfigModalOpen}
          onClose={() => setIsTwilioConfigModalOpen(false)}
          agentId={agent.id}
        />
      )}

      {isLeadMappingModalOpen && agent && (
        <LeadMappingModal
          isOpen={isLeadMappingModalOpen}
          onClose={() => setIsLeadMappingModalOpen(false)}
          agentId={agent.id}
        />
      )}
    </div>
  );
}
