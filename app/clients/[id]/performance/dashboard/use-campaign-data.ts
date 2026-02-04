'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import {
  getAdMetrics,
  getAdSetMetrics,
  getBreakdowns,
  getBusinessMetrics,
  getCampaignMetrics,
  getLeadTracking,
  getTemporalAnalysis,
} from '@/lib/api/client';
import type {
  AdCreativeMetric,
  AdSetMetric,
  BreakdownSegment,
  BusinessMetricsResponse,
  DailyMetric,
  LeadTrackingData,
  MetricsPeriod,
  MetricsQuery,
  TemporalAnalysisResponse,
} from '@/types';

import { getApiErrorMessage, getDateRangeFromPeriod, getLastWeekRange } from './utils';

const resolveLeadTrackingRange = (query: MetricsQuery): { startDate: string; endDate: string } => {
  if (query.startDate && query.endDate) return { startDate: query.startDate, endDate: query.endDate };

  const resolvedPeriod: MetricsPeriod = query.period && query.period !== 'custom' ? query.period : '30d';
  return getDateRangeFromPeriod(resolvedPeriod);
};

export const useCampaignData = (params: {
  selectedCampaignId: string | null;
  metricsQuery: MetricsQuery;
  period: MetricsPeriod;
  setError: (value: string | null) => void;
}) => {
  const { selectedCampaignId, metricsQuery, period, setError } = params;

  const [dailyMetrics, setDailyMetrics] = useState<DailyMetric[]>([]);
  const [metricsLoading, setMetricsLoading] = useState(false);

  const [leadTrackingData, setLeadTrackingData] = useState<LeadTrackingData[]>([]);

  const [adsetData, setAdsetData] = useState<AdSetMetric[]>([]);
  const [adsetLoading, setAdsetLoading] = useState(false);

  const [adCreativeData, setAdCreativeData] = useState<AdCreativeMetric[]>([]);
  const [adCreativeLoading, setAdCreativeLoading] = useState(false);

  const [ageGenderData, setAgeGenderData] = useState<BreakdownSegment[]>([]);
  const [placementData, setPlacementData] = useState<BreakdownSegment[]>([]);
  const [breakdownLoading, setBreakdownLoading] = useState(false);

  const [temporalData, setTemporalData] = useState<TemporalAnalysisResponse | null>(null);
  const [temporalLoading, setTemporalLoading] = useState(false);

  const [temporalLastWeekData, setTemporalLastWeekData] = useState<TemporalAnalysisResponse | null>(null);
  const [temporalLastWeekLoading, setTemporalLastWeekLoading] = useState(false);

  const [businessData, setBusinessData] = useState<BusinessMetricsResponse | null>(null);
  const [businessLoading, setBusinessLoading] = useState(false);

  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const loadLeadTracking = async (campaignId: string, query: MetricsQuery) => {
    try {
      const range = resolveLeadTrackingRange(query);
      const data = await getLeadTracking(campaignId, range);
      if (!mountedRef.current) return;
      setLeadTrackingData(data);
    } catch (err) {
      console.error('Error loading lead tracking:', err);
      if (!mountedRef.current) return;
      setLeadTrackingData([]);
    }
  };

  const loadAll = async (campaignId: string, query: MetricsQuery) => {
    setMetricsLoading(true);
    setAdsetLoading(true);
    setAdCreativeLoading(true);
    setBreakdownLoading(true);
    setTemporalLoading(true);
    setTemporalLastWeekLoading(true);
    setBusinessLoading(true);

    try {
      const lastWeekRange = getLastWeekRange(query, period);
      const leadRange = resolveLeadTrackingRange(query);

      const [metrics, adsets, ads, agBreak, plBreak, temporal, temporalLastWeek, business, leadTracking] = await Promise.allSettled([
        getCampaignMetrics(campaignId, query),
        getAdSetMetrics(campaignId, query),
        getAdMetrics(campaignId, query),
        getBreakdowns(campaignId, 'age_gender', query),
        getBreakdowns(campaignId, 'platform_position', query),
        getTemporalAnalysis(campaignId, query),
        getTemporalAnalysis(campaignId, lastWeekRange),
        getBusinessMetrics(campaignId, query),
        getLeadTracking(campaignId, leadRange),
      ]);

      if (!mountedRef.current) return;

      if (metrics.status === 'fulfilled') {
        setDailyMetrics(metrics.value);
      } else {
        setError(getApiErrorMessage(metrics.reason, 'Failed to load campaign metrics'));
      }

      if (adsets.status === 'fulfilled') setAdsetData(adsets.value.adsets ?? []);
      else setAdsetData([]);

      if (ads.status === 'fulfilled') setAdCreativeData(ads.value.ads ?? []);
      else setAdCreativeData([]);

      setAgeGenderData(agBreak.status === 'fulfilled' ? agBreak.value.segments : []);
      setPlacementData(plBreak.status === 'fulfilled' ? plBreak.value.segments : []);

      if (temporal.status === 'fulfilled') setTemporalData(temporal.value);
      else setTemporalData(null);

      if (temporalLastWeek.status === 'fulfilled') setTemporalLastWeekData(temporalLastWeek.value);
      else setTemporalLastWeekData(null);

      if (business.status === 'fulfilled') setBusinessData(business.value);
      else setBusinessData(null);

      if (leadTracking.status === 'fulfilled') setLeadTrackingData(leadTracking.value);
      else setLeadTrackingData([]);
    } catch (err) {
      console.error('Error loading campaign data:', err);
    } finally {
      if (!mountedRef.current) return;
      setMetricsLoading(false);
      setAdsetLoading(false);
      setAdCreativeLoading(false);
      setBreakdownLoading(false);
      setTemporalLoading(false);
      setTemporalLastWeekLoading(false);
      setBusinessLoading(false);
    }
  };

  useEffect(() => {
    if (!selectedCampaignId) {
      setDailyMetrics([]);
      setLeadTrackingData([]);
      setAdsetData([]);
      setAdCreativeData([]);
      setAgeGenderData([]);
      setPlacementData([]);
      setTemporalData(null);
      setTemporalLastWeekData(null);
      setBusinessData(null);
      return;
    }

    void loadAll(selectedCampaignId, metricsQuery);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCampaignId, metricsQuery, period]);

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
      {
        qualifiedLeads: 0,
        contractsClosed: 0,
        totalRevenue: 0,
        disqualificationReasons: {} as Record<string, number>,
      }
    );
  }, [leadTrackingData]);

  const reloadLeadTracking = async () => {
    if (!selectedCampaignId) return;
    await loadLeadTracking(selectedCampaignId, metricsQuery);
  };

  const refreshCampaignData = async () => {
    if (!selectedCampaignId) return;
    await loadAll(selectedCampaignId, metricsQuery);
  };

  return {
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
    breakdownLoading,
    temporalData,
    temporalLoading,
    temporalLastWeekData,
    temporalLastWeekLoading,
    businessData,
    businessLoading,
    refreshCampaignData,
  };
};

