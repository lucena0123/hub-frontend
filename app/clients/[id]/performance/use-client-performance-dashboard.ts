'use client';

import { useMemo, useState } from 'react';

import type { MetricsPeriod, MetricsQuery } from '@/types';

import { getDefaultCampaignIdFromSummary, useCampaignSelection } from './dashboard/use-campaign-selection';
import { useCampaignData } from './dashboard/use-campaign-data';
import { useCreativeInsights } from './dashboard/use-creative-insights';
import { useMetaSync, type CreativeCoverage, type MetaCoverage } from './dashboard/use-meta-sync';
import { useClientSummary } from './dashboard/use-summary';
import { getApiErrorMessage, getDateRangeFromPeriod, resolveMetricsRange } from './dashboard/utils';

export type { CreativeCoverage, MetaCoverage };

export const useClientPerformanceDashboard = (clientIdRaw: string | null | undefined) => {
  const clientId = clientIdRaw ? String(clientIdRaw) : null;

  const [period, setPeriod] = useState<MetricsPeriod>('30d');
  const [customStartDate, setCustomStartDate] = useState(() => getDateRangeFromPeriod('30d').startDate);
  const [customEndDate, setCustomEndDate] = useState(() => getDateRangeFromPeriod('30d').endDate);
  const [metricsQuery, setMetricsQuery] = useState<MetricsQuery>({ period: '30d' });

  const [error, setError] = useState<string | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);
  const [manualRefreshing, setManualRefreshing] = useState(false);

  const { summary, bpmnProgress, loading, refreshing: autoRefreshing, refreshSummary } = useClientSummary({
    clientId,
    metricsQuery,
    setError,
    setLastUpdatedAt,
  });

  const { selectedCampaignId, setSelectedCampaignId, selectedCampaign } = useCampaignSelection(summary);

  const {
    dailyMetrics,
    metricsLoading,
    leadTrackingData,
    aggregatedLeadData,
    reloadLeadTracking,
    adsetData,
    adsetLoading,
    adCreativeData,
    adCreativeLoading,
    ageGenderData,
    placementData,
    regionData,
    countryData,
    breakdownLoading,
    temporalData,
    temporalLoading,
    temporalLastWeekData,
    temporalLastWeekLoading,
    businessData,
    businessLoading,
    refreshCampaignData,
  } = useCampaignData({
    selectedCampaignId,
    metricsQuery,
    period,
    setError,
  });

  const {
    creativeLibraryScope,
    setCreativeLibraryScope,
    creativeLibraryData,
    creativeLibraryLoading,
    optimizationData,
    optimizationLoading,
    refreshCreativeInsights,
  } = useCreativeInsights({ clientId, selectedCampaignId, metricsQuery });

  const resolvedRange = useMemo(() => {
    const range = resolveMetricsRange(metricsQuery, period);
    if (!range.startDate || !range.endDate) return null;
    return range;
  }, [metricsQuery, period]);

  const refreshAll = async () => {
    if (!clientId || manualRefreshing) return;

    try {
      setManualRefreshing(true);
      setError(null);

      const summaryData = await refreshSummary();
      const fallbackCampaignId = getDefaultCampaignIdFromSummary(summaryData ?? null);

      await Promise.allSettled([
        refreshCreativeInsights({ fallbackCampaignId }),
        selectedCampaignId ? refreshCampaignData() : Promise.resolve(),
      ]);

      setLastUpdatedAt(new Date().toISOString());
    } catch (err) {
      console.error('Error refreshing dashboard:', err);
      setError(getApiErrorMessage(err, 'Falha ao atualizar os dados. Verifique o backend e tente novamente.'));
    } finally {
      setManualRefreshing(false);
    }
  };

  const metaSync = useMetaSync({
    clientId,
    metricsQuery,
    period,
    resolvedRange,
    onAfterSync: refreshAll,
    setError,
  });

  const refreshing = manualRefreshing || autoRefreshing;

  const healthMetrics = useMemo(() => {
    if (selectedCampaign) {
      return {
        totalReach: selectedCampaign.totalReach || 0,
        avgFrequency: selectedCampaign.avgFrequency || 0,
        avgCpm: selectedCampaign.avgCpm || 0,
        totalImpressions: selectedCampaign.totalImpressions || 0,
        totalSpend: selectedCampaign.totalSpend || 0,
        qualityRanking: selectedCampaign.qualityRanking,
        engagementRateRanking: selectedCampaign.engagementRateRanking,
        conversionRateRanking: selectedCampaign.conversionRateRanking,
      };
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
  }, [selectedCampaign, summary]);

  const messagingMetrics = useMemo(() => {
    if (selectedCampaign) {
      return {
        totalMessagingConversations: selectedCampaign.totalMessagingConversations || 0,
        totalMessagingFirstReply: selectedCampaign.totalMessagingFirstReply || 0,
        totalLinkClicks: selectedCampaign.totalLinkClicks || 0,
        totalSpend: selectedCampaign.totalSpend || 0,
      };
    }

    return {
      totalMessagingConversations: summary?.totalMessagingConversations || 0,
      totalMessagingFirstReply: summary?.totalMessagingFirstReply || 0,
      totalLinkClicks: summary?.totalLinkClicks || 0,
      totalSpend: summary?.totalSpend || 0,
    };
  }, [selectedCampaign, summary]);

  return {
    summary,
    bpmnProgress,
    dailyMetrics,
    leadTrackingData,
    aggregatedLeadData,
    selectedCampaignId,
    setSelectedCampaignId,
    selectedCampaign,
    period,
    setPeriod,
    customStartDate,
    setCustomStartDate,
    customEndDate,
    setCustomEndDate,
    metricsQuery,
    setMetricsQuery,
    resolvedRange,
    loading,
    metricsLoading,
    error,
    setError,
    lastUpdatedAt,
    refreshing,
    syncing: metaSync.syncing,
    adsetData,
    adsetLoading,
    adCreativeData,
    adCreativeLoading,
    creativeLibraryScope,
    setCreativeLibraryScope,
    creativeLibraryData,
    creativeLibraryLoading,
    optimizationData,
    optimizationLoading,
    ageGenderData,
    placementData,
    regionData,
    countryData,
    breakdownLoading,
    temporalData,
    temporalLoading,
    temporalLastWeekData,
    temporalLastWeekLoading,
    businessData,
    businessLoading,
    refreshAll,
    reloadLeadTracking,
    handleMetaSync: metaSync.handleMetaSync,
    metaAdAccountId: metaSync.metaAdAccountId,
    metaSyncDetails: metaSync.metaSyncDetails,
    metaSyncHistory: metaSync.metaSyncHistory,
    metaLastSuccessfulSync: metaSync.metaLastSuccessfulSync,
    metaSyncHistoryLoading: metaSync.metaSyncHistoryLoading,
    metaSyncMessage: metaSync.metaSyncMessage,
    metaSyncPercent: metaSync.metaSyncPercent,
    metaSyncRange: metaSync.metaSyncRange,
    metaCoverage: metaSync.metaCoverage,
    creativeCoverage: metaSync.creativeCoverage,
    creativeCoverageDetails: metaSync.creativeCoverageDetails,
    metaGovernanceSummary: metaSync.metaGovernanceSummary,
    metaGovernanceIssuesLoading: metaSync.metaGovernanceIssuesLoading,
    metaGovernanceNeedsReview: metaSync.metaGovernanceNeedsReview,
    metaGovernanceFailures: metaSync.metaGovernanceFailures,
    metaGovernanceAutoFixed: metaSync.metaGovernanceAutoFixed,
    messagingMetrics,
    healthMetrics,
  };
};
