"use client";

import { Button } from "@/components/ui/button";
import { getAgent, updateAgent } from "@/lib/api/agents";
import { AgentRead as Agent, AgentUpdate } from "@/types/agent";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MultiSelect } from "@/components/ui/multi-select";
import { getWorkflows } from "@/lib/api/workflow";
import { Workflow } from "@/types/workflow";

export default function AgentDetailPage() {
  const params = useParams();
  const agentId = params.agentId as string;
  const queryClient = useQueryClient();

  const { data: agent, isLoading } = useQuery<Agent>({
    queryKey: ["agent", agentId],
    queryFn: () => getAgent(agentId),
    enabled: !!agentId,
  });

  const [formState, setFormState] = useState({
    name: agent?.name || "",
    description: agent?.description || "",
    persona: agent?.persona || "",
    initialPrompts: agent?.initial_prompts || "",
  });
  const [selectedWorkflowIds, setSelectedWorkflowIds] = useState<string[]>(agent?.workflow_ids || []);

  const { data: workflows, isLoading: isLoadingWorkflows } = useQuery<Workflow[]>({
    queryKey: ["workflows"],
    queryFn: getWorkflows,
  });

  const availableWorkflows = workflows?.map((wf) => ({
    value: wf.id,
    label: wf.name,
  })) || [];

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

  const handleSave = async () => {
    if (!agent) {
      toast.error("Agent data not loaded yet.");
      return;
    }

    const payload: AgentUpdate = {
      ...formState,
      workflow_ids: selectedWorkflowIds,
    };

    await updateAgentMutation.mutateAsync(payload);
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
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={formState.name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormState(prev => ({ ...prev, name: e.target.value }))}
            required
          />
        </div>
        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formState.description}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormState(prev => ({ ...prev, description: e.target.value }))}
            rows={3}
          />
        </div>
        <div>
          <Label htmlFor="persona">Persona</Label>
          <Textarea
            id="persona"
            value={formState.persona}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormState(prev => ({ ...prev, persona: e.target.value }))}
            rows={3}
          />
        </div>
        <div>
          <Label htmlFor="initialPrompts">Initial Prompts</Label>
          <Textarea
            id="initialPrompts"
            value={formState.initialPrompts}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormState(prev => ({ ...prev, initialPrompts: e.target.value }))}
            rows={3}
          />
        </div>
      </div>

      {/* Workflow Association */}
      <div className="mt-8 p-4 border rounded-md bg-white dark:bg-gray-800 shadow">
        <h2 className="text-xl font-bold mb-4">Associated Workflows</h2>
        <MultiSelect
          options={availableWorkflows}
          selected={selectedWorkflowIds}
          onSelectChange={setSelectedWorkflowIds}
          placeholder="Select workflows for this agent"
          disabled={isLoadingWorkflows}
        />
      </div>
    </div>
  );
}
