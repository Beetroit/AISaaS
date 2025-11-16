"use client";

import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import Link from "next/link";
import { WorkflowRunList } from "@/components/workflow-runs/WorkflowRunList";

export default function WorkflowRunsPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Workflow Runs</h1>
        <Button asChild>
          <Link href="/dashboard/workflow-runs/initiate">
            <PlusCircle className="mr-2 h-4 w-4" /> Initiate New Run
          </Link>
        </Button>
      </div>

      <WorkflowRunList />
    </div>
  );
}
