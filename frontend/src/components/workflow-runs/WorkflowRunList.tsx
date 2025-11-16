"use client";

import { useQuery } from "@tanstack/react-query";
import { getWorkflowRuns } from "@/lib/api/workflow";
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
import { Eye } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";

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
              <TableCell className="font-medium">{run.id}</TableCell>
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
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
