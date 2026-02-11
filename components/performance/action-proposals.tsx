'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Check, DollarSign, Pause, Play, RefreshCw, TrendingDown, TrendingUp, Wand2, X, Copy } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  approveActionProposal,
  executeActionProposal,
  generateActionProposals,
  listActionProposals,
  rejectActionProposal,
  type GenerateActionProposalsInput,
  type ListActionProposalsParams,
} from '@/lib/api/client';
import { formatDate } from '@/lib/utils';
import type { ActionProposal, ActionProposalStatus, MetricsQuery } from '@/types';

type StatusFilter = ActionProposalStatus | 'all';

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;

const getApiErrorMessage = (err: unknown, fallback: string) => {
  if (axios.isAxiosError(err)) {
    const status = err.response?.status;
    if (status === 401) return 'Não autorizado. Cole um token JWT válido para ver/aprovar propostas.';
    if (status === 403) return 'Sem permissão. Apenas admin/manager pode gerar/aprovar/rejeitar.';

    const data = err.response?.data;
    if (isRecord(data) && typeof data.message === 'string') return data.message;
  }

  if (err instanceof Error) return err.message;
  return fallback;
};

const statusLabel: Record<ActionProposalStatus, string> = {
  pending: 'pendente',
  approved: 'aprovado',
  rejected: 'rejeitado',
  executed: 'executado',
  expired: 'expirado',
};

const actionIconMap: Record<string, typeof Wand2> = {
  pause: Pause,
  scale: TrendingUp,
  refresh: RefreshCw,
  pause_campaign: Pause,
  activate_campaign: Play,
  pause_adset: Pause,
  activate_adset: Play,
  reduce_budget: TrendingDown,
  set_budget: DollarSign,
  duplicate_adset: Copy,
};

const actionLabelMap: Record<string, string> = {
  pause: 'Pausar criativo',
  scale: 'Escalar campanha',
  refresh: 'Renovar criativo',
  pause_campaign: 'Pausar campanha',
  activate_campaign: 'Ativar campanha',
  pause_adset: 'Pausar conjunto',
  activate_adset: 'Ativar conjunto',
  reduce_budget: 'Reduzir budget',
  set_budget: 'Ajustar budget',
  duplicate_adset: 'Duplicar conjunto',
};

const statusBadgeClass: Record<ActionProposalStatus, string> = {
  pending: 'border-amber-200 bg-amber-50 text-amber-900',
  approved: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  rejected: 'border-rose-200 bg-rose-50 text-rose-800',
  executed: 'border-primary/30 bg-primary/10 text-primary',
  expired: 'border-slate-200 bg-slate-50 text-slate-700',
};

const buildGeneratePayload = (metricsQuery?: MetricsQuery, selectedCampaignId?: string | null): GenerateActionProposalsInput => {
  const payload: GenerateActionProposalsInput = {};
  if (metricsQuery?.period) payload.period = metricsQuery.period;
  if (metricsQuery?.startDate) payload.startDate = metricsQuery.startDate;
  if (metricsQuery?.endDate) payload.endDate = metricsQuery.endDate;
  if (selectedCampaignId) payload.campaignId = selectedCampaignId;
  return payload;
};

interface ActionProposalsQueueProps {
  clientId: string | null | undefined;
  metricsQuery?: MetricsQuery;
  selectedCampaignId?: string | null;
}

