"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createWorkflow,
  updateWorkflow,
} from "@/lib/api/workflow";
import {
  Workflow,
  WorkflowCreate,
  WorkflowUpdate,
  WorkflowSchema,
} from "@/types/workflow";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { WorkflowEditor } from "@/components/agents/WorkflowEditor";
import { getDocuments } from "@/lib/api/documents";
import { Document } from "@/types/document";
import { MultiSelect } from "@/components/ui/multi-select";

interface WorkflowFormProps {
  initialWorkflow?: Workflow;
}

export function WorkflowForm({ initialWorkflow }: WorkflowFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [name, setName] = useState(initialWorkflow?.name || "");
  const [description, setDescription] = useState(initialWorkflow?.description || "");
  const [workflowSchema, setWorkflowSchema] = useState<WorkflowSchema>(
    initialWorkflow?.workflow_schema || { nodes: [], edges: [] }
  );
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>(
    initialWorkflow?.knowledge_base_document_ids || []
  );

  const { data: documents, isLoading: isLoadingDocuments } = useQuery<Document[]>({
    queryKey: ["documents"],
    queryFn: () => getDocuments(),
  });

  const availableDocuments = documents?.map((doc) => ({
    value: doc.id,
    label: doc.filename,
  })) || [];

  const createWorkflowMutation = useMutation({
    mutationFn: (newWorkflow: WorkflowCreate) => createWorkflow(newWorkflow),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflows"] });
      toast.success("Workflow created successfully!");
      router.push("/dashboard/workflows");
    },
    onError: (err) => {
      toast.error("Failed to create workflow: " + err.message);
    },
  });

  const updateWorkflowMutation = useMutation({
    mutationFn: ({ id, updatedWorkflow }: { id: string; updatedWorkflow: WorkflowUpdate }) =>
      updateWorkflow(id, updatedWorkflow),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflows"] });
      toast.success("Workflow updated successfully!");
      router.push("/dashboard/workflows");
    },
    onError: (err) => {
      toast.error("Failed to update workflow: " + err.message);
    },
  });

  const handleSchemaChange = useCallback((schema: WorkflowSchema) => {
    setWorkflowSchema(schema);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const workflowData = {
      name,
      description,
      workflow_schema: workflowSchema,
      knowledge_base_document_ids: selectedDocumentIds,
    };

    if (initialWorkflow) {
      updateWorkflowMutation.mutate({ id: initialWorkflow.id, updatedWorkflow: workflowData });
    } else {
      createWorkflowMutation.mutate(workflowData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <Label htmlFor="name">Workflow Name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
        />
      </div>

      <div>
        <Label htmlFor="documents">Knowledge Base Documents</Label>
        <MultiSelect
          options={availableDocuments}
          selected={selectedDocumentIds}
          onSelectChange={setSelectedDocumentIds}
          placeholder="Select documents for this workflow"
          disabled={isLoadingDocuments}
        />
      </div>

      <div className="h-[600px] border rounded-md">
        <WorkflowEditor initialSchema={workflowSchema} onSchemaChange={handleSchemaChange} />
      </div>

      <Button
        type="submit"
        disabled={createWorkflowMutation.isPending || updateWorkflowMutation.isPending}
      >
        {initialWorkflow ? "Update Workflow" : "Create Workflow"}
      </Button>
    </form>
  );
}
