"use client";

import { useQuery } from "@tanstack/react-query";
import { getWorkflowRuns, setDefaultWorkflowRun } from "@/lib/api/workflow";
import { WorkflowRun } from "@/types/workflow";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Eye, Star } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Play } from "lucide-react";
import { startWorkflowRun } from "@/lib/api/workflow";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

function StartRunButton({ runId }: { runId: string }) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: startWorkflowRun,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflowRuns"] });
      toast.success("Workflow Run Started", {
        description: "The workflow run has been successfully started.",
      });
    },
    onError: (error: Error) => {
      toast.error("Error", {
        description: `Failed to start workflow run: ${error.message}`,
      });
    },
  });

  return (
    <Button
      variant="default"
      size="sm"
      onClick={() => mutation.mutate(runId)}
      disabled={mutation.isPending}
    >
      <Play className="mr-2 h-4 w-4" />
      {mutation.isPending ? "Starting..." : "Start"}
    </Button>
  );
}

function SetDefaultButton({ runId, isDefault }: { runId: string; isDefault?: boolean }) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: setDefaultWorkflowRun,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflowRuns"] });
      toast.success("Default Template Set", {
        description: "This workflow run has been set as the default template.",
      });
    },
    onError: (error: Error) => {
      toast.error("Error", {
        description: `Failed to set default: ${error.message}`,
      });
    },
  });

  return (
    <Button
      variant={isDefault ? "default" : "outline"}
      size="sm"
      onClick={() => mutation.mutate(runId)}
      disabled={mutation.isPending || isDefault}
    >
      <Star className={`mr-2 h-4 w-4 ${isDefault ? "fill-current" : ""}`} />
      {mutation.isPending ? "Setting..." : isDefault ? "Default" : "Set Default"}
    </Button>
  );
}

export function WorkflowRunList() {
  const { data: workflowRuns, isLoading, error } = useQuery<WorkflowRun[]>({
    queryKey: ["workflowRuns"],
    queryFn: () => getWorkflowRuns(undefined, undefined),
  });

  if (isLoading) {
    return <div>Loading workflow runs...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Agent ID</TableHead>
            <TableHead>Workflow ID</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Started At</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {workflowRuns && Array.isArray(workflowRuns) && workflowRuns.map((run) => (
            <TableRow key={run.id}>
              <TableCell className="font-medium">
                {run.id}
                {run.is_template && (
                  <Badge variant="default" className="ml-2">
                    <Star className="h-3 w-3 mr-1 fill-current" />
                    Template
                  </Badge>
                )}
              </TableCell>
              <TableCell>{run.agent_id}</TableCell>
              <TableCell>{run.workflow_id}</TableCell>
              <TableCell>
                <Badge variant="secondary">{run.status}</Badge>
              </TableCell>
              <TableCell>{new Date(run.created_at).toLocaleString()}</TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/dashboard/workflow-runs/${run.id}`}>
                      <Eye className="h-4 w-4" /> View
                    </Link>
                  </Button>
                  {run.status !== "in_progress" && run.status !== "completed" && (
                    <StartRunButton runId={run.id} />
                  )}
                  <SetDefaultButton runId={run.id} isDefault={run.is_template} />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
