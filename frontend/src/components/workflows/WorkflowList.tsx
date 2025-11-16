"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getWorkflows, deleteWorkflow } from "@/lib/api/workflow";
import { Workflow } from "@/types/workflow";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export function WorkflowList() {
  const queryClient = useQueryClient();
  const { data: workflows, isLoading, error } = useQuery<Workflow[]>({
    queryKey: ["workflows"],
    queryFn: getWorkflows,
  });

  const deleteWorkflowMutation = useMutation({
    mutationFn: (workflowId: string) => deleteWorkflow(workflowId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflows"] });
      toast.success("Workflow deleted successfully!");
    },
    onError: (err) => {
      toast.error("Failed to delete workflow: " + err.message);
    },
  });

  if (isLoading) {
    return <div>Loading workflows...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Created At</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {workflows?.map((workflow) => (
            <TableRow key={workflow.id}>
              <TableCell className="font-medium">{workflow.name}</TableCell>
              <TableCell>{workflow.description}</TableCell>
              <TableCell>{new Date(workflow.created_at).toLocaleString()}</TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/dashboard/workflows/${workflow.id}`}>
                      <Edit className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteWorkflowMutation.mutate(workflow.id)}
                    disabled={deleteWorkflowMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
