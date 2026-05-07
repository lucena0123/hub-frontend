'use client';

import { Check, RefreshCw, Wand2, X } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatDate } from '@/lib/utils';
import type { MetricsQuery } from '@/types';
import {
  actionIconMap,
  actionLabelMap,
  statusBadgeClass,
  statusLabel,
  type StatusFilter,
} from './action-proposals/helpers';
import { useActionProposalsQueue } from './action-proposals/use-action-proposals-queue';

interface ActionProposalsQueueProps {
  clientId: string | null | undefined;
  metricsQuery?: MetricsQuery;
  selectedCampaignId?: string | null;
}

export function ActionProposalsQueue({ clientId, metricsQuery, selectedCampaignId }: ActionProposalsQueueProps) {
  const {
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
  } = useActionProposalsQueue({ clientId, metricsQuery, selectedCampaignId });

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
