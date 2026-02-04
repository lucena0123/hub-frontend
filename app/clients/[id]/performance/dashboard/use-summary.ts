'use client';

import { useEffect, useRef, useState } from 'react';

import { getClientBpmnProgress, getClientPerformanceSummary } from '@/lib/api/client';
import type { BPMNProgress, ClientPerformanceSummary, MetricsQuery } from '@/types';

import { getApiErrorMessage } from './utils';

export const useClientSummary = (params: {
  clientId: string | null;
  metricsQuery: MetricsQuery;
  setError: (value: string | null) => void;
  setLastUpdatedAt: (value: string | null) => void;
}) => {
  const { clientId, metricsQuery, setError, setLastUpdatedAt } = params;

  const [summary, setSummary] = useState<ClientPerformanceSummary | null>(null);
  const [bpmnProgress, setBpmnProgress] = useState<BPMNProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const load = async () => {
    if (!clientId) return null;

    try {
      setRefreshing(true);
      const [summaryData, progressData] = await Promise.all([
        getClientPerformanceSummary(clientId, metricsQuery),
        getClientBpmnProgress(clientId),
      ]);

      if (!mountedRef.current) return null;

      setSummary(summaryData);
      setBpmnProgress(progressData);
      setError(null);
      setLastUpdatedAt(new Date().toISOString());
      return summaryData;
    } catch (err) {
      if (!mountedRef.current) return null;
      setError(getApiErrorMessage(err, 'Failed to load performance data'));
      return null;
    } finally {
      if (!mountedRef.current) return;
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!clientId) {
      setSummary(null);
      setBpmnProgress(null);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId, metricsQuery]);

  return {
    summary,
    bpmnProgress,
    loading,
    refreshing,
    refreshSummary: load,
  };
};

