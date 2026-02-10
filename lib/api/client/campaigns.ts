import type { BPMNProgress, Campaign, ClientPerformanceSummary, DailyMetric, PerformanceSummary } from '@/types';

import { apiClient } from './http';
import { normalizeMetricsQuery, type MetricsQueryInput } from './metrics-query';

// Basic filter interface
interface CampaignFilters {
  clientId?: string;
  platform?: string;
  status?: string;
}

export const getCampaigns = async (filters?: CampaignFilters): Promise<Campaign[]> => {
  const { data } = await apiClient.get<Campaign[]>('/api/campaigns', {
    params: filters
  });
  return data;
};

export type CampaignUpdatePayload = {
  optimizationThemeKey?: string | null;
  optimizationSubthemeKey?: string | null;
};

export const updateCampaign = async (campaignId: string, payload: CampaignUpdatePayload): Promise<Campaign> => {
  const { data } = await apiClient.put<Campaign>(`/api/campaigns/${campaignId}`, payload);
  return data;
};

export const getCampaignMetrics = async (campaignId: string, query?: MetricsQueryInput): Promise<DailyMetric[]> => {
  const params = normalizeMetricsQuery(query);
  const { data } = await apiClient.get<DailyMetric[]>(`/api/campaigns/${campaignId}/metrics`, params ? { params } : undefined);
  return data;
};

export const getCampaignPerformanceSummary = async (campaignId: string, query?: MetricsQueryInput): Promise<PerformanceSummary> => {
  const params = normalizeMetricsQuery(query);
  const { data } = await apiClient.get<PerformanceSummary>(
    `/api/campaigns/${campaignId}/performance-summary`,
    params ? { params } : undefined
  );
  return data;
};

export const getClientPerformanceSummary = async (clientId: string, query?: MetricsQueryInput): Promise<ClientPerformanceSummary> => {
  const params = normalizeMetricsQuery(query);
  const { data } = await apiClient.get<ClientPerformanceSummary>(
    `/api/clients/${clientId}/performance-summary`,
    params ? { params } : undefined
  );
  return data;
};

export const getClientBpmnProgress = async (clientId: string): Promise<BPMNProgress> => {
  const { data } = await apiClient.get<BPMNProgress>(`/api/clients/${clientId}/bpmn-progress`);
  return data;
};

export const updateClientBpmnProgress = async (clientId: string, payload: Partial<BPMNProgress>): Promise<BPMNProgress> => {
  const { data } = await apiClient.put<BPMNProgress>(`/api/clients/${clientId}/bpmn-progress`, payload);
  return data;
};

export const initializeBpmnProgress = async (clientId: string, payload: { startingSubprocess?: string }): Promise<BPMNProgress> => {
  const { data } = await apiClient.post<BPMNProgress>(`/api/clients/${clientId}/bpmn-progress`, payload);
  return data;
};

export const getBpmnSubprocessClients = async (subprocessId: string): Promise<BPMNProgress[]> => {
  const { data } = await apiClient.get<BPMNProgress[]>(`/api/bpmn/subprocess/${subprocessId}/clients`);
  return data;
};

export const getPerformanceSummary = async (campaignId: string): Promise<PerformanceSummary> => {
  return getCampaignPerformanceSummary(campaignId);
};

export const getClientPerformance = async (clientId: string): Promise<ClientPerformanceSummary> => {
  return getClientPerformanceSummary(clientId);
};

export const getBPMNProgress = async (clientId: string): Promise<BPMNProgress> => {
  return getClientBpmnProgress(clientId);
};

export const updateBPMNProgress = async (clientId: string, updates: Partial<BPMNProgress>): Promise<BPMNProgress> => {
  return updateClientBpmnProgress(clientId, updates);
};
