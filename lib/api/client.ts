/**
 * BPMN System - API Client
 */

import axios from 'axios';
import type {
  Client,
  Campaign,
  ProcessInstance,
  Task,
  DashboardStats,
  DashboardOverview,
  AlertsResponse,
  HealthStatus,
  DailyMetric,
  PerformanceSummary,
  ClientPerformanceSummary,
  BPMNProgress,
  MetricsPeriod,
  MetricsQuery,
  MonthlyReport,
} from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

const looksLikeHtmlDocument = (value: string) => {
  const trimmed = value.trimStart().toLowerCase();
  return trimmed.startsWith('<!doctype') || trimmed.startsWith('<html') || trimmed.includes('<html');
};

apiClient.interceptors.response.use(
  (response) => {
    if (typeof response.data === 'string' && looksLikeHtmlDocument(response.data)) {
      throw new Error(
        `API returned HTML instead of JSON. Check NEXT_PUBLIC_API_URL (currently: ${API_BASE_URL}) and ensure the Fastify backend is running.`
      );
    }

    return response;
  },
  (error) => Promise.reject(error)
);

type MetricsQueryInput = MetricsQuery | MetricsPeriod | undefined;

const normalizeMetricsQuery = (query: MetricsQueryInput): MetricsQuery | undefined => {
  if (!query) return undefined;
  if (typeof query === 'string') return { period: query };

  const params: MetricsQuery = {};
  if (query.period) params.period = query.period;
  if (query.startDate) params.startDate = query.startDate;
  if (query.endDate) params.endDate = query.endDate;
  if (query.platform) params.platform = query.platform;
  if (query.campaignId) params.campaignId = query.campaignId;

  return params;
};

// Health Check
export const getHealth = async (): Promise<HealthStatus> => {
  const { data } = await apiClient.get<HealthStatus>('/health');
  return data;
};

// Clients
export const getClients = async (): Promise<Client[]> => {
  const { data } = await apiClient.get<Client[]>('/api/clients');
  return data;
};

export const getClientById = async (id: string): Promise<Client> => {
  const { data } = await apiClient.get<Client>(`/api/clients/${id}`);
  return data;
};

type ClientPayload = {
  name: string;
  email: string;
  cpfCnpj?: string;
  tier: string;
  budget: number;
  contractStart: string;
  contractEnd?: string | null;
};

export const createClient = async (payload: ClientPayload): Promise<Client> => {
  const { name, email, cpfCnpj, tier, budget, contractStart, contractEnd } = payload;
  const response = await apiClient.post<Client>('/api/clients', {
    name,
    email,
    cpfCnpj,
    tier,
    budget,
    contractStart,
    contractEnd,
  });
  return response.data;
};

export const updateClient = async (id: string, payload: ClientPayload): Promise<Client> => {
  const { name, email, cpfCnpj, tier, budget, contractStart, contractEnd } = payload;
  const response = await apiClient.put<Client>(`/api/clients/${id}`, {
    name,
    email,
    cpfCnpj,
    tier,
    budget,
    contractStart,
    contractEnd,
  });
  return response.data;
};

export const deleteClient = async (id: string): Promise<void> => {
  await apiClient.delete(`/api/clients/${id}`);
};

// Campaigns
export const getCampaigns = async (): Promise<Campaign[]> => {
  const { data } = await apiClient.get<Campaign[]>('/api/campaigns');
  return data;
};

export const getCampaignMetrics = async (
  campaignId: string,
  query?: MetricsQueryInput
): Promise<DailyMetric[]> => {
  const params = normalizeMetricsQuery(query);
  const { data } = await apiClient.get<DailyMetric[]>(
    `/api/campaigns/${campaignId}/metrics`,
    params ? { params } : undefined
  );
  return data;
};

export const getCampaignPerformanceSummary = async (
  campaignId: string,
  query?: MetricsQueryInput
): Promise<PerformanceSummary> => {
  const params = normalizeMetricsQuery(query);
  const { data } = await apiClient.get<PerformanceSummary>(
    `/api/campaigns/${campaignId}/performance-summary`,
    params ? { params } : undefined
  );
  return data;
};

export const getClientPerformanceSummary = async (
  clientId: string,
  query?: MetricsQueryInput
): Promise<ClientPerformanceSummary> => {
  const params = normalizeMetricsQuery(query);
  const { data } = await apiClient.get<ClientPerformanceSummary>(
    `/api/clients/${clientId}/performance-summary`,
    params ? { params } : undefined
  );
  return data;
};

