'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ChevronDown, ChevronUp, FileText, PlusCircle, RefreshCw } from 'lucide-react';

import type { MetaSyncDetails } from '@/lib/api/client';
import type { MetricsPeriod, MetricsQuery } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import type { MetaCoverage } from '../use-client-performance-dashboard';

const periodOptions: Array<{ value: MetricsPeriod; label: string }> = [
  { value: '7d', label: 'Últimos 7 dias' },
  { value: '14d', label: 'Últimos 14 dias' },
  { value: '30d', label: 'Últimos 30 dias' },
  { value: '60d', label: 'Últimos 60 dias' },
  { value: '90d', label: 'Últimos 90 dias' },
  { value: 'custom', label: 'Personalizado' },
];

interface CampaignOption {
  campaignId: string;
  campaignName: string;
}

export const PerformanceDashboardHeader = (props: {
  clientId: string;
  clientName: string;
  lastUpdatedAt: string | null;
  metaCoverage: MetaCoverage | null;
  metaSyncHistoryLoading: boolean;
  metaLastSuccessfulSync: string | null;
  period: MetricsPeriod;
  setPeriod: (value: MetricsPeriod) => void;
  customStartDate: string;
  setCustomStartDate: (value: string) => void;
  customEndDate: string;
  setCustomEndDate: (value: string) => void;
  metricsQuery: MetricsQuery;
  setMetricsQuery: (value: MetricsQuery) => void;
  resolvedRange: { startDate: string; endDate: string } | null;
  refreshing: boolean;
  onRefreshAll: () => void;
  metaAdAccountId: string;
  syncing: boolean;
  onMetaSync: () => void;
  metaSyncDetails: MetaSyncDetails | null;
  metaSyncHistory: MetaSyncDetails[];
  metaSyncMessage: string;
  metaSyncPercent: number | null;
  metaSyncRange: string | null;
  campaigns: CampaignOption[];
  selectedCampaignId: string | null;
  setSelectedCampaignId: (value: string) => void;
  showTrackingForm: boolean;
  onToggleTrackingForm: () => void;
  onOpenReportGenerator: () => void;
  error: string | null;
  setError: (value: string | null) => void;
}) => {
  const metaSyncProgress = props.metaSyncDetails?.metadata?.progress;
  const [showMetaHistory, setShowMetaHistory] = useState(false);

  const metaCoverageClass =
    props.metaCoverage?.state === 'success'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
      : props.metaCoverage?.state === 'partial' || props.metaCoverage?.state === 'running'
        ? 'border-amber-200 bg-amber-50 text-amber-900'
        : props.metaCoverage?.state === 'failed'
          ? 'border-rose-200 bg-rose-50 text-rose-800'
          : 'text-muted-foreground';

  return (
    <>
      {/* Linha 1: Navegação + Título + Período */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon-sm">
            <Link href={`/clients/${props.clientId}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Performance</h1>
            <p className="text-sm text-muted-foreground">{props.clientName}</p>
            {props.lastUpdatedAt && (
              <p className="text-xs text-muted-foreground">Atualizado: {new Date(props.lastUpdatedAt).toLocaleString('pt-BR')}</p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {props.campaigns.length > 0 && (
            <Select
              value={props.selectedCampaignId ?? undefined}
              onValueChange={(value) => props.setSelectedCampaignId(value)}
            >
              <SelectTrigger className="flex-1 min-w-[240px] max-w-[520px] lg:min-w-[280px] xl:min-w-[420px]">
                <SelectValue placeholder="Campanha" />
              </SelectTrigger>
              <SelectContent className="w-[min(92vw,680px)] min-w-[260px] max-w-[680px]">
                {props.campaigns.map((c) => (
                  <SelectItem
                    key={c.campaignId}
                    value={c.campaignId}
                    className="whitespace-normal break-words leading-snug items-start py-2"
                  >
                    {c.campaignName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Select
            value={props.period}
            onValueChange={(value) => {
              const next = value as MetricsPeriod;
              props.setPeriod(next);

              if (next === 'custom') {
                const range = props.resolvedRange ?? { startDate: props.customStartDate, endDate: props.customEndDate };
                props.setCustomStartDate(range.startDate);
                props.setCustomEndDate(range.endDate);
                props.setMetricsQuery({ period: 'custom', startDate: range.startDate, endDate: range.endDate });
                return;
              }

              props.setMetricsQuery({ period: next });
            }}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              {periodOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {props.period === 'custom' && (
            <>
              <Input
                type="date"
                value={props.customStartDate}
                onChange={(e) => props.setCustomStartDate(e.target.value)}
                className="w-[140px]"
              />
              <span className="text-sm text-muted-foreground">até</span>
              <Input type="date" value={props.customEndDate} onChange={(e) => props.setCustomEndDate(e.target.value)} className="w-[140px]" />
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (!props.customStartDate || !props.customEndDate) {
                    props.setError('Selecione a data inicial e a data final.');
                    return;
                  }
                  if (props.customStartDate > props.customEndDate) {
                    props.setError('A data inicial deve ser anterior à data final.');
                    return;
                  }

                  props.setError(null);
                  props.setMetricsQuery({
                    period: 'custom',
                    startDate: props.customStartDate,
                    endDate: props.customEndDate,
                  });
                }}
                disabled={props.refreshing || props.syncing}
              >
                Aplicar
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Linha 2: Ações */}
      <div className="flex flex-wrap items-center gap-2">
        {props.metaCoverage && (
          <Badge variant="outline" className={metaCoverageClass}>
            {props.metaCoverage.label}
          </Badge>
        )}

        {props.metaSyncHistoryLoading && <span className="text-xs text-muted-foreground">carregando sync…</span>}

        {props.metaLastSuccessfulSync && (
          <span className="text-xs text-muted-foreground">
            Sync OK: {new Date(props.metaLastSuccessfulSync).toLocaleString('pt-BR')}
          </span>
        )}

        <div className="flex-1" />

        <Button
          variant="default"
          size="sm"
          className="gap-2"
          onClick={props.onMetaSync}
          disabled={props.syncing || !props.metaAdAccountId.trim()}
        >
          <RefreshCw className={`h-3.5 w-3.5 ${props.syncing ? 'animate-spin' : ''}`} />
          {props.syncing ? 'Sincronizando...' : 'Sync Meta'}
        </Button>

        {!props.metaAdAccountId.trim() && (
          <Button variant="outline" size="sm" asChild>
            <Link href={`/clients/${props.clientId}?tab=edit`}>Configurar Meta</Link>
          </Button>
        )}

        <Button variant="outline" size="sm" className="gap-2" onClick={props.onRefreshAll} disabled={props.refreshing || props.syncing}>
          <RefreshCw className={`h-3.5 w-3.5 ${props.refreshing ? 'animate-spin' : ''}`} />
          Recarregar
        </Button>

        {props.selectedCampaignId && (
          <Button variant="outline" size="sm" className="gap-2" onClick={props.onToggleTrackingForm}>
            <PlusCircle className="h-3.5 w-3.5" />
            {props.showTrackingForm ? 'Ocultar' : 'Dados do Funil'}
          </Button>
        )}

        <Button variant="outline" size="sm" className="gap-2" onClick={props.onOpenReportGenerator}>
          <FileText className="h-3.5 w-3.5" />
          Relatório
        </Button>
      </div>

      {props.metaCoverage && props.metaCoverage.state !== 'success' && props.metaCoverage.state !== 'running' ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <p className="text-sm font-medium text-amber-900">Meta Ads</p>
              {props.metaCoverage.state === 'missing' ? (
                <p className="text-sm text-amber-900/80">
                  Sem sync registrado para este período. Rode um <span className="font-medium">Sync Meta</span> para preencher os dados.
                </p>
              ) : props.metaCoverage.state === 'outdated' ? (
                <p className="text-sm text-amber-900/80">
                  O último sync cobre <span className="font-medium">{props.metaSyncDetails?.dateRangeStart} → {props.metaSyncDetails?.dateRangeEnd}</span>, mas o período selecionado está fora dessa janela.
                </p>
              ) : props.metaCoverage.state === 'partial' ? (
                <p className="text-sm text-amber-900/80">
                  Sync parcial{props.metaSyncDetails?.unmappedCampaigns?.length ? `: ${props.metaSyncDetails.unmappedCampaigns.length} campanhas unmapped` : ''}. Rode um sync full e revise o mapeamento.
                </p>
              ) : (
                <p className="text-sm text-amber-900/80">
                  Sync com falha. {props.metaSyncDetails?.errorMessage ? `Erro: ${props.metaSyncDetails.errorMessage}` : 'Verifique token e tente novamente.'}
                </p>
              )}

              {props.metaSyncDetails?.metadata?.syncLevel ? (
                <p className="text-xs text-amber-900/70">
                  nível: {String(props.metaSyncDetails.metadata.syncLevel)} · início: {new Date(props.metaSyncDetails.startedAt).toLocaleString('pt-BR')}
                </p>
              ) : null}
            </div>

            {props.metaSyncHistory.length > 0 ? (
              <Button variant="outline" size="sm" className="gap-2" onClick={() => setShowMetaHistory((prev) => !prev)}>
                {showMetaHistory ? 'Ocultar histórico' : 'Ver histórico'}
                {showMetaHistory ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            ) : null}
          </div>

          {showMetaHistory ? (
            <div className="mt-3 space-y-2">
              {props.metaSyncHistory.slice(0, 5).map((item) => {
                const state = item.state ?? (item.completedAt ? item.status : 'running');
                const syncLevel = item.metadata?.syncLevel ? String(item.metadata.syncLevel) : '—';
                const unmapped = item.unmappedCampaigns?.length ?? 0;
                return (
                  <div key={item.id} className="rounded-md border border-amber-200 bg-white/60 p-3 text-xs text-amber-950">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-medium">
                        {new Date(item.startedAt).toLocaleString('pt-BR')} · {state} · nível {syncLevel}
                      </p>
                      <p className="text-amber-900/70">
                        {item.dateRangeStart} → {item.dateRangeEnd}
                      </p>
                    </div>
                    <p className="mt-1 text-amber-900/70">
                      mapped: {item.mappedCampaigns} · updated: {item.updatedMetrics} · unmapped: {unmapped}
                      {item.durationMs != null ? ` · duração: ${(item.durationMs / 1000).toFixed(1)}s` : ''}
                    </p>
                    {state === 'failed' && (item.errorMessage || item.metadata?.error) ? (
                      <p className="mt-1 text-rose-700">
                        {(item.errorMessage ?? (typeof item.metadata?.error === 'string' ? item.metadata.error : null)) || 'Falha no sync.'}
                      </p>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>
      ) : null}

      {props.syncing && (
        <div className="rounded-[2px] border border-primary/30 bg-primary/10 p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-primary">Meta Ads</p>
              <p className="text-sm text-foreground/80">
                {props.metaSyncMessage} {props.metaSyncPercent !== null ? `(${props.metaSyncPercent}%)` : ''}
              </p>
              {props.metaSyncRange && <p className="text-xs text-primary/70">{props.metaSyncRange}</p>}
            </div>
            {metaSyncProgress?.stage && (
              <p className="text-xs text-primary/70">
                {metaSyncProgress.stage} {(metaSyncProgress.stageCompleted ?? 0)}/{(metaSyncProgress.stageTotal ?? 0)}
              </p>
            )}
          </div>
        </div>
      )}

      {props.error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-destructive">Atenção</p>
              <p className="text-sm text-muted-foreground">{props.error}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => props.setError(null)}>
              Fechar
            </Button>
          </div>
        </div>
      )}
    </>
  );
};
