import type {
  AdMetricsResponse,
  AdSetMetricsResponse,
  BreakdownResponse,
  CreativeCopyInsightsResponse,
  CreativeLibraryResponse,
  OptimizationCenterPlaybook,
  OptimizationCenterResponse,
  TemporalAnalysisResponse,
  AbTestSuggestionsResponse,
  ZeroConversationsDiagnostic,
  CampaignBenchmarksResponse,
  CreativeBenchmarkResponse,
  ComplianceRiskResponse,
  AiInsightsResponse,
} from '@/types';

import { apiClient } from './http';
import { normalizeMetricsQuery, type MetricsQueryInput } from './metrics-query';

export const getAdSetMetrics = async (campaignId: string, query?: MetricsQueryInput): Promise<AdSetMetricsResponse> => {
  const params = normalizeMetricsQuery(query);
  const { data } = await apiClient.get<AdSetMetricsResponse>(`/api/campaigns/${campaignId}/adset-metrics`, params ? { params } : undefined);
  return data;
};

export const getAdMetrics = async (campaignId: string, query?: MetricsQueryInput): Promise<AdMetricsResponse> => {
  const params = normalizeMetricsQuery(query);
  const { data } = await apiClient.get<AdMetricsResponse>(`/api/campaigns/${campaignId}/ad-metrics`, params ? { params } : undefined);
  return data;
};

export const getCreativeLibrary = async (clientId: string, query?: MetricsQueryInput): Promise<CreativeLibraryResponse> => {
  const params = normalizeMetricsQuery(query);
  const { data } = await apiClient.get<CreativeLibraryResponse>(`/api/clients/${clientId}/creative-library`, params ? { params } : undefined);
  return data;
};

export const getOptimizationCenter = async (clientId: string, query?: MetricsQueryInput): Promise<OptimizationCenterResponse> => {
  const params = normalizeMetricsQuery(query);
  const { data } = await apiClient.get<OptimizationCenterResponse>(`/api/clients/${clientId}/optimization-center`, params ? { params } : undefined);
  return data;
};

export const getOptimizationCenterPlaybook = async (): Promise<OptimizationCenterPlaybook> => {
  const { data } = await apiClient.get<OptimizationCenterPlaybook>('/api/playbooks/optimization-center');
  return data;
};

export const getCreativeCopyInsights = async (snapshotId: string): Promise<CreativeCopyInsightsResponse> => {
  const { data } = await apiClient.get<CreativeCopyInsightsResponse>(`/api/creative-snapshots/${snapshotId}/copy-insights`);
  return data;
};

export const generateCreativeCopyInsights = async (
  snapshotId: string,
  options?: { themeKey?: string; themeName?: string; force?: boolean }
): Promise<{ success: boolean; snapshotId: string; status?: string; reused?: boolean }> => {
  const { data } = await apiClient.post(`/api/creative-snapshots/${snapshotId}/copy-insights`, options ?? {});
  return data;
};

export const getBreakdowns = async (
  campaignId: string,
  type: 'age_gender' | 'platform_position' | 'device' | 'region' | 'country',
  query?: MetricsQueryInput
): Promise<BreakdownResponse> => {
  const params = normalizeMetricsQuery(query);
  const { data } = await apiClient.get<BreakdownResponse>(`/api/campaigns/${campaignId}/breakdowns/${type}`, params ? { params } : undefined);
  return data;
};

export const getTemporalAnalysis = async (campaignId: string, query?: MetricsQueryInput): Promise<TemporalAnalysisResponse> => {
  const params = normalizeMetricsQuery(query);
  const { data } = await apiClient.get<TemporalAnalysisResponse>(
    `/api/campaigns/${campaignId}/temporal-analysis`,
    params ? { params } : undefined
  );
  return data;
};

export type CreativeWinnerPattern = {
  headline: string | null;
  primaryText: string | null;
  ctaType: string | null;
  imageUrl: string | null;
  totalSpend: number;
  totalConversations: number;
  cpl: number | null;
  campaigns: string[];
  variantCount: number;
};

export type CreativeWinnersResponse = {
  clientId: string;
  period: { start: string; end: string };
  total: number;
  winners: CreativeWinnerPattern[];
};

export const getCreativeWinners = async (
  clientId: string,
  params?: { period?: string; limit?: string }
): Promise<CreativeWinnersResponse> => {
  const { data } = await apiClient.get<CreativeWinnersResponse>(
    `/api/clients/${clientId}/creative-winners`,
    params ? { params } : undefined
  );
  return data;
};

export type CopyValidationIssue = {
  ruleId: string;
  severity: 'error' | 'warning' | 'info';
  title: string;
  message: string;
  suggestion?: string;
};

export type CopyValidationResult = {
  valid: boolean;
  score: number;
  issues: CopyValidationIssue[];
  summary: { errors: number; warnings: number; info: number };
  theme: { themeKey: string; themeName: string } | null;
};

export const validateCreativeCopy = async (input: {
  headline?: string;
  primaryText?: string;
  description?: string;
  ctaType?: string;
  themeKey?: string;
}): Promise<CopyValidationResult> => {
  const { data } = await apiClient.post<CopyValidationResult>('/api/creative-linter/validate', input);
  return data;
};

export type CopySuggestion = {
  headline: string;
  primaryText: string;
  cta: string;
  angle: string;
};

