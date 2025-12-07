"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getCredentials } from "@/lib/api/credentials";
import { getWorkflowRun, updateWorkflowRun } from "@/lib/api/workflow";
import { AppCredential } from "@/types/credential";
import { WorkflowRun, WorkflowRunUpdate } from "@/types/workflow";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";

export default function WorkflowRunEditorPage() {
  const params = useParams();
  const workflowRunId = params.workflowRunId as string;

  const { data: workflowRun, isLoading: isLoadingWorkflowRun } = useQuery<
    WorkflowRun
  >({
    queryKey: ["workflowRun", workflowRunId],
    queryFn: () => getWorkflowRun(workflowRunId),
  });

  const { data: credentials, isLoading: isLoadingCredentials } = useQuery<
    AppCredential[]
  >({
    queryKey: ["credentials"],
    queryFn: () => getCredentials(),
  });

  if (isLoadingWorkflowRun) {
    return <div>Loading...</div>;
  }

  if (!workflowRun) {
    return <div>Workflow run not found.</div>;
  }

  return (
    <WorkflowRunForm
      workflowRun={workflowRun}
      credentials={credentials}
      isLoadingCredentials={isLoadingCredentials}
    />
  );
}

function WorkflowRunForm({
  workflowRun,
  credentials,
  isLoadingCredentials,
}: {
  workflowRun: WorkflowRun;
  credentials: AppCredential[] | undefined;
  isLoadingCredentials: boolean;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const workflowRunId = workflowRun.id;

  const [selectedCredentialId, setSelectedCredentialId] = useState<
    string | undefined
  >(workflowRun.credential_id);
  const [selectedStatus, setSelectedStatus] = useState<string | undefined>(
    workflowRun.status
  );
  const [initialData, setInitialData] = useState<string>(
    JSON.stringify(workflowRun.initial_data, null, 2)
  );

  const updateWorkflowRunMutation = useMutation({
    mutationFn: (updatedRun: WorkflowRunUpdate) =>
      updateWorkflowRun(workflowRunId, updatedRun),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["workflowRun", workflowRunId],
      });
      queryClient.invalidateQueries({ queryKey: ["workflowRuns"] });
      toast.success("Workflow Run updated successfully!");
      router.push(`/dashboard/workflow-runs`);
    },
    onError: (err) => {
      toast.error("Failed to update workflow run: " + err.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let parsedInitialData = {};
    if (initialData) {
      try {
        parsedInitialData = JSON.parse(initialData);
      } catch {
        toast.error("Invalid JSON for initial data.");
        return;
      }
    }

    const updatedRun: WorkflowRunUpdate = {
      credential_id: selectedCredentialId,
      status: selectedStatus,
      initial_data: parsedInitialData,
    };

    updateWorkflowRunMutation.mutate(updatedRun);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 p-4 border rounded-md bg-white dark:bg-gray-800 shadow"
    >
      <h2 className="text-xl font-bold mb-4">Edit Workflow Run</h2>

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
                  {credential.credential_type} -{" "}
                  {credential.identifier || credential.id}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="status">Status</Label>
        <Select onValueChange={setSelectedStatus} value={selectedStatus}>
          <SelectTrigger>
            <SelectValue placeholder="Select a status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
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

      <Button type="submit" disabled={updateWorkflowRunMutation.isPending}>
        {updateWorkflowRunMutation.isPending
          ? "Updating..."
          : "Update Workflow Run"}
      </Button>
    </form>
  );
}