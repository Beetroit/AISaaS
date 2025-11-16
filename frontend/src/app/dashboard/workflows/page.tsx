"use client";

import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import Link from "next/link";
import { WorkflowList } from "@/components/workflows/WorkflowList";

export default function WorkflowsPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Workflows</h1>
        <Button asChild>
          <Link href="/dashboard/workflows/create">
            <PlusCircle className="mr-2 h-4 w-4" /> Create New Workflow
          </Link>
        </Button>
      </div>

      <WorkflowList />
    </div>
  );
}