export type CopyGeneratorResponse = {
  clientId: string;
  themeKey: string;
  themeName: string;
  aiUsed: boolean;
  promptId?: string;
  promptVersion?: string;
  suggestions: CopySuggestion[];
  winnerContext: { count: number; avgCpl: number | null; topHeadlines: string[] };
};

export const generateCopySuggestions = async (
  clientId: string,
  input?: { themeKey?: string; campaignId?: string; count?: number }
): Promise<CopyGeneratorResponse> => {
  const { data } = await apiClient.post<CopyGeneratorResponse>(
    `/api/clients/${clientId}/copy-suggestions`,
    input ?? {}
  );
  return data;
};

export type AudienceSegment = {
  segment: string;
  spend: number;
  conversations: number;
  cpl: number | null;
  spendShare: number;
  impressions: number;
};

export type AudienceInsightsResponse = {
  clientId: string;
  campaignId: string;
  period: { start: string; end: string };
  totalSpend: number;
  totalConversations: number;
  avgCpl: number | null;
  bestSegments: AudienceSegment[];
  wastefulSegments: AudienceSegment[];
  allSegments: AudienceSegment[];
  recommendation: string | null;
};

export const getAudienceInsights = async (
  clientId: string,
  params: { campaignId: string; period?: string }
): Promise<AudienceInsightsResponse> => {
  const { data } = await apiClient.get<AudienceInsightsResponse>(
    `/api/clients/${clientId}/audience-insights`,
    { params }
  );
  return data;
};

export const getZeroConversationsDiagnostic = async (
  clientId: string,
  params: {
    campaignId?: string;
    adsetId?: string;
    period?: string;
    startDate?: string;
    endDate?: string;
  }
): Promise<ZeroConversationsDiagnostic> => {
  const { data } = await apiClient.get<ZeroConversationsDiagnostic>(
    `/api/clients/${clientId}/diagnostics/zero-conversations`,
    { params }
  );
  return data;
};

export const getAbTestSuggestions = async (
  snapshotId: string,
  params?: { period?: string; startDate?: string; endDate?: string; force?: boolean }
): Promise<AbTestSuggestionsResponse> => {
  const query = params
    ? {
        period: params.period,
        startDate: params.startDate,
        endDate: params.endDate,
        force: params.force ? 'true' : undefined,
      }
    : undefined;
  const { data } = await apiClient.get<AbTestSuggestionsResponse>(
    `/api/creative-snapshots/${snapshotId}/ab-test-suggestions`,
    query ? { params: query } : undefined
  );
  return data;
};

export const getCampaignBenchmarks = async (
  clientId: string,
  params?: { period?: string; startDate?: string; endDate?: string; baselineDays?: number }
): Promise<CampaignBenchmarksResponse> => {
  const query = params
    ? {
        period: params.period,
        startDate: params.startDate,
        endDate: params.endDate,
        baselineDays: params.baselineDays != null ? String(params.baselineDays) : undefined,
      }
    : undefined;
  const { data } = await apiClient.get<CampaignBenchmarksResponse>(
    `/api/clients/${clientId}/benchmarks/campaigns`,
    query ? { params: query } : undefined
  );
  return data;
};

export const getCreativeBenchmark = async (
  snapshotId: string,
  params?: { period?: string; startDate?: string; endDate?: string; baselineDays?: number }
): Promise<CreativeBenchmarkResponse> => {
  const query = params
    ? {
        period: params.period,
        startDate: params.startDate,
        endDate: params.endDate,
        baselineDays: params.baselineDays != null ? String(params.baselineDays) : undefined,
      }
    : undefined;
  const { data } = await apiClient.get<CreativeBenchmarkResponse>(
    `/api/creative-snapshots/${snapshotId}/benchmark`,
    query ? { params: query } : undefined
  );
  return data;
};

export const getComplianceRisk = async (
  clientId: string,
  params?: { period?: string; startDate?: string; endDate?: string; campaignId?: string }
): Promise<ComplianceRiskResponse> => {
  const query = params
    ? {
        period: params.period,
        startDate: params.startDate,
        endDate: params.endDate,
        campaignId: params.campaignId,
      }
    : undefined;
  const { data } = await apiClient.get<ComplianceRiskResponse>(
    `/api/clients/${clientId}/compliance-risk`,
    query ? { params: query } : undefined
  );
  return data;
};

export const getCampaignAiInsights = async (
  campaignId: string,
  params?: { period?: string; startDate?: string; endDate?: string; force?: boolean }
): Promise<AiInsightsResponse> => {
  const query = params
    ? {
        period: params.period,
        startDate: params.startDate,
        endDate: params.endDate,
        force: params.force ? 'true' : undefined,
      }
    : undefined;
  const { data } = await apiClient.get<AiInsightsResponse>(
    `/api/campaigns/${campaignId}/ai-insights`,
    query ? { params: query } : undefined
  );
  return data;
};

export const getCreativeAiInsights = async (
  snapshotId: string,
  params?: { period?: string; startDate?: string; endDate?: string; force?: boolean }
): Promise<AiInsightsResponse> => {
  const query = params
    ? {
        period: params.period,
        startDate: params.startDate,
        endDate: params.endDate,
        force: params.force ? 'true' : undefined,
      }
    : undefined;
  const { data } = await apiClient.get<AiInsightsResponse>(
    `/api/creative-snapshots/${snapshotId}/ai-insights`,
    query ? { params: query } : undefined
  );
  return data;
};

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
  const { data } = await apiClient.get(`/api/campaigns/${campaignId}/business-metrics`, params ? { params } : undefined);
  return data;
};
