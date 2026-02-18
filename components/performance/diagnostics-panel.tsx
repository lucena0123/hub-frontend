'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  AlertTriangle,
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  DollarSign,
  Lightbulb,
  Pause,
  Play,
  RefreshCw,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Wand2,
  X,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  approveActionProposal,
  executeActionProposal,
  getActionHistory,
  generateActionProposals,
  listActionProposals,
  rejectActionProposal,
  type GenerateActionProposalsInput,
  type ListActionProposalsParams,
} from '@/lib/api/client';
import { formatDate } from '@/lib/utils';
import { resolveMetricsRange } from '@/app/clients/[id]/performance/dashboard/utils';
import type {
  ActionHistoryItem,
  ActionProposal,
  ActionProposalStatus,
  MetricsQuery,
  OptimizationCenterItem,
  OptimizationCenterResponse,
  OptimizationCenterSeverity,
} from '@/types';

/* ------------------------------------------------------------------ */
/*  Constants & helpers                                                */
/* ------------------------------------------------------------------ */

type Tab = 'recommendations' | 'queue' | 'history';

const severityIcon: Record<OptimizationCenterSeverity, typeof AlertTriangle> = {
  critical: AlertTriangle,
  warning: AlertTriangle,
  opportunity: Lightbulb,
  info: Sparkles,
};

const severityLabel: Record<OptimizationCenterSeverity, string> = {
  critical: 'Crítico',
  warning: 'Atenção',
  opportunity: 'Oportunidade',
  info: 'Info',
};

const severityColor: Record<OptimizationCenterSeverity, string> = {
  critical: 'border-rose-200 bg-rose-50 text-rose-800',
  warning: 'border-amber-200 bg-amber-50 text-amber-900',
  opportunity: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  info: 'border-slate-200 bg-slate-50 text-slate-700',
};

const severityBorder: Record<OptimizationCenterSeverity, string> = {
  critical: 'border-l-rose-500',
  warning: 'border-l-amber-400',
  opportunity: 'border-l-emerald-500',
  info: 'border-l-slate-300',
};

const EMPTY_ITEMS: OptimizationCenterResponse['items'] = [];

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
  review: 'Revisar',
  track: 'Acompanhar',
  sync: 'Sincronizar dados',
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

const statusLabel: Record<ActionProposalStatus, string> = {
  pending: 'Pendente',
  approved: 'Aprovado',
  rejected: 'Rejeitado',
  executed: 'Executado',
  expired: 'Expirado',
};

const executionStatusLabel: Record<string, string> = {
  success: 'Sucesso',
  failed: 'Falhou',
  running: 'Executando',
  queued: 'Na fila',
};

const executionStatusClass: Record<string, string> = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  failed: 'border-rose-200 bg-rose-50 text-rose-800',
  running: 'border-primary/30 bg-primary/10 text-primary',
  queued: 'border-slate-200 bg-slate-50 text-slate-700',
};

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null;

const getApiError = (err: unknown, fallback: string) => {
  if (axios.isAxiosError(err)) {
    const s = err.response?.status;
    if (s === 401) return 'Não autorizado. Token JWT inválido.';
    if (s === 403) return 'Sem permissão para esta ação.';
    const d = err.response?.data;
    if (isRecord(d) && typeof d.message === 'string') return d.message;
  }
  return err instanceof Error ? err.message : fallback;
};

const formatCurrency = (value: number | null | undefined) => {
  if (value == null || !Number.isFinite(value) || value === 0) return null;
  return `R$ ${value.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}`;
};

const buildHistorySummary = (item: ActionHistoryItem) => {
  const meta = item.metaResponse as Record<string, unknown> | null;
  if (!meta || typeof meta !== 'object') return null;

  const from = typeof meta.from === 'number'
    ? meta.from
    : typeof meta.currentBudget === 'number'
      ? meta.currentBudget
      : null;
  const to = typeof meta.to === 'number'
    ? meta.to
    : typeof meta.nextBudget === 'number'
      ? meta.nextBudget
      : typeof meta.amount === 'number'
        ? meta.amount
        : null;

  if (from != null && to != null) {
    const fromLabel = formatCurrency(from);
    const toLabel = formatCurrency(to);
    if (fromLabel && toLabel) return `Budget: ${fromLabel} → ${toLabel}`;
  }

  if (to != null) {
    const toLabel = formatCurrency(to);
    if (toLabel) return `Budget definido: ${toLabel}`;
  }

  if (typeof meta.operation === 'string') {
    return `Operação: ${meta.operation}`;
  }

  return null;
};

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