export const getClientBpmnProgress = async (
  clientId: string
): Promise<BPMNProgress> => {
  const { data } = await apiClient.get<BPMNProgress>(
    `/api/clients/${clientId}/bpmn-progress`
  );
  return data;
};

export const updateClientBpmnProgress = async (
  clientId: string,
  payload: Partial<BPMNProgress>
): Promise<BPMNProgress> => {
  const { data } = await apiClient.put<BPMNProgress>(
    `/api/clients/${clientId}/bpmn-progress`,
    payload
  );
  return data;
};

export const initializeBpmnProgress = async (
  clientId: string,
  payload: { startingSubprocess?: string }
): Promise<BPMNProgress> => {
  const { data } = await apiClient.post<BPMNProgress>(
    `/api/clients/${clientId}/bpmn-progress`,
    payload
  );
  return data;
};

export const getBpmnSubprocessClients = async (
  subprocessId: string
): Promise<BPMNProgress[]> => {
  const { data } = await apiClient.get<BPMNProgress[]>(
    `/api/bpmn/subprocess/${subprocessId}/clients`
  );
  return data;
};

export const getPerformanceSummary = async (campaignId: string): Promise<PerformanceSummary> => {
  return getCampaignPerformanceSummary(campaignId);
};

export const getClientPerformance = async (
  clientId: string
): Promise<ClientPerformanceSummary> => {
  return getClientPerformanceSummary(clientId);
};

export const getBPMNProgress = async (clientId: string): Promise<BPMNProgress> => {
  return getClientBpmnProgress(clientId);
};

export const updateBPMNProgress = async (
  clientId: string,
  updates: Partial<BPMNProgress>
): Promise<BPMNProgress> => {
  return updateClientBpmnProgress(clientId, updates);
};

export const generateReport = async (
  clientId: string,
  payload: { month: number; year: number }
): Promise<MonthlyReport> => {
  const { data } = await apiClient.post<MonthlyReport>(
    `/api/reports/generate/${clientId}`,
    payload
  );
  return data;
};

export const generateWeeklyReport = async (
  clientId: string,
  payload: { startDate: string; endDate: string }
): Promise<MonthlyReport> => {
  const { data } = await apiClient.post<MonthlyReport>(
    `/api/reports/generate-weekly/${clientId}`,
    payload,
    { timeout: 0 }
  );
  return data;
};

export const getReportsHistory = async (clientId: string): Promise<MonthlyReport[]> => {
  const { data } = await apiClient.get<MonthlyReport[]>(
    `/api/reports/${clientId}/history`
  );
  return data;
};

export const getReportDownloadUrl = (reportId: string): string => {
  return `${API_BASE_URL}/api/reports/${reportId}/download`;
};

// Processes
export const getProcesses = async (): Promise<ProcessInstance[]> => {
  const { data } = await apiClient.get<ProcessInstance[]>('/api/processes');
  return data;
};

export const getProcessById = async (id: string): Promise<ProcessInstance & { tasks: Task[] }> => {
  const { data } = await apiClient.get<ProcessInstance & { tasks: Task[] }>(`/api/processes/${id}`);
  return data;
};

// Tasks
export const getTasks = async (status?: string): Promise<Task[]> => {
  const params = status ? { status } : {};
  const { data } = await apiClient.get<Task[]>('/api/tasks', { params });
  return data;
};

// Dashboard Stats
export const getDashboardStats = async (): Promise<DashboardStats> => {
  const { data } = await apiClient.get<DashboardStats>('/api/dashboard/stats');
  return data;
};

// Dashboard Overview + Alerts
export const getDashboardOverview = async (): Promise<DashboardOverview> => {
  const { data } = await apiClient.get<DashboardOverview>('/api/dashboard/overview');
  return data;
};

export const getAlerts = async (): Promise<AlertsResponse> => {
  const { data } = await apiClient.get<AlertsResponse>('/api/alerts');
  return data;
};

// Lead Tracking (for service businesses - law firms, consulting, etc.)
import type { LeadTrackingData } from '@/types';

