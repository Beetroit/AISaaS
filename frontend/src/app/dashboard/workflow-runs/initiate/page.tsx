"use client";

import { WorkflowRunInitiator } from "@/components/workflow-runs/WorkflowRunInitiator";

export default function InitiateWorkflowRunPage() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Initiate Workflow Run</h1>
      <WorkflowRunInitiator />
    </div>
  );
}