interface DiagnosticsPanelProps {
  clientId: string | null | undefined;
  optimizationData: OptimizationCenterResponse | null;
  optimizationLoading?: boolean;
  metricsQuery?: MetricsQuery;
  selectedCampaignId?: string | null;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function DiagnosticsPanel({
  clientId,
  optimizationData,
  optimizationLoading,
  metricsQuery,
  selectedCampaignId,
}: DiagnosticsPanelProps) {
  const [tab, setTab] = useState<Tab>('recommendations');
  const [showAll, setShowAll] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  // --- Action proposals state ---
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

  // --- Optimization data ---
  const summary = optimizationData?.summary ?? null;
  const items = optimizationData?.items ?? EMPTY_ITEMS;
  const theme = optimizationData?.theme ?? null;

  const prioritizedItems = useMemo(() => {
    const severityOrder: Record<OptimizationCenterSeverity, number> = {
      critical: 0,
      warning: 1,
      opportunity: 2,
      info: 3,
    };

    return [...items].sort((a, b) => {
      const sa = severityOrder[a.severity] ?? 99;
      const sb = severityOrder[b.severity] ?? 99;
      if (sa !== sb) return sa - sb;
      return a.title.localeCompare(b.title, 'pt-BR');
    });
  }, [items]);

  const focusItems = useMemo(() => {
    const base = showInfo ? prioritizedItems : prioritizedItems.filter((item) => item.severity !== 'info');
    return showAll ? base : base.slice(0, 5);
  }, [prioritizedItems, showInfo, showAll]);

  // --- Proposals API ---
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
    () => proposals.filter((p) => p.status === 'pending').length,
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
      const payload: GenerateActionProposalsInput = {};
      if (metricsQuery?.period) payload.period = metricsQuery.period;
      if (metricsQuery?.startDate) payload.startDate = metricsQuery.startDate;
      if (metricsQuery?.endDate) payload.endDate = metricsQuery.endDate;
      if (selectedCampaignId) payload.campaignId = selectedCampaignId;
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

  return (
    <Card className="edge-card">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="text-base flex items-center gap-2">
            Diagnóstico & Ações
            {theme && (
              <Badge variant="outline" className="text-xs font-normal">
                {theme.themeName} · v{optimizationData?.playbookVersion ?? '?'}
              </Badge>
            )}
          </CardTitle>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleGenerate}
              disabled={generating || !clientId}
            >
              <Wand2 className={`h-4 w-4 ${generating ? 'animate-spin' : ''}`} />
              Gerar propostas
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mt-2">
          <Button
            variant={tab === 'recommendations' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setTab('recommendations')}
            className="text-xs"
          >
            Recomendações
            {summary && (
              <Badge variant="secondary" className="ml-1.5 text-[10px]">
                {summary.total}
              </Badge>
            )}
          </Button>
          <Button
            variant={tab === 'queue' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setTab('queue')}
            className="text-xs"
          >
            Fila de Aprovação
            {pendingCount > 0 && (
              <Badge className="ml-1.5 text-[10px] bg-amber-500 text-white">
                {pendingCount}
              </Badge>
            )}
          </Button>
          <Button
            variant={tab === 'history' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setTab('history')}
            className="text-xs"
          >
            Histórico
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {message && <p className="text-sm text-emerald-700">{message}</p>}
        {error && <p className="text-sm text-destructive">{error}</p>}

        {/* Summary badges */}
        {tab === 'recommendations' && summary && (
          <div className="flex flex-wrap gap-1.5">
            {summary.critical > 0 && (
              <Badge className="bg-rose-500 text-white text-xs">
                {summary.critical} crítico{summary.critical > 1 ? 's' : ''}
              </Badge>
            )}
            {summary.warning > 0 && (
              <Badge className="bg-amber-400 text-amber-950 text-xs">
                {summary.warning} atenção
              </Badge>
            )}
            {summary.opportunity > 0 && (
              <Badge className="bg-emerald-500 text-white text-xs">
                {summary.opportunity} oportunidade{summary.opportunity > 1 ? 's' : ''}
              </Badge>
            )}
            {summary.info > 0 && (
              <Badge variant="secondary" className="text-xs">
                {summary.info} info
              </Badge>
            )}
          </div>
        )}

        {/* ---- TAB: Recommendations ---- */}
        {tab === 'recommendations' && (
          <>
            {optimizationLoading ? (
              <p className="text-sm text-muted-foreground py-4">Carregando recomendações...</p>
            ) : focusItems.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">
                Nenhuma recomendação no período. Sincronize a Meta para gerar diagnósticos.
              </p>
            ) : (
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-[2px] border border-border/60 bg-muted/20 p-2">
                  <p className="text-[11px] text-muted-foreground">
                    Modo foco operacional: exibindo {focusItems.length} {showAll ? 'itens' : 'prioridades'}.
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowInfo((p) => !p);
                        setShowAll(false);
                      }}
                      className="h-7 text-[10px]"
                    >
                      {showInfo ? 'Ocultar info' : 'Mostrar info'}
                    </Button>
                    {(showInfo ? prioritizedItems.length : prioritizedItems.filter((item) => item.severity !== 'info').length) > 5 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowAll((p) => !p)}
                        className="h-7 text-[10px]"
                      >
                        {showAll ? (
                          <>
                            <ChevronUp className="h-3 w-3" /> Ver menos
                          </>
                        ) : (
                          <>
                            <ChevronDown className="h-3 w-3" /> Ver tudo
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>

                {focusItems.map((item) => (
                  <RecommendationItem key={item.id} item={item} />
                ))}
              </div>
            )}
          </>
        )}

