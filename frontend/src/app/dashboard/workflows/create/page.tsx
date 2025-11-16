"use client";

import { WorkflowForm } from "@/components/workflows/WorkflowForm";

export default function CreateWorkflowPage() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Create New Workflow</h1>
      <WorkflowForm />
    </div>
  );
}
