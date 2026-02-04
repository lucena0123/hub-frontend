'use client';

import { useEffect, useRef, useState } from 'react';

import { getCreativeLibrary, getOptimizationCenter } from '@/lib/api/client';
import type { CreativeLibraryResponse, MetricsQuery, OptimizationCenterResponse } from '@/types';

export const useCreativeInsights = (params: {
  clientId: string | null;
  selectedCampaignId: string | null;
  metricsQuery: MetricsQuery;
}) => {
  const { clientId, selectedCampaignId, metricsQuery } = params;

  const [creativeLibraryScope, setCreativeLibraryScope] = useState<'campaign' | 'client'>('campaign');
  const [creativeLibraryData, setCreativeLibraryData] = useState<CreativeLibraryResponse | null>(null);
  const [creativeLibraryLoading, setCreativeLibraryLoading] = useState(true);

  const [optimizationData, setOptimizationData] = useState<OptimizationCenterResponse | null>(null);
  const [optimizationLoading, setOptimizationLoading] = useState(true);

  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedCampaignId && creativeLibraryScope === 'campaign') {
      setCreativeLibraryScope('client');
    }
  }, [selectedCampaignId, creativeLibraryScope]);

  const loadCreativeLibrary = async (opts?: { fallbackCampaignId?: string | null }) => {
    if (!clientId) return;

    try {
      setCreativeLibraryLoading(true);

      const query: MetricsQuery = { ...metricsQuery };
      const campaignIdForLibrary = creativeLibraryScope === 'campaign' ? selectedCampaignId ?? opts?.fallbackCampaignId ?? null : null;

      if (campaignIdForLibrary) query.campaignId = campaignIdForLibrary;
      else delete query.campaignId;

      const result = await getCreativeLibrary(clientId, query);
      if (!mountedRef.current) return;
      setCreativeLibraryData(result);
    } catch (err) {
      console.error('Error loading creative library:', err);
      if (!mountedRef.current) return;
      setCreativeLibraryData(null);
    } finally {
      if (mountedRef.current) setCreativeLibraryLoading(false);
    }
  };

  const loadOptimization = async () => {
    if (!clientId) return;

    try {
      setOptimizationLoading(true);
      const query: MetricsQuery = { ...metricsQuery };
      if (selectedCampaignId) query.campaignId = selectedCampaignId;
      else delete query.campaignId;

      const result = await getOptimizationCenter(clientId, query);
      if (!mountedRef.current) return;
      setOptimizationData(result);
    } catch (err) {
      console.error('Error loading optimization center:', err);
      if (!mountedRef.current) return;
      setOptimizationData(null);
    } finally {
      if (mountedRef.current) setOptimizationLoading(false);
    }
  };

  useEffect(() => {
    if (!clientId) return;
    void loadCreativeLibrary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId, creativeLibraryScope, metricsQuery, selectedCampaignId]);

  useEffect(() => {
    if (!clientId) return;
    void loadOptimization();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId, metricsQuery, selectedCampaignId]);

  const refreshCreativeInsights = async (opts?: { fallbackCampaignId?: string | null }) => {
    if (!clientId) return;
    await Promise.allSettled([loadCreativeLibrary(opts), loadOptimization()]);
  };

  return {
    creativeLibraryScope,
    setCreativeLibraryScope,
    creativeLibraryData,
    creativeLibraryLoading,
    optimizationData,
    optimizationLoading,
    refreshCreativeInsights,
  };
};

