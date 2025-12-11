// Admin API Client
// Functions for calling admin endpoints

import { callApi } from './core';

export interface DashboardMetrics {
    users: {
        total: number;
        new_today: number;
        new_week: number;
        new_month: number;
        active_7d: number;
        active_30d: number;
    };
    revenue: {
        total: number;
        month: number;
    };
    usage: {
        total_workflows: number;
        credits_today: number;
    };
    health: {
        active_runs: number;
        failed_runs_24h: number;
    };
}

export interface User {
    id: string;
    email: string;
    is_active: boolean;
    is_admin: boolean;
    is_super_admin: boolean;
    message_credits: number;
    stripe_customer_id?: string;
    created_at?: string;
    updated_at?: string;
    whitelisted_phone_numbers?: string[] | null;
    allowed_admin_endpoints?: string[] | null;
}

export interface UserListResponse {
    users: User[];
    total: number;
}

export interface UserStats {
    workflow_runs: number;
    message_count: number;
    lead_count: number;
}

export interface UserDetail {
    user: User;
    stats: UserStats;
}

export interface AdminLog {
    id: string;
    admin_id: string;
    action_type: string;
    target_resource: string;
    details: Record<string, unknown>;
    timestamp: string;
}

export interface RevenueAnalytics {
    total: number;
    by_plan: Record<string, number>;
    trends: unknown[];
}


export interface WorkflowStats {
    total_executions: number;
    success_rate: number;
    active_runs: number;
    avg_execution_time: number;
    error_types: unknown[];
}

export interface AdminCommandInfo {
    url: string;
    description: string;
}

// ========== Dashboard ==========

export async function fetchDashboardMetrics(): Promise<DashboardMetrics> {
    return callApi<DashboardMetrics>('/admin/dashboard');
}

// ========== User Management ==========

export async function fetchUsers(params?: {
    search?: string;
    status?: string;
    plan?: string;
    skip?: number;
    limit?: number;
}): Promise<UserListResponse> {
    const queryString = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : '';
    return callApi<UserListResponse>(`/admin/users${queryString}`);
}

export async function fetchUserDetail(userId: string): Promise<UserDetail> {
    return callApi<UserDetail>(`/admin/users/${userId}`);
}

export async function suspendUser(userId: string, reason: string): Promise<void> {
    await callApi(`/admin/users/${userId}/suspend`, { method: 'POST', body: { reason } });
}

export async function unsuspendUser(userId: string): Promise<void> {
    await callApi(`/admin/users/${userId}/unsuspend`, { method: 'POST' });
}

export async function deleteUser(userId: string): Promise<void> {
    await callApi(`/admin/users/${userId}`, { method: 'DELETE' });
}

export async function adjustUserCredits(
    userId: string,
    amount: number,
    reason: string
): Promise<void> {
    await callApi(`/admin/users/${userId}/credits`, { method: 'POST', body: { amount, reason } });
}

export async function promoteUser(userId: string): Promise<void> {
    await callApi(`/admin/users/${userId}/promote`, { method: 'POST' });
}

export async function demoteUser(userId: string): Promise<void> {
    await callApi(`/admin/users/${userId}/demote`, { method: 'POST' });
}

export async function updateUserAdminSettings({
    userId,
    settings,
}: {
    userId: string;
    settings: {
        is_active?: boolean;
        is_admin?: boolean;
        is_super_admin?: boolean;
        message_credits?: number;
        whitelisted_phone_numbers?: string[] | null;
        allowed_admin_endpoints?: string[] | null;
    };
}): Promise<void> {
    await callApi(`/admin/users/${userId}/admin-settings`, { method: 'PATCH', body: settings });
}

// ========== Revenue ==========

export async function fetchRevenueAnalytics(): Promise<RevenueAnalytics> {
    return callApi<RevenueAnalytics>('/admin/revenue/analytics');
}

import { PricingPlan, PricingPlanCreate, PricingPlanUpdate } from './pricing';

export async function fetchPricingPlans(): Promise<PricingPlan[]> {
    return callApi<PricingPlan[]>('/pricing/plans');
}

export async function createPricingPlan(plan: PricingPlanCreate): Promise<PricingPlan> {
    return callApi<PricingPlan>('/pricing/admin/plans', { method: 'POST', body: plan });
}

export async function updatePricingPlan(planId: string, updates: PricingPlanUpdate): Promise<PricingPlan> {
    return callApi<PricingPlan>(`/pricing/admin/plans/${planId}`, { method: 'PUT', body: updates });
}

export async function deletePricingPlan(planId: string): Promise<PricingPlan> {
    return callApi<PricingPlan>(`/pricing/admin/plans/${planId}`, { method: 'DELETE' });
}

// ========== Workflows ==========

export async function fetchWorkflowStats(): Promise<WorkflowStats> {
    return callApi<WorkflowStats>('/admin/workflows/stats');
}

export async function fetchAvailableAdminCommands(): Promise<AdminCommandInfo[]> {
    return callApi<AdminCommandInfo[]>('/admin/available-admin-commands');
}

// ========== Logs ==========

export async function fetchAdminLogs(params?: {
    action_type?: string;
    start_date?: string;
    end_date?: string;
    skip?: number;
    limit?: number;
}): Promise<AdminLog[]> {
    const queryString = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : '';
    return callApi<AdminLog[]>(`/admin/logs${queryString}`);
}
