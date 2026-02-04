'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import {
  getClientById,
  getMetaSyncDetails,
  getMetaSyncHistory,
  syncMetaAds,
  type MetaSyncDetails,
} from '@/lib/api/client';
import type { MetricsPeriod, MetricsQuery } from '@/types';

import { getApiErrorMessage, getDateRangeFromPeriod } from './utils';

export type MetaCoverage =
  | { state: 'missing'; label: string }
  | { state: 'outdated'; label: string }
  | { state: 'running' | 'success' | 'failed' | 'partial'; label: string };

export const useMetaSync = (params: {
  clientId: string | null;
  metricsQuery: MetricsQuery;
  period: MetricsPeriod;
  resolvedRange: { startDate: string; endDate: string } | null;
  onAfterSync: () => Promise<void>;
  setError: (value: string | null) => void;
}) => {
  const { clientId, metricsQuery, period, resolvedRange, onAfterSync, setError } = params;

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
        const client = await getClientById(clientId);
        if (!mountedRef.current) return;
        setMetaAdAccountId(client.metaAdAccountId?.trim?.() ? client.metaAdAccountId.trim() : '');
      } catch {
        if (mountedRef.current) setMetaAdAccountId('');
      }
    };

    void loadClientMetaAccount();
  }, [clientId]);

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

    void loadHistory();

    return () => {
      cancelled = true;
    };
  }, [metaAdAccountId]);

  const handleMetaSync = async () => {
    const accountId = metaAdAccountId.trim();
    if (!accountId || syncing) return;

    try {
      setSyncing(true);
      setError(null);

      const resolvedPeriod: MetricsPeriod = metricsQuery.period && metricsQuery.period !== 'custom' ? metricsQuery.period : period;
      const rangeOverride =
        metricsQuery.startDate && metricsQuery.endDate
          ? { since: metricsQuery.startDate, until: metricsQuery.endDate }
          : resolvedPeriod !== 'custom'
            ? (() => {
                const range = getDateRangeFromPeriod(resolvedPeriod);
                return { since: range.startDate, until: range.endDate };
              })()
            : undefined;

      if (rangeOverride) {
        const since = new Date(rangeOverride.since);
        const until = new Date(rangeOverride.until);
        const daysDiff = Math.floor((until.getTime() - since.getTime()) / (1000 * 60 * 60 * 24));
        const maxSyncDays = 365;

        if (Number.isNaN(since.getTime()) || Number.isNaN(until.getTime()) || daysDiff < 1) {
          throw new Error('Selecione um intervalo de datas válido (a data inicial deve ser anterior à final).');
        }

        if (daysDiff > maxSyncDays) {
          throw new Error(`Para sincronizar com a Meta, o intervalo máximo é de ${maxSyncDays} dias.`);
        }
      }

      const syncResponse = await syncMetaAds({
        syncLevel: 'full',
        async: true,
        accountId,
        clientId: clientId ?? undefined,
        ...(rangeOverride ?? {}),
      });

      const syncId = syncResponse.syncId;
      if (!syncId) {
        throw new Error('A sincronização não retornou um syncId. Verifique o backend.');
      }

      const pollIntervalMs = 1500;
      const pollTimeoutMs = 30 * 60 * 1000; // 30 min
      const pollStart = Date.now();
      let finishedState: 'success' | 'partial' | null = null;

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

      await onAfterSync();
    } catch (err) {
      console.error('Meta sync failed:', err);
      const message = getApiErrorMessage(err, 'Falha ao sincronizar com Meta Ads. Tente novamente.');
      if (
        message.toLowerCase().includes('error validating access token') ||
        message.toLowerCase().includes('session has expired') ||
        message.toLowerCase().includes('access token')
      ) {
        setError('Meta Ads: token expirou/é inválido. Atualize META_ACCESS_TOKEN no `backend/.env` e reinicie o backend.');
      } else {
        setError(`Meta Ads: ${message}`);
      }
    } finally {
      setSyncing(false);
    }
  };

  const metaSyncProgress = metaSyncDetails?.metadata?.progress;
  const metaSyncPercent =
    metaSyncProgress?.overallTotal && metaSyncProgress.overallTotal > 0
      ? Math.min(100, Math.round(((metaSyncProgress.overallCompleted ?? 0) / metaSyncProgress.overallTotal) * 100))
      : null;
  const metaSyncRange =
    metaSyncProgress?.currentSince && metaSyncProgress?.currentUntil ? `${metaSyncProgress.currentSince} → ${metaSyncProgress.currentUntil}` : null;
  const metaSyncMessage = metaSyncProgress?.message ?? 'Sincronizando com Meta Ads...';

  const metaCoverage = useMemo<MetaCoverage | null>(() => {
    if (!resolvedRange) return null;
    if (!metaSyncDetails) {
      return { state: 'missing', label: 'Meta: sem sync para este período' };
    }

    const state: 'running' | 'success' | 'failed' | 'partial' =
      metaSyncDetails.state ?? (metaSyncDetails.completedAt ? metaSyncDetails.status : 'running');

    const coversRange = metaSyncDetails.dateRangeStart <= resolvedRange.startDate && metaSyncDetails.dateRangeEnd >= resolvedRange.endDate;

    if (!coversRange) {
      return { state: 'outdated', label: 'Meta: fora do período' };
    }

    if (state === 'success') return { state, label: 'Meta: dados completos' };
    if (state === 'partial') {
      const unmapped = metaSyncDetails.unmappedCampaigns?.length ?? 0;
      return { state, label: unmapped > 0 ? `Meta: parcial (${unmapped} unmapped)` : 'Meta: parcial' };
    }
    if (state === 'failed') return { state, label: 'Meta: falha no sync' };
    return { state, label: 'Meta: sincronizando…' };
  }, [metaSyncDetails, resolvedRange]);

  return {
    syncing,
    handleMetaSync,
    metaAdAccountId,
    metaSyncDetails,
    metaLastSuccessfulSync,
    metaSyncHistoryLoading,
    metaSyncMessage,
    metaSyncPercent,
    metaSyncRange,
    metaCoverage,
  };
};

