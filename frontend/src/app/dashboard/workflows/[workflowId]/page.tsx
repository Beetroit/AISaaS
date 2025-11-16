"use client";

import { WorkflowForm } from "@/components/workflows/WorkflowForm";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getWorkflow } from "@/lib/api/workflow";

export default function EditWorkflowPage() {
  const params = useParams();
  const workflowId = params.workflowId as string;

  const { data: workflow, isLoading, error } = useQuery({
    queryKey: ["workflow", workflowId],
    queryFn: () => getWorkflow(workflowId),
    enabled: !!workflowId,
  });

  if (isLoading) {
    return <div>Loading workflow...</div>;
  }

  if (error) {
    return <div>Error loading workflow: {error.message}</div>;
  }

  if (!workflow) {
    return <div>Workflow not found.</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Edit Workflow: {workflow.name}</h1>
      <WorkflowForm initialWorkflow={workflow} />
    </div>
  );
}