export const upsertLeadTracking = async (
  payload: Omit<LeadTrackingData, 'id' | 'leadQualificationRate' | 'closingRate' | 'roi' | 'costPerContract' | 'createdAt' | 'updatedAt'>
): Promise<LeadTrackingData> => {
  const { data } = await apiClient.post<LeadTrackingData>('/api/lead-tracking', payload);
  return data;
};

export const getLeadTracking = async (
  campaignId: string,
  options?: {
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  }
): Promise<LeadTrackingData[]> => {
  const { data } = await apiClient.get<LeadTrackingData[]>(
    `/api/campaigns/${campaignId}/lead-tracking`,
    { params: options }
  );
  return data;
};

export const getLeadSummary = async (
  campaignId: string,
  startDate: string,
  endDate: string
): Promise<{
  totalQualifiedLeads: number;
  totalContractsClosed: number;
  totalRevenue: number;
  avgQualificationRate: number;
  avgClosingRate: number;
  avgROI: number;
  avgCostPerContract: number;
}> => {
  const { data } = await apiClient.get(
    `/api/campaigns/${campaignId}/lead-summary`,
    { params: { startDate, endDate } }
  );
  return data;
};

export const deleteLeadTracking = async (campaignId: string, date: string): Promise<void> => {
  await apiClient.delete(`/api/campaigns/${campaignId}/lead-tracking`, {
    params: { date },
  });
};

// Ad Set Metrics
export const getAdSetMetrics = async (
  campaignId: string,
  query?: MetricsQueryInput
): Promise<{ campaignId: string; total: number; adsets: any[] }> => {
  const params = normalizeMetricsQuery(query);
  const { data } = await apiClient.get(
    `/api/campaigns/${campaignId}/adset-metrics`,
    params ? { params } : undefined
  );
  return data;
};

// Ad Creative Metrics
export const getAdMetrics = async (
  campaignId: string,
  query?: MetricsQueryInput
): Promise<{ campaignId: string; total: number; ads: any[] }> => {
  const params = normalizeMetricsQuery(query);
  const { data } = await apiClient.get(
    `/api/campaigns/${campaignId}/ad-metrics`,
    params ? { params } : undefined
  );
  return data;
};

// Breakdowns (demographics, placements, device)
export const getBreakdowns = async (
  campaignId: string,
  type: 'age_gender' | 'platform_position' | 'device',
  query?: MetricsQueryInput
): Promise<{ campaignId: string; breakdownType: string; total: number; segments: any[] }> => {
  const params = normalizeMetricsQuery(query);
  const { data } = await apiClient.get(
    `/api/campaigns/${campaignId}/breakdowns/${type}`,
    params ? { params } : undefined
  );
  return data;
};

// Temporal Analysis
export const getTemporalAnalysis = async (
  campaignId: string,
  query?: MetricsQueryInput
): Promise<{
  campaignId: string;
  byDayOfWeek: any[];
  bestDay: string | null;
  worstDay: string | null;
  cheapestDay: string | null;
  mostExpensiveDay: string | null;
}> => {
  const params = normalizeMetricsQuery(query);
  const { data } = await apiClient.get(
    `/api/campaigns/${campaignId}/temporal-analysis`,
    params ? { params } : undefined
  );
  return data;
};

// Business Metrics (CAC, LTV)
export const getBusinessMetrics = async (
  campaignId: string,
  query?: MetricsQueryInput
): Promise<{
  campaignId: string;
  totalSpend: number;
  totalConversations: number;
  totalContracts: number;
  totalRevenue: number;
  avgTicket: number;
  cac: number;
  costPerLead: number;
  conversionRate: number;
  ltv: number;
  ltvCacRatio: number;
  ltvCacHealth: string;
  roi: number;
  config: { lifetimeMonths: number; monthlyRevenue: number };
}> => {
  const params = normalizeMetricsQuery(query);
  const { data } = await apiClient.get(
    `/api/campaigns/${campaignId}/business-metrics`,
    params ? { params } : undefined
  );
  return data;
};

// Sync Meta Ads
export const syncMetaAds = async (
  options: {
    accountId?: string;
    clientId?: string;
    since?: string;
    until?: string;
    syncLevel?: 'campaign' | 'adset' | 'ad' | 'full';
    dryRun?: boolean;
    async?: boolean;
  }
): Promise<{
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
  // Sync can legitimately take minutes for large date ranges, so override the default 10s timeout.
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

export default apiClient;
