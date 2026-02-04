'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Activity, BarChart3, TrendingUp, FileText, PlusCircle, RefreshCw } from 'lucide-react';
import {
  getCampaignMetrics,
  getClientById,
  getClientBpmnProgress,
  getClientPerformanceSummary,
  getLeadTracking,
  getAdSetMetrics,
  getAdMetrics,
  getCreativeLibrary,
  getOptimizationCenter,
  getBreakdowns,
  getTemporalAnalysis,
  getBusinessMetrics,
  syncMetaAds,
  getMetaSyncDetails,
  getMetaSyncHistory,
  type MetaSyncDetails,
} from '@/lib/api/client';
import type {
  ClientPerformanceSummary,
  DailyMetric,
  AdSetMetric,
  AdCreativeMetric,
  BreakdownSegment,
  TemporalAnalysisResponse,
  BusinessMetricsResponse,
  MetricsPeriod,
  MetricsQuery,
  BPMNProgress,
  LeadTrackingData,
  CreativeLibraryResponse,
  OptimizationCenterResponse,
} from '@/types';
import { MetricsCard } from '@/components/performance/metrics-card';
import { PerformanceChart } from '@/components/performance/performance-chart';
import { BpmnProgressTracker } from '@/components/performance/bpmn-progress-tracker';
import { CampaignTable } from '@/components/performance/campaign-table';
import { LeadGenMetricsCard } from '@/components/performance/lead-gen-metrics-card';
import { CampaignHealthCard } from '@/components/performance/campaign-health-card';
import { AdSetTable } from '@/components/performance/adset-table';
import { CreativePerformanceTable } from '@/components/performance/creative-performance-table';
import { CreativeLibrary } from '@/components/performance/creative-library';
import { OptimizationCenter } from '@/components/performance/optimization-center';
import { DemographicsChart } from '@/components/performance/demographics-chart';
import { TemporalAnalysis } from '@/components/performance/temporal-analysis';
import { BusinessMetricsCard } from '@/components/performance/business-metrics-card';
import { LeadTrackingForm } from '@/components/performance/lead-tracking-form';
import { ReportGenerator } from '@/components/reports/report-generator';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const periodOptions: Array<{ value: MetricsPeriod; label: string }> = [
  { value: '7d', label: 'Últimos 7 dias' },
  { value: '14d', label: 'Últimos 14 dias' },
  { value: '30d', label: 'Últimos 30 dias' },
  { value: '60d', label: 'Últimos 60 dias' },
  { value: '90d', label: 'Últimos 90 dias' },
  { value: 'custom', label: 'Personalizado' },
];

const formatCurrency = (value: number) => {
  if (!Number.isFinite(value)) return '-';
  return `R$ ${value.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`;
};

const formatPercent = (value: number) => {
  if (!Number.isFinite(value)) return '-';
  const normalized = value <= 1 ? value * 100 : value;
  return `${normalized.toFixed(2)}%`;
};

const formatNumber = (value: number) => {
  if (!Number.isFinite(value)) return '-';
  return value.toLocaleString();
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const getApiErrorMessage = (err: unknown, fallback: string) => {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data;
    if (isRecord(data) && typeof data.message === 'string') return data.message;
    if (typeof data === 'string' && data.toLowerCase().includes('<html')) {
      return 'API retornou HTML em vez de JSON. Verifique NEXT_PUBLIC_API_URL e se o backend Fastify está rodando.';
    }
  }

  if (err instanceof Error) return err.message;
  return fallback;
};

const toIsoDate = (value: Date) => value.toISOString().split('T')[0];

const getDateRangeFromPeriod = (value: MetricsPeriod): { startDate: string; endDate: string } => {
  const end = new Date();
  const start = new Date();

  switch (value) {
    case '7d':
      start.setDate(end.getDate() - 7);
      break;
    case '14d':
      start.setDate(end.getDate() - 14);
      break;
    case '30d':
      start.setDate(end.getDate() - 30);
      break;
    case '60d':
      start.setDate(end.getDate() - 60);
      break;
    case '90d':
      start.setDate(end.getDate() - 90);
      break;
    default:
      start.setDate(end.getDate() - 30);
  }

  return { startDate: toIsoDate(start), endDate: toIsoDate(end) };
};