export function ActionProposalsQueue({ clientId, metricsQuery, selectedCampaignId }: ActionProposalsQueueProps) {
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

  const scopeLabel = selectedCampaignId ? 'campanha selecionada' : 'cliente';
  const rangeLabel = metricsQuery?.startDate && metricsQuery?.endDate ? `${metricsQuery.startDate} → ${metricsQuery.endDate}` : metricsQuery?.period ?? null;

  return (
    <Card className="edge-card border-l-2 border-l-primary">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          Fila de Aprovação
          <Badge variant="outline">Automation</Badge>
        </CardTitle>
        <CardDescription>Gere propostas do playbook e aprove/rejeite antes de qualquer write-back na Meta.</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="rounded-lg border p-3 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
            <span>Escopo para gerar: {scopeLabel}</span>
            {rangeLabel ? <span>Janela: {rangeLabel}</span> : null}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Select value={status} onValueChange={(value) => setStatus(value as StatusFilter)}>
              <SelectTrigger className="w-[210px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pendentes ({counts.pending})</SelectItem>
                <SelectItem value="approved">Aprovadas ({counts.approved})</SelectItem>
                <SelectItem value="rejected">Rejeitadas ({counts.rejected})</SelectItem>
                <SelectItem value="executed">Executadas ({counts.executed})</SelectItem>
                <SelectItem value="expired">Expiradas ({counts.expired})</SelectItem>
                <SelectItem value="all">Todas ({proposals.length})</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" size="sm" onClick={refresh} disabled={loading || !clientId}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>

          <Button onClick={handleGenerate} disabled={generating || !clientId}>
            <Wand2 className={`h-4 w-4 ${generating ? 'animate-spin' : ''}`} />
            Gerar propostas
          </Button>
        </div>

        {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        {loading ? (
          <p className="text-sm text-muted-foreground">Carregando fila...</p>
        ) : visibleProposals.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhuma proposta {status === 'all' ? 'encontrada' : `com status "${status}"`}. Clique em{' '}
            <span className="font-medium text-foreground">Gerar propostas</span> para criar sugestões do playbook.
          </p>
        ) : (
          <div className="space-y-3">
            {visibleProposals.map((proposal) => {
              const busy = actingId === proposal.proposalId;
              const reason = reasonsById[proposal.proposalId] ?? '';
              const createdAt = formatDate(proposal.createdAt, 'dd/MM/yyyy HH:mm', '—');

              return (
                <div key={proposal.proposalId} className="rounded-lg border p-3 space-y-2">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className={`text-xs ${statusBadgeClass[proposal.status]}`}>
                          {statusLabel[proposal.status]}
                        </Badge>
                        {proposal.severity ? (
                          <Badge variant="secondary" className="text-xs">
                            {proposal.severity}
                          </Badge>
                        ) : null}
                        {proposal.action ? (() => {
                          const ActionIcon = actionIconMap[proposal.action] || Wand2;
                          const label = actionLabelMap[proposal.action] || proposal.action;
                          return (
                            <Badge variant="outline" className="text-xs flex items-center gap-1">
                              <ActionIcon className="h-3 w-3" />
                              {label}
                            </Badge>
                          );
                        })() : null}
                        {proposal.entity ? (
                          <Badge variant="outline" className="text-xs">
                            {proposal.entity.type}: {proposal.entity.id.slice(0, 8)}…
                          </Badge>
                        ) : null}
                        {proposal.ruleId ? (
                          <Badge variant="secondary" className="text-xs text-muted-foreground bg-slate-100">
                            {proposal.ruleId}
                          </Badge>
                        ) : null}
                      </div>

                      <p className="text-sm font-semibold">{proposal.title ?? 'Proposta sem título'}</p>
                      {proposal.description ? <p className="text-sm text-muted-foreground">{proposal.description}</p> : null}
                      <p className="text-xs text-muted-foreground">Criada em {createdAt}</p>

                      {proposal.lastDecision ? (
                        <p className="text-xs text-muted-foreground">
                          Última decisão: {proposal.lastDecision.decision}
                          {proposal.lastDecision.reason ? ` · motivo: ${proposal.lastDecision.reason}` : ''}
                        </p>
                      ) : null}
                    </div>

                    {proposal.status === 'pending' ? (
                      <div className="flex flex-col gap-2 w-full sm:w-[320px]">
                        <Input
                          placeholder="Motivo (opcional)"
                          value={reason}
                          onChange={(e) => setReasonsById((prev) => ({ ...prev, [proposal.proposalId]: e.target.value }))}
                          className="h-8"
                        />
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleReject(proposal.proposalId)}
                            disabled={busy}
                          >
                            <X className="h-4 w-4" />
                            Rejeitar
                          </Button>
                          <Button size="sm" onClick={() => handleApprove(proposal.proposalId)} disabled={busy}>
                            <Check className="h-4 w-4" />
                            Aprovar
                          </Button>
                        </div>
                      </div>
                    ) : proposal.status === 'approved' ? (
                      <div className="flex items-center justify-end w-full sm:w-auto">
                        <Button variant="outline" size="sm" onClick={() => handleExecuteDryRun(proposal.proposalId)} disabled={busy}>
                          <Wand2 className="h-4 w-4" />
                          Executar (dry-run)
                        </Button>
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
