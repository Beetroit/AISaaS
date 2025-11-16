import { NodeType, Workflow, WorkflowCreate, WorkflowUpdate, WorkflowRun, WorkflowRunCreate } from "@/types/workflow";
import { get, callApi } from "./core";

export async function getNodeTypes(): Promise<NodeType[]> {
    return get<NodeType[]>("/workflows/node-types");
}

export async function createWorkflow(workflow: WorkflowCreate): Promise<Workflow> {
    return callApi<Workflow>("/workflows/", {
        method: "POST",
        body: workflow,
    });
}

export async function getWorkflow(workflowId: string): Promise<Workflow> {
    return get<Workflow>(`/workflows/${workflowId}`);
}

export async function getWorkflows(): Promise<Workflow[]> {
    return get<Workflow[]>("/workflows/");
}

export async function updateWorkflow(workflowId: string, workflow: WorkflowUpdate): Promise<Workflow> {
    return callApi<Workflow>(`/workflows/${workflowId}`, {
        method: "PUT",
        body: workflow,
    });
}

export async function deleteWorkflow(workflowId: string): Promise<void> {
    return callApi<void>(`/workflows/${workflowId}`, {
        method: "DELETE",
    });
}

export async function associateAgentWithWorkflow(workflowId: string, agentId: string): Promise<void> {
    return callApi<void>(`/workflows/${workflowId}/agents/${agentId}`, {
        method: "POST",
    });
}

export async function disassociateAgentFromWorkflow(workflowId: string, agentId: string): Promise<void> {
    return callApi<void>(`/workflows/${workflowId}/agents/${agentId}`, {
        method: "DELETE",
    });
}

export async function createWorkflowRun(workflowRun: WorkflowRunCreate): Promise<WorkflowRun> {
    return callApi<WorkflowRun>("/workflows/runs", {
        method: "POST",
        body: workflowRun,
    });
}

export async function getWorkflowRun(workflowRunId: string): Promise<WorkflowRun> {
    return get<WorkflowRun>(`/workflows/runs/${workflowRunId}`);
}

export async function getWorkflowRuns(agentId?: string, workflowId?: string): Promise<WorkflowRun[]> {
    let query = "";
    if (agentId) {
        query += `agent_id=${agentId}`;
    }
    if (workflowId) {
        query += `${query ? "&" : ""}workflow_id=${workflowId}`;
    }
    return get<WorkflowRun[]>(`/workflows/runs${query ? `?${query}` : ""}`);
}
