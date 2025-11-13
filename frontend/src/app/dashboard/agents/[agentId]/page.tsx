"use client";

import {
  WorkflowEditor,
  WorkflowStep,
} from "@/components/agents/WorkflowEditor";
import { Button } from "@/components/ui/button";
import { getAgent, updateAgent } from "@/lib/api/agents";
import { AgentRead as Agent, AgentUpdate } from "@/types/agent";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

// Imports from details/page.tsx
import LeadMappingModal from '@/components/agents/LeadMappingModal';
import TwilioConfigModal from '@/components/agents/TwilioConfigModal';
import { useLeadWebhookUrl } from '@/hooks/useAgents'; // useAgent and useUpdateAgent are replaced by existing useQuery/useMutation

export default function AgentDetailPage() {
  const params = useParams();
  const agentId = params.agentId as string;
  const queryClient = useQueryClient();

  const [workflowSteps, setWorkflowSteps] = useState<WorkflowStep[]>([]);
  const isInitialWorkflowSet = useRef(false);

  // State variables from details/page.tsx
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [persona, setPersona] = useState("");
  const [initialPrompts, setInitialPrompts] = useState("");
  const [isTwilioConfigModalOpen, setIsTwilioConfigModalOpen] = useState(false);
  const [isLeadMappingModalOpen, setIsLeadMappingModalOpen] = useState(false);

  const { data: agent, isLoading } = useQuery<Agent>({
    queryKey: ["agent", agentId],
    queryFn: () => getAgent(agentId),
    enabled: !!agentId,
  });

  // useLeadWebhookUrl from details/page.tsx
  const { data: leadWebhookUrl, isLoading: isLoadingLeadWebhookUrl } = useLeadWebhookUrl(agentId);

  useEffect(() => {
    if (agent?.workflow_schema && !isInitialWorkflowSet.current) {
      // Initialize workflow steps
      const stepsArray = Object.entries(agent.workflow_schema).map(
        ([id, stepData]) => {
          const typedStepData = stepData as Omit<WorkflowStep, 'id'>;
          return {
            id,
            ...typedStepData,
          };
        }
      ); setTimeout(() => {
        setWorkflowSteps(stepsArray);
        isInitialWorkflowSet.current = true;
      }, 0);
    }
    // Initialize form fields from agent data
    if (agent) {
      setTimeout(() => {
        setName(agent.name);
        setDescription(agent.description || "");
        setPersona(agent.persona || "");
        setInitialPrompts(agent.initial_prompts || "");
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
      toast.error("Failed to save workflow: " + error.message);
    },
  });

  const handleSaveWorkflow = () => {
    if (!agent) {
      toast.error("Agent data not loaded yet.");
      return;
    }

    const newSchema = workflowSteps.reduce((acc, step) => {
      const { id, ...stepData } = step;
      acc[id] = stepData;
      return acc;
    }, {} as Record<string, Omit<WorkflowStep, 'id'>>);

    const payload: AgentUpdate = {
      name: agent.name, // Use current name from state
      description: agent.description, // Use current description from state
      persona: agent.persona, // Use current persona from state
      initial_prompts: agent.initial_prompts, // Use current initial_prompts from state
      workflow_schema: newSchema,
    };

    updateAgentMutation.mutate(payload);
  };

  // handleSubmit from details/page.tsx, adapted to use existing updateAgentMutation
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agent) return;

    const updatedAgent: AgentUpdate = {
      name,
      description: description || undefined,
      persona: persona || undefined,
      initial_prompts: initialPrompts || undefined,
      workflow_schema: agent.workflow_schema, // Keep existing workflow schema
    };

    updateAgentMutation.mutate(updatedAgent);
  };

  // handleCopyWebhookUrl from details/page.page.tsx
  const handleCopyWebhookUrl = () => {
    if (leadWebhookUrl) {
      navigator.clipboard.writeText(`${process.env.NEXT_PUBLIC_API_BASE_URL}${leadWebhookUrl}`);
      toast.success("Webhook URL copied to clipboard!"); // Using sonner toast
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
        <Button onClick={handleSaveWorkflow} disabled={updateAgentMutation.isPending}>
          {updateAgentMutation.isPending ? "Saving Workflow..." : "Save Workflow"}
        </Button>
      </div>

      {/* Agent Details Form */}
      <form onSubmit={handleSubmit} className="space-y-6 p-4 border rounded-md bg-white dark:bg-gray-800 shadow">
        <h2 className="text-xl font-bold mb-4">Agent Configuration</h2>
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Name
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
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
            value={description}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
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
            value={persona}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setPersona(e.target.value)}
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
            value={initialPrompts}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInitialPrompts(e.target.value)}
            rows={3}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          ></textarea>
        </div>
        <Button
          type="submit"
          className="w-full"
          disabled={updateAgentMutation.isPending}
        >
          {updateAgentMutation.isPending ? "Updating..." : "Update Agent Details"}
        </Button>
        {updateAgentMutation.isError && (
          <p className="text-red-500 text-sm mt-2">
            Error: {updateAgentMutation.error?.message}
          </p>
        )}
        {updateAgentMutation.isSuccess && (
          <p className="text-green-500 text-sm mt-2">Agent details updated successfully!</p>
        )}
      </form>

      {/* Workflow Editor */}
      <WorkflowEditor steps={workflowSteps} onStepsChange={setWorkflowSteps} />

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
