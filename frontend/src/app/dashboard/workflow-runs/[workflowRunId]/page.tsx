"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getWorkflowRun } from "@/lib/api/workflow";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function WorkflowRunDetailPage() {
  const params = useParams();
  const workflowRunId = params.workflowRunId as string;

  const { data: workflowRun, isLoading, error } = useQuery({
    queryKey: ["workflowRun", workflowRunId],
    queryFn: () => getWorkflowRun(workflowRunId),
    enabled: !!workflowRunId,
  });

  if (isLoading) {
    return <div>Loading workflow run details...</div>;
  }

  if (error) {
    return <div>Error loading workflow run: {error.message}</div>;
  }

  if (!workflowRun) {
    return <div>Workflow Run not found.</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Workflow Run: {workflowRun.id}</h1>

      <Card>
        <CardHeader>
          <CardTitle>Run Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="flex items-center justify-between">
            <span className="font-medium">Status:</span>
            <Badge variant="secondary">{workflowRun.status}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-medium">Agent ID:</span>
            <span>{workflowRun.agent_id}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-medium">Workflow ID:</span>
            <span>{workflowRun.workflow_id}</span>
          </div>
          {workflowRun.chat_session_id && (
            <div className="flex items-center justify-between">
              <span className="font-medium">Chat Session ID:</span>
              <span>{workflowRun.chat_session_id}</span>
            </div>
          )}
          {workflowRun.lead_id && (
            <div className="flex items-center justify-between">
              <span className="font-medium">Lead ID:</span>
              <span>{workflowRun.lead_id}</span>
            </div>
          )}
          {workflowRun.credential_id && (
            <div className="flex items-center justify-between">
              <span className="font-medium">Credential ID:</span>
              <span>{workflowRun.credential_id}</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="font-medium">Started At:</span>
            <span>{new Date(workflowRun.created_at).toLocaleString()}</span>
          </div>
          {workflowRun.end_time && (
            <div className="flex items-center justify-between">
              <span className="font-medium">Ended At:</span>
              <span>{new Date(workflowRun.end_time).toLocaleString()}</span>
            </div>
          )}
          {workflowRun.initial_data && Object.keys(workflowRun.initial_data).length > 0 && (
            <div>
              <span className="font-medium">Initial Data:</span>
              <pre className="mt-2 p-2 bg-gray-100 dark:bg-gray-700 rounded-md text-sm overflow-auto">
                {JSON.stringify(workflowRun.initial_data, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>

      {/* TODO: Add chat messages and lead details here */}
    </div>
  );
}