const shiftIsoDateUtc = (isoDate: string, days: number) => {
  const date = new Date(`${isoDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return toIsoDate(date);
};

const resolveMetricsRange = (
  query: MetricsQuery,
  fallbackPeriod: MetricsPeriod
): { startDate: string; endDate: string } => {
  if (query.startDate && query.endDate) {
    return { startDate: query.startDate, endDate: query.endDate };
  }

  const resolvedPeriod: MetricsPeriod =
    query.period && query.period !== 'custom' ? query.period : fallbackPeriod;

  if (resolvedPeriod !== 'custom') return getDateRangeFromPeriod(resolvedPeriod);
  return getDateRangeFromPeriod('30d');
};

const getLastWeekRange = (
  query: MetricsQuery,
  fallbackPeriod: MetricsPeriod
): { startDate: string; endDate: string } => {
  const range = resolveMetricsRange(query, fallbackPeriod);
  const endDate = range.endDate;
  const startDateBase = shiftIsoDateUtc(endDate, -6);
  const startDate = startDateBase < range.startDate ? range.startDate : startDateBase;
  return { startDate, endDate };
};

export default function ClientPerformancePage() {
  const params = useParams();
  const clientId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [summary, setSummary] = useState<ClientPerformanceSummary | null>(null);
  const [bpmnProgress, setBpmnProgress] = useState<BPMNProgress | null>(null);
  const [dailyMetrics, setDailyMetrics] = useState<DailyMetric[]>([]);
  const [leadTrackingData, setLeadTrackingData] = useState<LeadTrackingData[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [period, setPeriod] = useState<MetricsPeriod>('30d');
  const [customStartDate, setCustomStartDate] = useState(() => getDateRangeFromPeriod('30d').startDate);
  const [customEndDate, setCustomEndDate] = useState(() => getDateRangeFromPeriod('30d').endDate);
  const [metricsQuery, setMetricsQuery] = useState<MetricsQuery>({ period: '30d' });
  const [loading, setLoading] = useState(true);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);
  const [openReportGenerator, setOpenReportGenerator] = useState(false);
  const [showTrackingForm, setShowTrackingForm] = useState(false);
  const [adsetData, setAdsetData] = useState<AdSetMetric[]>([]);
  const [adsetLoading, setAdsetLoading] = useState(false);
  const [adCreativeData, setAdCreativeData] = useState<AdCreativeMetric[]>([]);
  const [adCreativeLoading, setAdCreativeLoading] = useState(false);
  const [creativeLibraryScope, setCreativeLibraryScope] = useState<'campaign' | 'client'>('campaign');
  const [creativeLibraryData, setCreativeLibraryData] = useState<CreativeLibraryResponse | null>(null);
  const [creativeLibraryLoading, setCreativeLibraryLoading] = useState(true);
  const [optimizationData, setOptimizationData] = useState<OptimizationCenterResponse | null>(null);
  const [optimizationLoading, setOptimizationLoading] = useState(true);
  const [ageGenderData, setAgeGenderData] = useState<BreakdownSegment[]>([]);
  const [placementData, setPlacementData] = useState<BreakdownSegment[]>([]);
  const [breakdownLoading, setBreakdownLoading] = useState(false);
  const [temporalData, setTemporalData] = useState<TemporalAnalysisResponse | null>(null);
  const [temporalLoading, setTemporalLoading] = useState(false);
  const [temporalLastWeekData, setTemporalLastWeekData] = useState<TemporalAnalysisResponse | null>(null);
  const [temporalLastWeekLoading, setTemporalLastWeekLoading] = useState(false);
  const [businessData, setBusinessData] = useState<BusinessMetricsResponse | null>(null);
  const [businessLoading, setBusinessLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [metaSyncDetails, setMetaSyncDetails] = useState<MetaSyncDetails | null>(null);
  const [metaLastSuccessfulSync, setMetaLastSuccessfulSync] = useState<string | null>(null);
  const [metaSyncHistoryLoading, setMetaSyncHistoryLoading] = useState(false);
  const [metaAdAccountId, setMetaAdAccountId] = useState('');
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const loadClientMetaAccount = async () => {
      if (!clientId) return;
      try {
        const client = await getClientById(String(clientId));
        if (!mountedRef.current) return;
        setMetaAdAccountId(client.metaAdAccountId?.trim?.() ? client.metaAdAccountId.trim() : '');
      } catch {
        // Non-fatal: the dashboard can still load metrics without the client details request.
        if (mountedRef.current) setMetaAdAccountId('');
      }
    };

    loadClientMetaAccount();
  }, [clientId]);

  useEffect(() => {
    const loadSummary = async () => {
      if (!clientId) return;

      try {
        setRefreshing(true);
        const [summaryData, progressData] = await Promise.all([
          getClientPerformanceSummary(String(clientId), metricsQuery),
          getClientBpmnProgress(String(clientId)),
        ]);
        setSummary(summaryData);
        setBpmnProgress(progressData);
        setError(null);
        setLastUpdatedAt(new Date().toISOString());
      } catch (err) {
        setError(getApiErrorMessage(err, 'Failed to load performance data'));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    };

    loadSummary();
  }, [clientId, metricsQuery]);

  const resolvedRange = useMemo(() => {
    const range = resolveMetricsRange(metricsQuery, period);
    if (!range.startDate || !range.endDate) return null;
    return range;
  }, [metricsQuery, period]);

  useEffect(() => {
    const accountId = metaAdAccountId.trim();
    if (!accountId) {
      setMetaSyncDetails(null);
      setMetaLastSuccessfulSync(null);
      return;
    }

    let cancelled = false;
    const loadHistory = async () => {
      try {
        setMetaSyncHistoryLoading(true);
        const response = await getMetaSyncHistory({ accountId, limit: 1 });
        if (cancelled || !mountedRef.current) return;
        setMetaSyncDetails(response.history?.[0] ?? null);
        setMetaLastSuccessfulSync(response.lastSuccessfulSync ?? null);
      } catch {
        if (cancelled || !mountedRef.current) return;
        setMetaLastSuccessfulSync(null);
      } finally {
        if (!cancelled && mountedRef.current) setMetaSyncHistoryLoading(false);
      }
    };

    loadHistory();

    return () => {
      cancelled = true;
    };
  }, [metaAdAccountId]);

  useEffect(() => {
    if (!summary || summary.campaigns.length === 0) {
      setDailyMetrics([]);
      return;
    }

    if (!selectedCampaignId) {
      setSelectedCampaignId(summary.campaigns[0].campaignId);
    }
  }, [summary, selectedCampaignId]);

  useEffect(() => {
    const loadMetrics = async () => {
      if (!selectedCampaignId) return;

      try {
        setMetricsLoading(true);
        const metrics = await getCampaignMetrics(selectedCampaignId, metricsQuery);
        setDailyMetrics(metrics);
      } catch (err) {
        setError(getApiErrorMessage(err, 'Failed to load campaign metrics'));
      } finally {
        setMetricsLoading(false);
      }
    };

    loadMetrics();
  }, [selectedCampaignId, metricsQuery]);

  useEffect(() => {
    if (!selectedCampaignId) return;
    loadLeadTracking(selectedCampaignId, metricsQuery);
  }, [selectedCampaignId, metricsQuery]);

  useEffect(() => {
    if (!selectedCampaignId) return;
    const loadAdSets = async () => {
      try {
        setAdsetLoading(true);
        const result = await getAdSetMetrics(selectedCampaignId, metricsQuery);
        setAdsetData(result.adsets ?? []);
      } catch (err) {
        console.error('Error loading ad set metrics:', err);
        setAdsetData([]);
      } finally {
        setAdsetLoading(false);
      }
    };
    loadAdSets();
  }, [selectedCampaignId, metricsQuery]);

  // Load ad creative metrics
  useEffect(() => {
    if (!selectedCampaignId) return;
    const loadAdCreatives = async () => {
      try {
        setAdCreativeLoading(true);
        const result = await getAdMetrics(selectedCampaignId, metricsQuery);
        setAdCreativeData(result.ads ?? []);
      } catch (err) {
        console.error('Error loading ad creative metrics:', err);
        setAdCreativeData([]);
      } finally {
        setAdCreativeLoading(false);
      }
    };
    loadAdCreatives();
  }, [selectedCampaignId, metricsQuery]);

  // Ensure scope is valid when no campaign is selected
  useEffect(() => {
    if (!selectedCampaignId && creativeLibraryScope === 'campaign') {
      setCreativeLibraryScope('client');
    }
  }, [selectedCampaignId, creativeLibraryScope]);

  // Load creative library (aggregated by snapshot)
  useEffect(() => {
    if (!clientId) return;

    const loadCreativeLibrary = async () => {
      try {
        setCreativeLibraryLoading(true);
        const query: MetricsQuery = { ...metricsQuery };
        if (creativeLibraryScope === 'campaign' && selectedCampaignId) query.campaignId = selectedCampaignId;
        else delete query.campaignId;

        const result = await getCreativeLibrary(String(clientId), query);
        setCreativeLibraryData(result);
      } catch (err) {
        console.error('Error loading creative library:', err);
        setCreativeLibraryData(null);
      } finally {
        setCreativeLibraryLoading(false);
      }
    };

    loadCreativeLibrary();
  }, [clientId, creativeLibraryScope, metricsQuery, selectedCampaignId]);

  // Load optimization center (playbook recommendations)
  useEffect(() => {
    if (!clientId) return;

    const loadOptimization = async () => {
      try {
        setOptimizationLoading(true);
        const query: MetricsQuery = { ...metricsQuery };
        if (selectedCampaignId) query.campaignId = selectedCampaignId;
        else delete query.campaignId;

        const result = await getOptimizationCenter(String(clientId), query);
        setOptimizationData(result);
      } catch (err) {
        console.error('Error loading optimization center:', err);
        setOptimizationData(null);
      } finally {
        setOptimizationLoading(false);
      }
    };

    loadOptimization();
  }, [clientId, metricsQuery, selectedCampaignId]);

  // Load breakdown data (demographics + placements)
  useEffect(() => {
    if (!selectedCampaignId) return;
    const loadBreakdowns = async () => {
      try {
        setBreakdownLoading(true);
        const [ageGender, placements] = await Promise.allSettled([
          getBreakdowns(selectedCampaignId, 'age_gender', metricsQuery),
          getBreakdowns(selectedCampaignId, 'platform_position', metricsQuery),
        ]);
        setAgeGenderData(ageGender.status === 'fulfilled' ? ageGender.value.segments : []);
        setPlacementData(placements.status === 'fulfilled' ? placements.value.segments : []);
      } catch (err) {
        console.error('Error loading breakdowns:', err);
        setAgeGenderData([]);
        setPlacementData([]);
      } finally {
        setBreakdownLoading(false);
      }
    };
    loadBreakdowns();
  }, [selectedCampaignId, metricsQuery]);

  // Load temporal analysis
  useEffect(() => {
    if (!selectedCampaignId) return;
    const loadTemporal = async () => {
      try {
        setTemporalLoading(true);
        const result = await getTemporalAnalysis(selectedCampaignId, metricsQuery);
        setTemporalData(result);
      } catch (err) {
        console.error('Error loading temporal analysis:', err);
        setTemporalData(null);
      } finally {
        setTemporalLoading(false);
      }
    };
    loadTemporal();
  }, [selectedCampaignId, metricsQuery]);

  // Load last-week temporal analysis (based on current date range end)
  useEffect(() => {
    if (!selectedCampaignId) return;
    const loadTemporalLastWeek = async () => {
      try {
        setTemporalLastWeekLoading(true);
        const lastWeekRange = getLastWeekRange(metricsQuery, period);
        const result = await getTemporalAnalysis(selectedCampaignId, lastWeekRange);
        setTemporalLastWeekData(result);
      } catch (err) {
        console.error('Error loading last-week temporal analysis:', err);
        setTemporalLastWeekData(null);
      } finally {
        setTemporalLastWeekLoading(false);
      }
    };
    loadTemporalLastWeek();
  }, [selectedCampaignId, metricsQuery, period]);

  // Load business metrics (CAC, LTV)
  useEffect(() => {
    if (!selectedCampaignId) return;
    const loadBusiness = async () => {
      try {
        setBusinessLoading(true);
        const result = await getBusinessMetrics(selectedCampaignId, metricsQuery);
        setBusinessData(result);
      } catch (err) {
        console.error('Error loading business metrics:', err);
        setBusinessData(null);
      } finally {
        setBusinessLoading(false);
      }
    };
    loadBusiness();
  }, [selectedCampaignId, metricsQuery]);

  const loadLeadTracking = async (campaignId: string, query: MetricsQuery) => {
    try {
      const resolvedPeriod: MetricsPeriod =
        query.period && query.period !== 'custom' ? query.period : '30d';

      const startDate = query.startDate ?? getDateRangeFromPeriod(resolvedPeriod).startDate;
      const endDate = query.endDate ?? getDateRangeFromPeriod(resolvedPeriod).endDate;

      const data = await getLeadTracking(campaignId, { startDate, endDate });
      setLeadTrackingData(data);
    } catch (err) {
      console.error('Error loading lead tracking:', err);
      setLeadTrackingData([]);
    }
  };

  const handleMetaSync = async () => {
    if (syncing) return;
    try {
      setSyncing(true);
      setMetaSyncDetails(null);
      setError(null);

      const accountId = metaAdAccountId.trim();
      if (!accountId) {
        throw new Error('Defina o Meta Ad Account ID deste cliente para sincronizar.');
      }
      const resolvedPeriod: MetricsPeriod =
        metricsQuery.period && metricsQuery.period !== 'custom' ? metricsQuery.period : period;
      const resolvedRange =
        metricsQuery.startDate && metricsQuery.endDate
          ? { since: metricsQuery.startDate, until: metricsQuery.endDate }
          : resolvedPeriod !== 'custom'
            ? (() => {
                const range = getDateRangeFromPeriod(resolvedPeriod);
                return { since: range.startDate, until: range.endDate };
              })()
            : undefined;

      if (resolvedRange) {
        const since = new Date(resolvedRange.since);
        const until = new Date(resolvedRange.until);
        const daysDiff = Math.floor((until.getTime() - since.getTime()) / (1000 * 60 * 60 * 24));
        const maxSyncDays = 365;

        if (Number.isNaN(since.getTime()) || Number.isNaN(until.getTime()) || daysDiff < 1) {
          throw new Error('Selecione um intervalo de datas válido (a data inicial deve ser anterior à final).');
        }

        if (daysDiff > maxSyncDays) {
          throw new Error(`Para sincronizar com a Meta, o intervalo máximo é de ${maxSyncDays} dias.`);
        }
      }

      // Trigger full sync to get ad creatives
      const syncResponse = await syncMetaAds({
        syncLevel: 'full',
        async: true,
        accountId,
        clientId: String(clientId),
        ...(resolvedRange ?? {}),
      });

      const syncId = syncResponse.syncId;
      if (!syncId) {
        throw new Error('A sincronização não retornou um syncId. Verifique o backend.');
      }

      const pollIntervalMs = 1500;
      const pollTimeoutMs = 30 * 60 * 1000; // 30 min
      const pollStart = Date.now();
      let finishedState: 'success' | 'partial' | null = null;

      // Poll sync status until completion
      while (Date.now() - pollStart < pollTimeoutMs) {
        const details = await getMetaSyncDetails(syncId);
        if (mountedRef.current) setMetaSyncDetails(details);

        const state = details.state ?? (details.completedAt ? details.status : 'running');
        if (state !== 'running') {
          if (state === 'failed') {
            const backendMessage =
              details.errorMessage ??
              (typeof details.metadata?.error === 'string' ? details.metadata.error : null) ??
              'Falha no sync.';
            throw new Error(backendMessage);
          }

          finishedState = state;
          break;
        }

        await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
      }

      if (!finishedState) {
        throw new Error('Tempo limite aguardando a sincronização com a Meta. Verifique o histórico de sync.');
      }

      // Refresh local data after completion
      await refreshAll();
    } catch (err) {
      console.error('Meta sync failed:', err);
      const message = getApiErrorMessage(err, 'Falha ao sincronizar com Meta Ads. Tente novamente.');
      if (
        message.toLowerCase().includes('error validating access token') ||
        message.toLowerCase().includes('session has expired') ||
        message.toLowerCase().includes('access token')
      ) {
        setError(
          'Meta Ads: token expirou/é inválido. Atualize META_ACCESS_TOKEN no `backend/.env` e reinicie o backend.'
        );
      } else {
        setError(`Meta Ads: ${message}`);
      }
    } finally {
      setSyncing(false);
    }
  };

  const refreshAll = async () => {
    if (!clientId || refreshing) return;
    try {
      setRefreshing(true);
      setError(null);
      const [summaryData, progressData] = await Promise.all([
        getClientPerformanceSummary(String(clientId), metricsQuery),
        getClientBpmnProgress(String(clientId)),
      ]);
      setSummary(summaryData);
      setBpmnProgress(progressData);

      try {
        setCreativeLibraryLoading(true);
        const query: MetricsQuery = { ...metricsQuery };
        const fallbackCampaignId = summaryData.campaigns?.[0]?.campaignId ?? null;
        const campaignIdForLibrary =
          creativeLibraryScope === 'campaign' ? selectedCampaignId ?? fallbackCampaignId : null;

        if (campaignIdForLibrary) query.campaignId = campaignIdForLibrary;
        else delete query.campaignId;

        const library = await getCreativeLibrary(String(clientId), query);
        setCreativeLibraryData(library);
      } catch (err) {
        console.error('Error refreshing creative library:', err);
      } finally {
        setCreativeLibraryLoading(false);
      }

      try {
        setOptimizationLoading(true);
        const query: MetricsQuery = { ...metricsQuery };
        if (selectedCampaignId) query.campaignId = selectedCampaignId;
        else delete query.campaignId;

        const optimization = await getOptimizationCenter(String(clientId), query);
        setOptimizationData(optimization);
      } catch (err) {
        console.error('Error refreshing optimization center:', err);
        setOptimizationData(null);
      } finally {
        setOptimizationLoading(false);
      }

      if (selectedCampaignId) {
        const lastWeekRange = getLastWeekRange(metricsQuery, period);
        const [metrics, adsets, ads, agBreak, plBreak, temporal, temporalLastWeek, business] = await Promise.allSettled([
          getCampaignMetrics(selectedCampaignId, metricsQuery),
          getAdSetMetrics(selectedCampaignId, metricsQuery),
          getAdMetrics(selectedCampaignId, metricsQuery),
          getBreakdowns(selectedCampaignId, 'age_gender', metricsQuery),
          getBreakdowns(selectedCampaignId, 'platform_position', metricsQuery),
          getTemporalAnalysis(selectedCampaignId, metricsQuery),
          getTemporalAnalysis(selectedCampaignId, lastWeekRange),
          getBusinessMetrics(selectedCampaignId, metricsQuery),
        ]);

        if (metrics.status === 'fulfilled') setDailyMetrics(metrics.value);
        if (adsets.status === 'fulfilled') setAdsetData(adsets.value.adsets || []);
        if (ads.status === 'fulfilled') setAdCreativeData(ads.value.ads || []);
        setAgeGenderData(agBreak.status === 'fulfilled' ? agBreak.value.segments : []);
        setPlacementData(plBreak.status === 'fulfilled' ? plBreak.value.segments : []);
        if (temporal.status === 'fulfilled') setTemporalData(temporal.value);
        if (temporalLastWeek.status === 'fulfilled') setTemporalLastWeekData(temporalLastWeek.value);
        if (business.status === 'fulfilled') setBusinessData(business.value);

        loadLeadTracking(selectedCampaignId, metricsQuery);
      }

      setLastUpdatedAt(new Date().toISOString());
    } catch (err) {
      console.error('Error refreshing dashboard:', err);
      setError(getApiErrorMessage(err, 'Falha ao atualizar os dados. Verifique o backend e tente novamente.'));
    } finally {
      setRefreshing(false);
    }
  };

  const selectedCampaign = useMemo(() => {
    return summary?.campaigns.find((campaign) => campaign.campaignId === selectedCampaignId);
  }, [summary, selectedCampaignId]);

  // Calculate aggregated lead tracking data
  const aggregatedLeadData = useMemo(() => {
    return leadTrackingData.reduce(
      (acc, curr) => {
        acc.qualifiedLeads += curr.qualifiedLeads || 0;
        acc.contractsClosed += curr.contractsClosed || 0;
        acc.totalRevenue += curr.revenueGenerated || 0;

        const reasons = curr.disqualificationReasons;
        if (reasons && typeof reasons === 'object') {
          for (const [key, value] of Object.entries(reasons)) {
            const count = typeof value === 'number' ? value : Number(value);
            if (!Number.isFinite(count) || count <= 0) continue;
            acc.disqualificationReasons[key] = (acc.disqualificationReasons[key] ?? 0) + count;
          }
        }

        return acc;
      },
      { qualifiedLeads: 0, contractsClosed: 0, totalRevenue: 0, disqualificationReasons: {} as Record<string, number> }
    );
  }, [leadTrackingData]);

  // Get campaign health metrics from selected campaign or summary
  const healthMetrics = useMemo(() => {
    if (selectedCampaign && selectedCampaignId) {
      const campaignData = summary?.campaigns.find(c => c.campaignId === selectedCampaignId);
      if (campaignData) {
        return {
          totalReach: campaignData.totalReach || 0,
          avgFrequency: campaignData.avgFrequency || 0,
          avgCpm: campaignData.avgCpm || 0,
          totalImpressions: campaignData.totalImpressions || 0,
          totalSpend: campaignData.totalSpend || 0,
          qualityRanking: campaignData.qualityRanking,
          engagementRateRanking: campaignData.engagementRateRanking,
          conversionRateRanking: campaignData.conversionRateRanking,
        };
      }
    }
    return {
      totalReach: summary?.totalReach || 0,
      avgFrequency: summary?.avgFrequency || 0,
      avgCpm: summary?.avgCpm || 0,
      totalImpressions: summary?.totalImpressions || 0,
      totalSpend: summary?.totalSpend || 0,
      qualityRanking: null,
      engagementRateRanking: null,
      conversionRateRanking: null,
    };
  }, [selectedCampaign, selectedCampaignId, summary]);

  // Get messaging metrics from selected campaign or summary
  const messagingMetrics = useMemo(() => {
    if (selectedCampaign && selectedCampaignId) {
      // Get from the selected campaign's performance summary
      const campaignData = summary?.campaigns.find(c => c.campaignId === selectedCampaignId);
      if (campaignData) {
        return {
          totalMessagingConversations: campaignData.totalMessagingConversations || 0,
          totalMessagingFirstReply: campaignData.totalMessagingFirstReply || 0,
          totalLinkClicks: campaignData.totalLinkClicks || 0,
          totalSpend: campaignData.totalSpend || 0,
        };
      }
    }

    // Fallback to summary totals
    return {
      totalMessagingConversations: summary?.totalMessagingConversations || 0,
      totalMessagingFirstReply: summary?.totalMessagingFirstReply || 0,
      totalLinkClicks: summary?.totalLinkClicks || 0,
      totalSpend: summary?.totalSpend || 0,
    };
  }, [selectedCampaign, selectedCampaignId, summary]);

  const metaSyncProgress = metaSyncDetails?.metadata?.progress;
  const metaSyncPercent =
    metaSyncProgress?.overallTotal && metaSyncProgress.overallTotal > 0
      ? Math.min(100, Math.round(((metaSyncProgress.overallCompleted ?? 0) / metaSyncProgress.overallTotal) * 100))
      : null;
  const metaSyncRange =
    metaSyncProgress?.currentSince && metaSyncProgress?.currentUntil
      ? `${metaSyncProgress.currentSince} → ${metaSyncProgress.currentUntil}`
      : null;
  const metaSyncMessage = metaSyncProgress?.message ?? 'Sincronizando com Meta Ads...';

  const metaCoverage = useMemo(() => {
    if (!resolvedRange) return null;
    if (!metaSyncDetails) {
      return { state: 'missing' as const, label: 'Meta: sem sync para este período' };
    }

    const state: 'running' | 'success' | 'failed' | 'partial' =
      metaSyncDetails.state ?? (metaSyncDetails.completedAt ? metaSyncDetails.status : 'running');

    const coversRange =
      metaSyncDetails.dateRangeStart <= resolvedRange.startDate &&
      metaSyncDetails.dateRangeEnd >= resolvedRange.endDate;

    if (!coversRange) {
      return { state: 'outdated' as const, label: 'Meta: fora do período' };
    }

    if (state === 'success') return { state, label: 'Meta: dados completos' };
    if (state === 'partial') {
      const unmapped = metaSyncDetails.unmappedCampaigns?.length ?? 0;
      return { state, label: unmapped > 0 ? `Meta: parcial (${unmapped} unmapped)` : 'Meta: parcial' };
    }
    if (state === 'failed') return { state, label: 'Meta: falha no sync' };
    return { state, label: 'Meta: sincronizando…' };
  }, [metaSyncDetails, resolvedRange]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Activity className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Loading performance dashboard...</p>
        </div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-destructive">Error</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{error ?? 'Client not found'}</p>
              <Button asChild className="mt-4">
                <Link href="/clients">Back to clients</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="icon-sm">
              <Link href={`/clients/${summary.clientId}`}>
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Performance Dashboard</h1>
              <p className="text-muted-foreground">{summary.clientName}</p>
              {lastUpdatedAt && (
                <p className="text-xs text-muted-foreground">
                  Última atualização: {new Date(lastUpdatedAt).toLocaleString('pt-BR')}
                </p>
              )}
              {(metaCoverage || metaSyncHistoryLoading || metaLastSuccessfulSync) && (
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  {metaCoverage && (
                    <Badge
                      variant="outline"
                      className={
                        metaCoverage.state === 'success'
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                          : metaCoverage.state === 'partial' || metaCoverage.state === 'running'
                            ? 'border-amber-200 bg-amber-50 text-amber-900'
                            : metaCoverage.state === 'failed'
                              ? 'border-rose-200 bg-rose-50 text-rose-800'
                              : 'text-muted-foreground'
                      }
                    >
                      {metaCoverage.label}
                    </Badge>
                  )}
                  {metaSyncHistoryLoading && (
                    <span className="text-xs text-muted-foreground">carregando sync…</span>
                  )}
                  {metaLastSuccessfulSync && (
                    <span className="text-xs text-muted-foreground">
                      Último sync OK: {new Date(metaLastSuccessfulSync).toLocaleString('pt-BR')}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={period}
              onValueChange={(value) => {
                const next = value as MetricsPeriod;

                setPeriod(next);

                if (next === 'custom') {
                  const basePeriod = period !== 'custom' ? period : '30d';
                  const range = getDateRangeFromPeriod(basePeriod);
                  setCustomStartDate(range.startDate);
                  setCustomEndDate(range.endDate);
                  setMetricsQuery({ period: 'custom', ...range });
                  return;
                }

                setMetricsQuery({ period: next });
              }}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                {periodOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {period === 'custom' && (
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="w-[150px]"
                />
                <span className="text-sm text-muted-foreground">até</span>
                <Input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="w-[150px]"
                />
                <Button
                  variant="outline"
                  onClick={() => {
                    if (!customStartDate || !customEndDate) {
                      setError('Selecione a data inicial e a data final.');
                      return;
                    }
                    if (customStartDate > customEndDate) {
                      setError('A data inicial deve ser anterior à data final.');
                      return;
                    }

                    setError(null);
                    setMetricsQuery({
                      period: 'custom',
                      startDate: customStartDate,
                      endDate: customEndDate,
                    });
                  }}
                  disabled={refreshing || syncing}
                >
                  Aplicar
                </Button>
              </div>
            )}
            <Button
              variant="outline"
              className="gap-2"
              onClick={refreshAll}
              disabled={refreshing || syncing}
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Atualizando...' : 'Recarregar'}
            </Button>
            <Input
              value={metaAdAccountId}
              placeholder="Meta Ad Account ID (configure no cliente)"
              className="w-[210px] font-mono text-xs"
              readOnly
            />
            {!metaAdAccountId.trim() && (
              <Button variant="outline" asChild>
                <Link href={`/clients/${String(clientId)}?tab=edit`}>Configurar Meta</Link>
              </Button>
            )}
            <Button
              variant="default"
              className="gap-2 bg-blue-600 hover:bg-blue-700"
              onClick={handleMetaSync}
              disabled={syncing || !metaAdAccountId.trim()}
            >
              <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Sincronizando...' : 'Sync Meta Ads (Full)'}
            </Button>
            {selectedCampaignId && (
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => setShowTrackingForm(!showTrackingForm)}
              >
                <PlusCircle className="h-4 w-4" />
                {showTrackingForm ? 'Ocultar' : 'Adicionar'} Dados do Funil
              </Button>
            )}
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => setOpenReportGenerator(true)}
            >
              <FileText className="h-4 w-4" />
              Gerar Relatório
            </Button>
          </div>
        </div>

        {syncing && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-blue-700">Meta Ads</p>
                <p className="text-sm text-blue-700/80">
                  {metaSyncMessage} {metaSyncPercent !== null ? `(${metaSyncPercent}%)` : ''}
                </p>
                {metaSyncRange && (
                  <p className="text-xs text-blue-700/70">{metaSyncRange}</p>
                )}
              </div>
              {metaSyncProgress?.stage && (
                <p className="text-xs text-blue-700/70">
                  {metaSyncProgress.stage}{' '}
                  {(metaSyncProgress.stageCompleted ?? 0)}/{(metaSyncProgress.stageTotal ?? 0)}
                </p>
              )}
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-destructive">Atenção</p>
                <p className="text-sm text-muted-foreground">{error}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setError(null)}>
                Fechar
              </Button>
            </div>
          </div>
        )}

        <OptimizationCenter data={optimizationData} loading={optimizationLoading} />

        {/* Lead Generation Metrics Card */}
        {selectedCampaignId && (
          <LeadGenMetricsCard
            totalMessagingConversations={messagingMetrics.totalMessagingConversations}
            totalMessagingFirstReply={messagingMetrics.totalMessagingFirstReply}
            totalLinkClicks={messagingMetrics.totalLinkClicks}
            totalSpend={messagingMetrics.totalSpend}
            hasManualTracking={leadTrackingData.length > 0}
            qualifiedLeads={aggregatedLeadData.qualifiedLeads}
            disqualificationReasons={
              Object.keys(aggregatedLeadData.disqualificationReasons).length > 0
                ? aggregatedLeadData.disqualificationReasons
                : null
            }
            contractsClosed={aggregatedLeadData.contractsClosed}
            totalRevenue={aggregatedLeadData.totalRevenue}
          />
        )}

        {/* Campaign Health Card */}
        {selectedCampaignId && (
          <CampaignHealthCard
            totalReach={healthMetrics.totalReach}
            avgFrequency={healthMetrics.avgFrequency}
            avgCpm={healthMetrics.avgCpm}
            totalImpressions={healthMetrics.totalImpressions}
            totalSpend={healthMetrics.totalSpend}
            qualityRanking={healthMetrics.qualityRanking}
            engagementRateRanking={healthMetrics.engagementRateRanking}
            conversionRateRanking={healthMetrics.conversionRateRanking}
          />
        )}

        {/* Lead Tracking Form */}
        {showTrackingForm && selectedCampaignId && selectedCampaign && (
          <LeadTrackingForm
            campaignId={selectedCampaignId}
            campaignName={selectedCampaign.campaignName}
            onSuccess={() => {
              setShowTrackingForm(false);
              loadLeadTracking(selectedCampaignId, metricsQuery);
            }}
          />
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">Tendência da Campanha</h2>
                <p className="text-sm text-muted-foreground">
                  {selectedCampaign ? selectedCampaign.campaignName : 'Nenhuma campanha selecionada'}
                </p>
              </div>
              {summary.campaigns.length > 1 && (
                <Select
                  value={selectedCampaignId ?? undefined}
                  onValueChange={(value) => setSelectedCampaignId(value)}
                >
                  <SelectTrigger className="w-[220px]">
                    <SelectValue placeholder="Selecione campanha" />
                  </SelectTrigger>
                  <SelectContent>
                    {summary.campaigns.map((campaign) => (
                      <SelectItem key={campaign.campaignId} value={campaign.campaignId}>
                        {campaign.campaignName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            {metricsLoading ? (
              <Card>
                <CardHeader>
                  <CardTitle>Carregando métricas...</CardTitle>
                </CardHeader>
                <CardContent className="flex h-[320px] items-center justify-center">
                  <Activity className="h-6 w-6 animate-spin text-muted-foreground" />
                </CardContent>
              </Card>
            ) : (
              <PerformanceChart data={dailyMetrics} title="Tendência de Performance" />
            )}
          </div>
          <BpmnProgressTracker progress={bpmnProgress} />
        </div>

        {/* Lead Tracking History */}
        {selectedCampaignId && leadTrackingData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Funil Manual</CardTitle>
              <CardDescription>Dados de qualificação e fechamento inseridos manualmente</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {leadTrackingData.map((record) => {
                  const disqualificationEntries = Object.entries(record.disqualificationReasons ?? {})
                    .filter(([, count]) => (Number.isFinite(count) ? count : 0) > 0)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 3);

                  const disqualificationText =
                    disqualificationEntries.length > 0
                      ? `Motivos: ${disqualificationEntries
                          .map(([key, count]) => `${key.replaceAll('_', ' ')} (${count})`)
                          .join(', ')}`
                      : null;

                  return (
                    <div key={record.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex gap-6">
                        <div>
                          <p className="text-sm text-muted-foreground">Data</p>
                          <p className="font-medium">{new Date(record.date).toLocaleDateString('pt-BR')}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Leads Qualificados</p>
                          <p className="font-medium">{record.qualifiedLeads}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Contratos Fechados</p>
                          <p className="font-medium">{record.contractsClosed}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Receita</p>
                          <p className="font-medium">R$ {record.revenueGenerated.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">ROI</p>
                          <p className="font-medium text-green-600">{record.roi ? `${record.roi.toFixed(0)}%` : '—'}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 max-w-xs">
                        {record.notes && (
                          <p className="text-sm text-muted-foreground truncate w-full text-right">{record.notes}</p>
                        )}
                        {disqualificationText && (
                          <p className="text-xs text-muted-foreground truncate w-full text-right">{disqualificationText}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Ad Set Performance */}
        {selectedCampaignId && (
          <AdSetTable adsets={adsetData} loading={adsetLoading} />
        )}

        {/* Creative Performance */}
        {selectedCampaignId && (
          <CreativePerformanceTable ads={adCreativeData} loading={adCreativeLoading} />
        )}

        {/* Creative Library */}
        <CreativeLibrary
          data={creativeLibraryData}
          loading={creativeLibraryLoading}
          scope={creativeLibraryScope}
          hasCampaignSelected={Boolean(selectedCampaignId)}
          onScopeChange={setCreativeLibraryScope}
        />

        {/* Demographics & Placements */}
        {selectedCampaignId && (
          <DemographicsChart
            ageGenderData={ageGenderData}
            placementData={placementData}
            loading={breakdownLoading}
          />
        )}

        {/* Temporal Analysis */}
        {selectedCampaignId && (
          <div className="grid gap-4 lg:grid-cols-2">
            <TemporalAnalysis
              title="Análise Temporal"
              badgeLabel="Período selecionado"
              data={temporalData?.byDayOfWeek || []}
              bestDay={temporalData?.bestDay || null}
              worstDay={temporalData?.worstDay || null}
              cheapestDay={temporalData?.cheapestDay || null}
              mostExpensiveDay={temporalData?.mostExpensiveDay || null}
              loading={temporalLoading}
            />
            <TemporalAnalysis
              title="Última semana"
              badgeLabel="Últimos 7 dias"
              description="Resumo por dia da semana nos últimos 7 dias (dentro do intervalo selecionado)."
              data={temporalLastWeekData?.byDayOfWeek || []}
              bestDay={temporalLastWeekData?.bestDay || null}
              worstDay={temporalLastWeekData?.worstDay || null}
              cheapestDay={temporalLastWeekData?.cheapestDay || null}
              mostExpensiveDay={temporalLastWeekData?.mostExpensiveDay || null}
              loading={temporalLastWeekLoading}
            />
          </div>
        )}

        {/* Business Metrics (CAC, LTV) */}
        {selectedCampaignId && (
          <BusinessMetricsCard data={businessData} loading={businessLoading} />
        )}

        {metricsLoading ? (
          <Card>
            <CardHeader>
              <CardTitle>Carregando campanhas...</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-center py-10">
              <Activity className="h-6 w-6 animate-spin text-muted-foreground" />
            </CardContent>
          </Card>
        ) : (
          <CampaignTable campaigns={summary.campaigns} />
        )}
      </div>

      <ReportGenerator
        open={openReportGenerator}
        onClose={() => setOpenReportGenerator(false)}
        clientId={summary.clientId}
        clientName={summary.clientName}
      />
    </div>
  );
}
