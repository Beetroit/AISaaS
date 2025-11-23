"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getAgents } from "@/lib/api/agents";
import { getCredentials } from "@/lib/api/credentials";
import { createWorkflowRun, getWorkflows } from "@/lib/api/workflow";
import { AgentRead } from "@/types/agent";
import { AppCredential } from "@/types/credential";
import { Workflow, WorkflowRunCreate } from "@/types/workflow";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export function WorkflowRunInitiator() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [selectedAgentId, setSelectedAgentId] = useState<string | undefined>(
    undefined
  );
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<
    string | undefined
  >(undefined);
  const [selectedCredentialId, setSelectedCredentialId] = useState<
    string | undefined
  >(undefined);
  const [initialData, setInitialData] = useState<string>(""); // JSON string for initial data
  const [userMessage, setUserMessage] = useState<string>("");

  const { data: agents, isLoading: isLoadingAgents } = useQuery<AgentRead[]>({
    queryKey: ["agents"],
    queryFn: () => getAgents(),
  });

  const { data: workflows, isLoading: isLoadingWorkflows } = useQuery<
    Workflow[]
  >({
    queryKey: ["workflows"],
    queryFn: () => getWorkflows(),
  });

  const { data: credentials, isLoading: isLoadingCredentials } = useQuery<
    AppCredential[]
  >({
    queryKey: ["credentials"],
    queryFn: () => getCredentials(),
  });

  const createWorkflowRunMutation = useMutation({
    mutationFn: (newRun: WorkflowRunCreate) => createWorkflowRun(newRun),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["workflowRuns"] });
      toast.success("Workflow Run initiated successfully!");
      router.push(`/dashboard/workflow-runs/${data.id}`);
    },
    onError: (err) => {
      toast.error("Failed to initiate workflow run: " + err.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedAgentId || !selectedWorkflowId) {
      toast.error("Please select an agent and a workflow.");
      return;
    }

    let parsedInitialData = {};
    if (initialData) {
      try {
        parsedInitialData = JSON.parse(initialData);
      } catch {
        toast.error("Invalid JSON for initial data.");
        return;
      }
    }

    const newRun: WorkflowRunCreate = {
      agent_id: selectedAgentId,
      workflow_id: selectedWorkflowId,
      credential_id: selectedCredentialId,
      initial_data: parsedInitialData,
      status: "in_progress", // Default status
      // chat_session_id and lead_id will be set by the backend if applicable
    };

    createWorkflowRunMutation.mutate(newRun);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 p-4 border rounded-md bg-white dark:bg-gray-800 shadow"
    >
      <h2 className="text-xl font-bold mb-4">Initiate New Workflow Run</h2>

      <div>
        <Label htmlFor="agent">Select Agent</Label>
        <Select onValueChange={setSelectedAgentId} value={selectedAgentId}>
          <SelectTrigger>
            <SelectValue placeholder="Select an agent" />
          </SelectTrigger>
          <SelectContent>
            {isLoadingAgents ? (
              <SelectItem value="loading" disabled>
                Loading agents...
              </SelectItem>
            ) : (
              agents?.map((agent) => (
                <SelectItem key={agent.id} value={agent.id}>
                  {agent.name}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="workflow">Select Workflow</Label>
        <Select
          onValueChange={setSelectedWorkflowId}
          value={selectedWorkflowId}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a workflow" />
          </SelectTrigger>
          <SelectContent>
            {isLoadingWorkflows ? (
              <SelectItem value="loading" disabled>
                Loading workflows...
              </SelectItem>
            ) : (
              workflows?.map((workflow) => (
                <SelectItem key={workflow.id} value={workflow.id}>
                  {workflow.name}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="credential">Select Credential (Optional)</Label>
        <Select
          onValueChange={setSelectedCredentialId}
          value={selectedCredentialId}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a credential" />
          </SelectTrigger>
          <SelectContent>
            {isLoadingCredentials ? (
              <SelectItem value="loading" disabled>
                Loading credentials...
              </SelectItem>
            ) : (
              credentials?.map((credential) => (
                <SelectItem key={credential.id} value={credential.id}>
                  {credential.credential_type} - {credential.identifier || credential.id}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="initialData">Initial Data (JSON)</Label>
        <Textarea
          id="initialData"
          value={initialData}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            setInitialData(e.target.value)
          }
          placeholder='{"key": "value", "another_key": "another_value"}'
          rows={5}
        />
        <p className="text-sm text-gray-500 mt-1">
          Provide initial data as a JSON object. This will be available in the
          workflow context.
        </p>
      </div>

      <div>
        <Label htmlFor="userMessage">Initial User Message</Label>
        <Input
          id="userMessage"
          value={userMessage}
          onChange={(e) => setUserMessage(e.target.value)}
          placeholder="Optional: Initial message to simulate user input"
        />
        <p className="text-sm text-gray-500 mt-1">
          This message will be processed by the workflow as the first user
          input.
        </p>
      </div>

      <Button type="submit" disabled={createWorkflowRunMutation.isPending}>
        {createWorkflowRunMutation.isPending
          ? "Initiating..."
          : "Initiate Workflow Run"}
      </Button>
    </form>
  );
}

