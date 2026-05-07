'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  approveActionProposal,
  executeActionProposal,
  generateActionProposals,
  listActionProposals,
  rejectActionProposal,
  type ListActionProposalsParams,
} from '@/lib/api/client';
import type { ActionProposal, ActionProposalStatus, MetricsQuery } from '@/types';
import { buildGeneratePayload, getApiErrorMessage, type StatusFilter } from './helpers';

interface UseActionProposalsQueueParams {
  clientId: string | null | undefined;
  metricsQuery?: MetricsQuery;
  selectedCampaignId?: string | null;
}

export function useActionProposalsQueue({
  clientId,
  metricsQuery,
  selectedCampaignId,
}: UseActionProposalsQueueParams) {
  const [status, setStatus] = useState<StatusFilter>('pending');
  const [proposals, setProposals] = useState<ActionProposal[]>([]);
  const [reasonsById, setReasonsById] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!clientId) return;

    try {
      setLoading(true);
      setError(null);
      setMessage(null);

      const params: ListActionProposalsParams = { limit: 200 };
      const result = await listActionProposals(String(clientId), params);
      setProposals(Array.isArray(result.proposals) ? result.proposals : []);
    } catch (err) {
      setProposals([]);
      setError(getApiErrorMessage(err, 'Falha ao carregar fila de aprovação.'));
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const handleGenerate = async () => {
    if (!clientId) return;

    try {
      setGenerating(true);
      setError(null);
      setMessage(null);

      const payload = buildGeneratePayload(metricsQuery, selectedCampaignId);
      const result = await generateActionProposals(String(clientId), payload);
      setMessage(`Propostas: ${result.created} novas · ${result.skipped} ignoradas (duplicadas).`);
      await refresh();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Falha ao gerar propostas.'));
    } finally {
      setGenerating(false);
    }
  };

  const handleApprove = async (proposalId: string) => {
    try {
      setActingId(proposalId);
      setError(null);
      setMessage(null);

      const reason = reasonsById[proposalId]?.trim();
      await approveActionProposal(proposalId, reason ? { reason } : {});
      setMessage('Proposta aprovada.');
      await refresh();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Falha ao aprovar proposta.'));
    } finally {
      setActingId(null);
    }
  };

  const handleReject = async (proposalId: string) => {
    try {
      setActingId(proposalId);
      setError(null);
      setMessage(null);

      const reason = reasonsById[proposalId]?.trim();
      await rejectActionProposal(proposalId, reason ? { reason } : {});
      setMessage('Proposta rejeitada.');
      await refresh();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Falha ao rejeitar proposta.'));
    } finally {
      setActingId(null);
    }
  };

  const handleExecuteDryRun = async (proposalId: string) => {
    try {
      setActingId(proposalId);
      setError(null);
      setMessage(null);

      const result = await executeActionProposal(proposalId, { dryRun: true });
      setMessage(`Execução enfileirada (dry-run). Execução: ${result.executionId}`);
      await refresh();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Falha ao executar proposta.'));
    } finally {
      setActingId(null);
    }
  };

  const counts = useMemo(() => {
    const byStatus: Record<string, number> = { pending: 0, approved: 0, rejected: 0, executed: 0, expired: 0 };
    for (const proposal of proposals) byStatus[proposal.status] = (byStatus[proposal.status] ?? 0) + 1;
    return byStatus as Record<ActionProposalStatus, number>;
  }, [proposals]);

  const visibleProposals = useMemo(() => {
    if (status === 'all') return proposals;
    return proposals.filter((proposal) => proposal.status === status);
  }, [proposals, status]);

  return {
    actingId,
    counts,
    error,
    generating,
    handleApprove,
    handleExecuteDryRun,
    handleGenerate,
    handleReject,
    loading,
    message,
    proposals,
    reasonsById,
    refresh,
    setReasonsById,
    setStatus,
    status,
    visibleProposals,
  };
}
