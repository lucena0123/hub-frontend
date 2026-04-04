import { apiClient } from './http';
import type { RenewalOpportunity } from './finance';

export type OnboardingTask = {
  id: string;
  planId: string;
  taskKey: string;
  title: string;
  status: 'pending' | 'done';
  dueDate: string | null;
  completedAt: string | null;
};

export type OnboardingPlan = {
  id: string;
  clientId: string;
  contractId: string;
  status: 'onboarding' | 'healthy' | 'risk' | 'renewal' | 'churned';
  startedAt: string;
  targetDate: string | null;
  completedAt: string | null;
  client: {
    id: string;
    name: string;
  };
  contract: {
    id: string;
    title: string;
  };
  tasks: OnboardingTask[];
};

export type HealthSignal = {
  id: string;
  signalType: string;
  severity: 'low' | 'medium' | 'high';
  source: string;
  message: string;
};

export type HealthSnapshot = {
  id: string;
  clientId: string;
  contractId: string | null;
  snapshotDate: string;
  status: 'onboarding' | 'healthy' | 'risk' | 'renewal' | 'churned';
  score: number;
  client: {
    id: string;
    name: string;
    status: string;
  };
  contract?: {
    id: string;
    title: string;
    endDate: string | null;
  } | null;
  signals: HealthSignal[];
};

export type ExpansionOpportunity = {
  id: string;
  clientId: string;
  contractId: string | null;
  status: string;
  title: string;
  notes?: string | null;
  estimatedMrr?: number | string | null;
  client: {
    id: string;
    name: string;
  };
};

export async function listOnboarding(params?: { clientId?: string }) {
  const { data } = await apiClient.get<OnboardingPlan[]>('/api/onboarding', params ? { params } : undefined);
  return data;
}

export async function updateOnboardingTask(taskId: string, payload: { status: string }) {
  const { data } = await apiClient.patch<OnboardingTask>(`/api/onboarding/tasks/${taskId}`, payload);
  return data;
}

export async function listHealthPortfolio(params?: { clientId?: string }) {
  const { data } = await apiClient.get<HealthSnapshot[]>('/api/accounts/health', params ? { params } : undefined);
  return data;
}

export async function listAccountRenewals(params?: { clientId?: string }) {
  const { data } = await apiClient.get<RenewalOpportunity[]>('/api/accounts/renewals', params ? { params } : undefined);
  return data;
}

export async function listExpansionOpportunities(params?: { clientId?: string }) {
  const { data } = await apiClient.get<ExpansionOpportunity[]>('/api/accounts/expansion-opportunities', params ? { params } : undefined);
  return data;
}

export async function createExpansionOpportunity(payload: { clientId: string; contractId?: string | null; title: string; notes?: string | null; estimatedMrr?: number | null }) {
  const { data } = await apiClient.post<ExpansionOpportunity>('/api/accounts/expansion-opportunities', payload);
  return data;
}
