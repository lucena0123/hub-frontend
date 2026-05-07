import { useCallback, useEffect, useMemo, useState } from 'react';

import { resolveMetricsRange } from '@/app/clients/[id]/performance/dashboard/utils';
import {
  approveActionProposal,
  executeActionProposal,
  getActionHistory,
  generateActionProposals,
  listActionProposals,
  rejectActionProposal,
  type ListActionProposalsParams,
} from '@/lib/api/client';
import type {
  ActionHistoryItem,
  ActionProposal,
  MetricsQuery,
  OptimizationCenterResponse,
} from '@/types';
import { EMPTY_ITEMS, getApiError, type Tab } from './constants';
import { buildFocusItems, buildGeneratePayload, buildPrioritizedItems } from './diagnostics-selectors';

interface UseDiagnosticsPanelStateParams {
  clientId: string | null | undefined;
  optimizationData: OptimizationCenterResponse | null;
  metricsQuery?: MetricsQuery;
  selectedCampaignId?: string | null;
}

export function useDiagnosticsPanelState({
  clientId,
  optimizationData,
  metricsQuery,
  selectedCampaignId,
}: UseDiagnosticsPanelStateParams) {
  const [tab, setTab] = useState<Tab>('recommendations');
  const [showAll, setShowAll] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [proposals, setProposals] = useState<ActionProposal[]>([]);
  const [reasonsById, setReasonsById] = useState<Record<string, string>>({});
  const [queueLoading, setQueueLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [historyItems, setHistoryItems] = useState<ActionHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  const summary = optimizationData?.summary ?? null;
  const items = optimizationData?.items ?? EMPTY_ITEMS;
  const theme = optimizationData?.theme ?? null;

  const prioritizedItems = useMemo(() => buildPrioritizedItems(items), [items]);

  const focusItems = useMemo(() => {
    return buildFocusItems(prioritizedItems, showInfo, showAll);
  }, [prioritizedItems, showInfo, showAll]);

  const refresh = useCallback(async () => {
    if (!clientId) return;
    try {
      setQueueLoading(true);
      setError(null);
      const params: ListActionProposalsParams = { limit: 200 };
      const result = await listActionProposals(String(clientId), params);
      setProposals(Array.isArray(result.proposals) ? result.proposals : []);
    } catch (err) {
      setProposals([]);
      setError(getApiError(err, 'Falha ao carregar fila.'));
    } finally {
      setQueueLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const pendingCount = useMemo(
    () => proposals.filter((proposal) => proposal.status === 'pending').length,
    [proposals],
  );

  const historyRange = useMemo(() => {
    if (!metricsQuery) return null;
    return resolveMetricsRange(metricsQuery, '30d');
  }, [metricsQuery]);

  const loadHistory = useCallback(async () => {
    if (!clientId) return;
    try {
      setHistoryLoading(true);
      setHistoryError(null);
      const params = {
        limit: 50,
        campaignId: selectedCampaignId ?? undefined,
        startDate: historyRange?.startDate,
        endDate: historyRange?.endDate,
      };
      const result = await getActionHistory(String(clientId), params);
      setHistoryItems(Array.isArray(result.history) ? result.history : []);
    } catch (err) {
      setHistoryItems([]);
      setHistoryError(getApiError(err, 'Falha ao carregar histórico.'));
    } finally {
      setHistoryLoading(false);
    }
  }, [clientId, historyRange?.endDate, historyRange?.startDate, selectedCampaignId]);

  useEffect(() => {
    if (tab !== 'history') return;
    void loadHistory();
  }, [tab, loadHistory]);

  const handleGenerate = async () => {
    if (!clientId) return;
    try {
      setGenerating(true);
      setError(null);
      setMessage(null);
      const payload = buildGeneratePayload(metricsQuery, selectedCampaignId);
      const result = await generateActionProposals(String(clientId), payload);
      setMessage(`${result.created} propostas criadas · ${result.skipped} ignoradas.`);
      await refresh();
      if (result.created > 0) setTab('queue');
    } catch (err) {
      setError(getApiError(err, 'Falha ao gerar propostas.'));
    } finally {
      setGenerating(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      setActingId(id);
      setError(null);
      setMessage(null);
      const reason = reasonsById[id]?.trim();
      await approveActionProposal(id, reason ? { reason } : {});
      setMessage('Proposta aprovada.');
      await refresh();
    } catch (err) {
      setError(getApiError(err, 'Falha ao aprovar.'));
    } finally {
      setActingId(null);
    }
  };

  const handleReject = async (id: string) => {
    try {
      setActingId(id);
      setError(null);
      setMessage(null);
      const reason = reasonsById[id]?.trim();
      await rejectActionProposal(id, reason ? { reason } : {});
      setMessage('Proposta rejeitada.');
      await refresh();
    } catch (err) {
      setError(getApiError(err, 'Falha ao rejeitar.'));
    } finally {
      setActingId(null);
    }
  };

  const handleExecute = async (id: string) => {
    try {
      setActingId(id);
      setError(null);
      setMessage(null);
      const result = await executeActionProposal(id, { dryRun: true });
      setMessage(`Execução enfileirada (dry-run). ID: ${result.executionId}`);
      await refresh();
    } catch (err) {
      setError(getApiError(err, 'Falha ao executar.'));
    } finally {
      setActingId(null);
    }
  };

  const toggleShowInfo = () => {
    setShowInfo((previous) => !previous);
    setShowAll(false);
  };

  return {
    tab,
    setTab,
    showAll,
    setShowAll,
    showInfo,
    toggleShowInfo,
    proposals,
    reasonsById,
    setReasonsById,
    queueLoading,
    generating,
    actingId,
    message,
    error,
    historyItems,
    historyLoading,
    historyError,
    summary,
    theme,
    focusItems,
    prioritizedItems,
    pendingCount,
    historyRange,
    refresh,
    loadHistory,
    handleGenerate,
    handleApprove,
    handleReject,
    handleExecute,
  };
}
