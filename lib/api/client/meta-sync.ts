import { apiClient } from './http';

export const syncMetaAds = async (options: {
  accountId?: string;
  clientId?: string;
  since?: string;
  until?: string;
  syncLevel?: 'campaign' | 'adset' | 'ad' | 'full';
  dryRun?: boolean;
  async?: boolean;
}): Promise<{
  success: boolean;
  async?: boolean;
  alreadyRunning?: boolean;
  syncId?: string;
  totalInsights: number;
  mapped: number;
  updated?: number;
  duration?: number;
  message?: string;
  error?: string;
}> => {
  const { data } = await apiClient.post('/api/metrics/sync/meta', options, {
    timeout: 0, // no timeout
  });
  return data;
};

export type MetaSyncProgress = {
  overallTotal?: number;
  overallCompleted?: number;
  stage?: string;
  stageTotal?: number;
  stageCompleted?: number;
  currentSince?: string | null;
  currentUntil?: string | null;
  message?: string;
  updatedAt?: string;
};

export type MetaSyncDetails = {
  id: string;
  platform: string;
  accountId?: string | null;
  dateRangeStart: string;
  dateRangeEnd: string;
  status: 'success' | 'failed' | 'partial';
  state?: 'running' | 'success' | 'failed' | 'partial';
  totalInsights: number;
  mappedCampaigns: number;
  updatedMetrics: number;
  unmappedCampaigns: string[] | null;
  durationMs: number | null;
  startedAt: string;
  completedAt: string | null;
  errorMessage?: string | null;
  errorStack?: string | null;
  dryRun: boolean;
  triggeredBy?: string | null;
  metadata?: {
    state?: string;
    syncLevel?: string;
    chunkDays?: number;
    chunksTotal?: number;
    progress?: MetaSyncProgress;
    error?: string;
    [key: string]: unknown;
  } | null;
};

export const getMetaSyncDetails = async (syncId: string): Promise<MetaSyncDetails> => {
  const { data } = await apiClient.get<MetaSyncDetails>(`/api/metrics/sync/history/${syncId}`);
  return data;
};

export type MetaSyncHistoryResponse = {
  history: MetaSyncDetails[];
  lastSuccessfulSync: string | null;
  total: number;
};

export const getMetaSyncHistory = async (options?: {
  platform?: string;
  accountId?: string;
  limit?: number;
  offset?: number;
}): Promise<MetaSyncHistoryResponse> => {
  const { platform, accountId, limit, offset } = options ?? {};
  const { data } = await apiClient.get<MetaSyncHistoryResponse>('/api/metrics/sync/history', {
    params: {
      ...(platform ? { platform } : {}),
      ...(accountId ? { accountId } : {}),
      ...(typeof limit === 'number' ? { limit } : {}),
      ...(typeof offset === 'number' ? { offset } : {}),
    },
  });
  return data;
};

