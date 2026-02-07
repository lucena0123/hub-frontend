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
  generateActionProposals,
  listActionProposals,
  rejectActionProposal,
  type GenerateActionProposalsInput,
  type ListActionProposalsParams,
} from '@/lib/api/client';
import { formatDate } from '@/lib/utils';
import type {
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

type Tab = 'recommendations' | 'queue';

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
  executed: 'border-sky-200 bg-sky-50 text-sky-800',
  expired: 'border-slate-200 bg-slate-50 text-slate-700',
};

const statusLabel: Record<ActionProposalStatus, string> = {
  pending: 'Pendente',
  approved: 'Aprovado',
  rejected: 'Rejeitado',
  executed: 'Executado',
  expired: 'Expirado',
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

  // --- Action proposals state ---
  const [proposals, setProposals] = useState<ActionProposal[]>([]);
  const [reasonsById, setReasonsById] = useState<Record<string, string>>({});
  const [queueLoading, setQueueLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // --- Optimization data ---
  const summary = optimizationData?.summary ?? null;
  const items = optimizationData?.items ?? [];
  const theme = optimizationData?.theme ?? null;
  const visibleItems = useMemo(() => (showAll ? items : items.slice(0, 8)), [items, showAll]);

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
    <Card>
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
            ) : visibleItems.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">
                Nenhuma recomendação no período. Sincronize a Meta para gerar diagnósticos.
              </p>
            ) : (
              <div className="space-y-2">
                {visibleItems.map((item) => (
                  <RecommendationItem key={item.id} item={item} />
                ))}
                {items.length > 8 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAll((p) => !p)}
                    className="w-full text-xs"
                  >
                    {showAll ? (
                      <>
                        <ChevronUp className="h-3 w-3" /> Ver menos
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-3 w-3" /> Ver tudo ({items.length})
                      </>
                    )}
                  </Button>
                )}
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
    <div className={`rounded-lg border border-l-4 ${severityBorder[item.severity]} p-3`}>
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
    <div className="rounded-lg border p-3 space-y-2">
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