        {/* ---- TAB: Approval Queue ---- */}
        {tab === 'queue' && (
          <>
            <div className="flex items-center justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={refresh}
                disabled={queueLoading}
                className="text-xs"
              >
                <RefreshCw className={`h-3 w-3 ${queueLoading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
            </div>

            {queueLoading ? (
              <p className="text-sm text-muted-foreground py-4">Carregando fila...</p>
            ) : proposals.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">
                Nenhuma proposta. Clique em <strong>Gerar propostas</strong> para criar
                sugestões do playbook.
              </p>
            ) : (
              <div className="space-y-2">
                {proposals.map((proposal) => (
                  <ProposalItem
                    key={proposal.proposalId}
                    proposal={proposal}
                    busy={actingId === proposal.proposalId}
                    reason={reasonsById[proposal.proposalId] ?? ''}
                    onReasonChange={(val) =>
                      setReasonsById((prev) => ({ ...prev, [proposal.proposalId]: val }))
                    }
                    onApprove={() => handleApprove(proposal.proposalId)}
                    onReject={() => handleReject(proposal.proposalId)}
                    onExecute={() => handleExecute(proposal.proposalId)}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* ---- TAB: History ---- */}
        {tab === 'history' && (
          <>
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {selectedCampaignId ? 'Filtrado pela campanha selecionada.' : 'Mostrando todas as campanhas.'}
                {historyRange ? ` · ${historyRange.startDate} → ${historyRange.endDate}` : ''}
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={loadHistory}
                disabled={historyLoading}
                className="text-xs"
              >
                <RefreshCw className={`h-3 w-3 ${historyLoading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
            </div>

            {historyError && (
              <p className="text-sm text-destructive">{historyError}</p>
            )}

            {historyLoading ? (
              <p className="text-sm text-muted-foreground py-4">Carregando histórico...</p>
            ) : historyItems.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">
                Nenhuma ação executada encontrada no período.
              </p>
            ) : (
              <div className="space-y-2">
                {historyItems.map((item) => {
                  const actionKey = item.action ?? '';
                  const ActionIcon = actionIconMap[actionKey] ?? Wand2;
                  const actionLabel = actionLabelMap[actionKey] ?? item.action ?? 'Ação executada';
                  const statusKey = String(item.status || '').toLowerCase();
                  const statusClass = executionStatusClass[statusKey] ?? 'border-slate-200 bg-slate-50 text-slate-700';
                  const statusText = executionStatusLabel[statusKey] ?? item.status;
                  const summary = buildHistorySummary(item);
                  const entityLabel = item.entity?.name ?? item.entity?.id ?? null;

                  return (
                    <div key={item.executionId} className="rounded-[2px] border p-3 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className={`text-[10px] ${statusClass}`}>
                          {statusText}
                        </Badge>
                        <Badge variant="outline" className="text-[10px] flex items-center gap-1">
                          <ActionIcon className="h-3 w-3" />
                          {actionLabel}
                        </Badge>
                        {item.dryRun && (
                          <Badge variant="outline" className="text-[10px]">
                            dry-run
                          </Badge>
                        )}
                        {entityLabel && (
                          <span className="text-xs text-muted-foreground truncate max-w-[320px]">
                            {entityLabel}
                          </span>
                        )}
                      </div>
                      {item.title && <p className="text-sm font-medium">{item.title}</p>}
                      {item.description && <p className="text-xs text-muted-foreground">{item.description}</p>}
                      {summary && <p className="text-xs text-muted-foreground">{summary}</p>}
                      {item.error && (
                        <p className="text-xs text-rose-700">
                          Erro: {item.error.message}
                        </p>
                      )}
                      <p className="text-[10px] text-muted-foreground">
                        {item.completedAt
                          ? `Executado em ${formatDate(item.completedAt, 'dd/MM/yyyy HH:mm', '—')}`
                          : `Criado em ${formatDate(item.createdAt, 'dd/MM/yyyy HH:mm', '—')}`}
                        {item.executedBy?.type ? ` · origem: ${item.executedBy.type}` : ''}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function RecommendationItem({ item }: { item: OptimizationCenterItem }) {
  const SevIcon = severityIcon[item.severity] ?? Sparkles;
  const ActionIcon = actionIconMap[item.action] ?? Wand2;
  const actionLabel = actionLabelMap[item.action] ?? item.action;

  return (
    <div className={`rounded-[2px] border border-l-2 ${severityBorder[item.severity]} p-3`}>
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className={`text-[10px] ${severityColor[item.severity]}`}>
            <SevIcon className="h-3 w-3 mr-0.5" />
            {severityLabel[item.severity]}
          </Badge>
          <Badge variant="outline" className="text-[10px] flex items-center gap-1">
            <ActionIcon className="h-3 w-3" />
            {actionLabel}
          </Badge>
          {item.entity?.name && (
            <span className="text-xs text-muted-foreground truncate max-w-[300px]">
              {item.entity.name}
            </span>
          )}
        </div>
        <p className="text-sm font-medium">{item.title}</p>
        <p className="text-xs text-muted-foreground">{item.description}</p>
      </div>
    </div>
  );
}

function ProposalItem({
  proposal,
  busy,
  reason,
  onReasonChange,
  onApprove,
  onReject,
  onExecute,
}: {
  proposal: ActionProposal;
  busy: boolean;
  reason: string;
  onReasonChange: (val: string) => void;
  onApprove: () => void;
  onReject: () => void;
  onExecute: () => void;
}) {
  const ActionIcon = actionIconMap[proposal.action ?? ''] ?? Wand2;
  const actionLabel = actionLabelMap[proposal.action ?? ''] ?? proposal.action ?? '';

  return (
    <div className="rounded-[2px] border p-3 space-y-2">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant="outline" className={`text-[10px] ${statusBadgeClass[proposal.status]}`}>
              {statusLabel[proposal.status]}
            </Badge>
            {proposal.severity && (
              <Badge
                variant="outline"
                className={`text-[10px] ${severityColor[proposal.severity as OptimizationCenterSeverity] ?? ''}`}
              >
                {severityLabel[proposal.severity as OptimizationCenterSeverity] ?? proposal.severity}
              </Badge>
            )}
            {proposal.action && (
              <Badge variant="outline" className="text-[10px] flex items-center gap-1">
                <ActionIcon className="h-3 w-3" />
                {actionLabel}
              </Badge>
            )}
            {proposal.status === 'approved' && proposal.lastDecision?.decidedByUserId == null && (
              <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary">
                Auto-executado
              </Badge>
            )}
          </div>
          <p className="text-sm font-medium">{proposal.title ?? 'Proposta sem título'}</p>
          {proposal.description && (
            <p className="text-xs text-muted-foreground">{proposal.description}</p>
          )}
          <p className="text-[10px] text-muted-foreground">
            {formatDate(proposal.createdAt, 'dd/MM/yyyy HH:mm', '—')}
            {proposal.lastDecision && (
              <>
                {' · '}
                {proposal.lastDecision.decision === 'approved' ? 'aprovado' : 'rejeitado'}
                {proposal.lastDecision.reason ? `: ${proposal.lastDecision.reason}` : ''}
              </>
            )}
          </p>
        </div>

        {proposal.status === 'pending' && (
          <div className="flex flex-col gap-2 w-full sm:w-[280px]">
            <Input
              placeholder="Motivo (opcional)"
              value={reason}
              onChange={(e) => onReasonChange(e.target.value)}
              className="h-7 text-xs"
            />
            <div className="flex items-center justify-end gap-1.5">
              <Button size="sm" variant="outline" onClick={onReject} disabled={busy} className="h-7 text-xs">
                <X className="h-3 w-3" /> Rejeitar
              </Button>
              <Button size="sm" onClick={onApprove} disabled={busy} className="h-7 text-xs">
                <Check className="h-3 w-3" /> Aprovar
              </Button>
            </div>
          </div>
        )}

        {proposal.status === 'approved' && (
          <Button variant="outline" size="sm" onClick={onExecute} disabled={busy} className="h-7 text-xs">
            <Wand2 className="h-3 w-3" /> Executar (dry-run)
          </Button>
        )}
      </div>
    </div>
  );
}
