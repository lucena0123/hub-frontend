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
  selectedCampaignId: string | null;
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
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon-sm">
            <Link href={`/clients/${props.clientId}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Performance Dashboard</h1>
            <p className="text-muted-foreground">{props.clientName}</p>
            {props.lastUpdatedAt && (
              <p className="text-xs text-muted-foreground">Última atualização: {new Date(props.lastUpdatedAt).toLocaleString('pt-BR')}</p>
            )}
            {(props.metaCoverage || props.metaSyncHistoryLoading || props.metaLastSuccessfulSync) && (
              <div className="mt-1 flex flex-wrap items-center gap-2">
                {props.metaCoverage && (
                  <Badge variant="outline" className={metaCoverageClass}>
                    {props.metaCoverage.label}
                  </Badge>
                )}
                {props.metaSyncHistoryLoading && <span className="text-xs text-muted-foreground">carregando sync…</span>}
                {props.metaLastSuccessfulSync && (
                  <span className="text-xs text-muted-foreground">
                    Último sync OK: {new Date(props.metaLastSuccessfulSync).toLocaleString('pt-BR')}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
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
              <SelectValue placeholder="Select period" />
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
            <div className="flex flex-wrap items-center gap-2">
              <Input
                type="date"
                value={props.customStartDate}
                onChange={(e) => props.setCustomStartDate(e.target.value)}
                className="w-[150px]"
              />
              <span className="text-sm text-muted-foreground">até</span>
              <Input type="date" value={props.customEndDate} onChange={(e) => props.setCustomEndDate(e.target.value)} className="w-[150px]" />
              <Button
                variant="outline"
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
            </div>
          )}

          <Button variant="outline" className="gap-2" onClick={props.onRefreshAll} disabled={props.refreshing || props.syncing}>
            <RefreshCw className={`h-4 w-4 ${props.refreshing ? 'animate-spin' : ''}`} />
            {props.refreshing ? 'Atualizando...' : 'Recarregar'}
          </Button>

          <Input
            value={props.metaAdAccountId}
            placeholder="Meta Ad Account ID (configure no cliente)"
            className="w-[210px] font-mono text-xs"
            readOnly
          />

          {!props.metaAdAccountId.trim() && (
            <Button variant="outline" asChild>
              <Link href={`/clients/${props.clientId}?tab=edit`}>Configurar Meta</Link>
            </Button>
          )}

          <Button
            variant="default"
            className="gap-2 bg-blue-600 hover:bg-blue-700"
            onClick={props.onMetaSync}
            disabled={props.syncing || !props.metaAdAccountId.trim()}
          >
            <RefreshCw className={`h-4 w-4 ${props.syncing ? 'animate-spin' : ''}`} />
            {props.syncing ? 'Sincronizando...' : 'Sync Meta Ads (Full)'}
          </Button>

          {props.selectedCampaignId && (
            <Button variant="outline" className="gap-2" onClick={props.onToggleTrackingForm}>
              <PlusCircle className="h-4 w-4" />
              {props.showTrackingForm ? 'Ocultar' : 'Adicionar'} Dados do Funil
            </Button>
          )}

          <Button variant="outline" className="gap-2" onClick={props.onOpenReportGenerator}>
            <FileText className="h-4 w-4" />
            Gerar Relatório
          </Button>
          </div>
        </div>

        {props.metaCoverage && props.metaCoverage.state !== 'success' && props.metaCoverage.state !== 'running' ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1">
                <p className="text-sm font-medium text-amber-900">Meta Ads</p>
                {props.metaCoverage.state === 'missing' ? (
                  <p className="text-sm text-amber-900/80">
                    Sem sync registrado para este período. Rode um <span className="font-medium">Sync Meta Ads (Full)</span> para preencher os dados.
                  </p>
                ) : props.metaCoverage.state === 'outdated' ? (
                  <p className="text-sm text-amber-900/80">
                    O último sync cobre <span className="font-medium">{props.metaSyncDetails?.dateRangeStart} → {props.metaSyncDetails?.dateRangeEnd}</span>, mas o período selecionado está fora dessa janela.
                  </p>
                ) : props.metaCoverage.state === 'partial' ? (
                  <p className="text-sm text-amber-900/80">
                    Sync parcial{props.metaSyncDetails?.unmappedCampaigns?.length ? `: ${props.metaSyncDetails.unmappedCampaigns.length} campanhas unmapped` : ''}. Rode um sync full e revise o mapeamento/importação.
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
                <Button variant="outline" className="gap-2" onClick={() => setShowMetaHistory((prev) => !prev)}>
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
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-blue-700">Meta Ads</p>
              <p className="text-sm text-blue-700/80">
                {props.metaSyncMessage} {props.metaSyncPercent !== null ? `(${props.metaSyncPercent}%)` : ''}
              </p>
              {props.metaSyncRange && <p className="text-xs text-blue-700/70">{props.metaSyncRange}</p>}
            </div>
            {metaSyncProgress?.stage && (
              <p className="text-xs text-blue-700/70">
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
