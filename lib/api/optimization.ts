import type { Task } from '@/types';
import { apiClient } from '@/lib/api/client/http';
import type { OptimizationRule } from '@/types/optimization';

export type ExecuteOptimizationActionResponse = {
    success: boolean;
    message: string;
    metaResult?: unknown;
};

export async function executeOptimizationAction(params: {
    type: string;
    entityId: string;
    amount?: number;
    reason: string;
    dryRun?: boolean;
    accessToken: string;
    adAccountId: string;
}): Promise<ExecuteOptimizationActionResponse> {
    const { data } = await apiClient.post<ExecuteOptimizationActionResponse>('/api/optimization/actions/execute', params);
    return data;
}


export async function getOptimizationRules(): Promise<OptimizationRule[]> {
    const { data } = await apiClient.get<OptimizationRule[]>('/api/optimization/rules');
    return data;
}

export async function getOptimizationTasks(): Promise<Task[]> {
    const { data } = await apiClient.get<Task[]>('/api/optimization/tasks');
    return data;
}
