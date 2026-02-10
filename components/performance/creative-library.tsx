'use client';

import { useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import type { CreativeCoverage } from '@/app/clients/[id]/performance/use-client-performance-dashboard';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { MetaSyncDetails } from '@/lib/api/client';
import type { CreativeLibraryResponse, CreativeLibraryStatus } from '@/types';
import { formatDate } from '@/lib/utils';

import { statusBadgeClass } from './creative-library/formatters';
import { CreativeLibraryInsightsPanel } from './creative-library/insights';
import { CreativeLibraryRow } from './creative-library/row';

const EMPTY_CREATIVES: CreativeLibraryResponse['creatives'] = [];

interface CreativeLibraryProps {
  data: CreativeLibraryResponse | null;
  loading?: boolean;
  scope: 'campaign' | 'client';
  hasCampaignSelected: boolean;
  onScopeChange: (value: 'campaign' | 'client') => void;
  creativeCoverage?: CreativeCoverage | null;
  creativeCoverageDetails?: MetaSyncDetails | null;
}

type FilterStatus = 'all' | CreativeLibraryStatus;
type SortKey = 'spend' | 'conversations' | 'cpl' | 'trend';

const getSyncErrorMessage = (details: MetaSyncDetails | null | undefined) => {
  if (!details) return null;
  if (details.errorMessage) return details.errorMessage;
  if (typeof details.metadata?.error === 'string') return details.metadata.error;
  return null;
};

export function CreativeLibrary({
  data,
  loading,
  scope,
  hasCampaignSelected,
  onScopeChange,
  creativeCoverage,
  creativeCoverageDetails,
}: CreativeLibraryProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [sortKey, setSortKey] = useState<SortKey>('spend');

  const creatives = data?.creatives ?? EMPTY_CREATIVES;
  const insights = data?.insights ?? null;
  const periodLabel = data?.period
    ? `${formatDate(data.period.start, 'dd/MM/yyyy', data.period.start)} – ${formatDate(data.period.end, 'dd/MM/yyyy', data.period.end)}`
    : null;
  const scopeLabel = scope === 'campaign' ? 'para a campanha selecionada' : 'para o cliente';

  const creativeCoverageClass =
    creativeCoverage?.state === 'success'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
      : creativeCoverage?.state === 'partial' || creativeCoverage?.state === 'running'
        ? 'border-amber-200 bg-amber-50 text-amber-900'
        : creativeCoverage?.state === 'failed'
          ? 'border-rose-200 bg-rose-50 text-rose-800'
          : 'text-muted-foreground';

  const creativeSyncLevel = creativeCoverageDetails?.metadata?.syncLevel ? String(creativeCoverageDetails.metadata.syncLevel) : null;
  const creativeSyncRange = creativeCoverageDetails ? `${creativeCoverageDetails.dateRangeStart} → ${creativeCoverageDetails.dateRangeEnd}` : null;
  const creativeSyncTimestamp = creativeCoverageDetails
    ? new Date(creativeCoverageDetails.completedAt ?? creativeCoverageDetails.startedAt).toLocaleString('pt-BR')
    : null;

  const showCreativeCallout = creativeCoverage && creativeCoverage.state !== 'success' && creativeCoverage.state !== 'running';
  const creativeCalloutBaseClass =
    creativeCoverage?.state === 'failed' ? 'border-rose-200 bg-rose-50' : 'border-amber-200 bg-amber-50';
  const creativeCalloutTextClass = creativeCoverage?.state === 'failed' ? 'text-rose-800' : 'text-amber-900';
  const creativeCalloutTextMutedClass = creativeCoverage?.state === 'failed' ? 'text-rose-800/80' : 'text-amber-900/80';
  const creativeCalloutTextSubtleClass = creativeCoverage?.state === 'failed' ? 'text-rose-800/70' : 'text-amber-900/70';

  const emptyTableMessage = useMemo(() => {
    const base = `Nenhum criativo encontrado ${scopeLabel}${periodLabel ? ` no período ${periodLabel}` : ''}.`;

    if (!creativeCoverage) {
      return `${base} Se a campanha não teve entrega, isso é esperado; caso contrário, execute o sync com syncLevel "ad" ou "full".`;
    }

    if (creativeCoverage.state === 'missing') {
      return `${base} Sem sync ad/full para capturar criativos. Rode o Sync Meta Ads (Full) no topo.`;
    }

    if (creativeCoverage.state === 'outdated') {
      return `${base} O último sync ad/full cobre ${creativeSyncRange ?? '—'}. Ajuste o período ou rode um novo sync full.`;
    }

    if (creativeCoverage.state === 'insufficient') {
      const level = creativeCoverage.syncLevel ?? creativeSyncLevel ?? '—';
      return `${base} Há sync no período, mas o nível é ${level}. Rode sync ad/full para capturar criativos e snapshots.`;
    }

    if (creativeCoverage.state === 'partial') {
      return `${base} Sync parcial pode deixar a biblioteca incompleta. Rode um sync full e revise unmapped/erros.`;
    }

    if (creativeCoverage.state === 'failed') {
      return `${base} Falha no sync. ${getSyncErrorMessage(creativeCoverageDetails) ? `Erro: ${getSyncErrorMessage(creativeCoverageDetails)}` : 'Rode um sync full e tente novamente.'}`;
    }

    if (creativeCoverage.state === 'running') {
      return `${base} Sincronizando criativos… aguarde a conclusão do sync.`;
    }

    return `${base} Se a campanha não teve entrega, isso é esperado.`;
  }, [creativeCoverage, creativeCoverageDetails, creativeSyncLevel, creativeSyncRange, periodLabel, scopeLabel]);

  const filtered = useMemo(() => {
    const base = statusFilter === 'all' ? creatives : creatives.filter((c) => c.status === statusFilter);
    const sorted = [...base];
    sorted.sort((a, b) => {
      if (sortKey === 'conversations') return (b.metrics.totalConversations || 0) - (a.metrics.totalConversations || 0);
      if (sortKey === 'cpl') {
        const aValue = a.metrics.cpl ?? Number.POSITIVE_INFINITY;
        const bValue = b.metrics.cpl ?? Number.POSITIVE_INFINITY;
        return aValue - bValue;
      }
      if (sortKey === 'trend') {
        const aValue = a.deltas.conversationsPct ?? -999999;
        const bValue = b.deltas.conversationsPct ?? -999999;
        return bValue - aValue;
      }
      return (b.metrics.totalSpend || 0) - (a.metrics.totalSpend || 0);
    });
    return sorted;
  }, [creatives, sortKey, statusFilter]);

  const toggleExpanded = (snapshotId: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(snapshotId)) next.delete(snapshotId);
      else next.add(snapshotId);
      return next;
    });
  };

  return (
    <Card className="border-l-4 border-l-violet-500">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          Biblioteca de Criativos
          <Badge variant="outline">Biblioteca</Badge>
        </CardTitle>
        <CardDescription>Agrupado por snapshot (copy/CTA). Mostra vencedores, perdedores e sinais de fadiga.</CardDescription>
        {creativeCoverage ? (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge variant="outline" className={creativeCoverageClass}>
              {creativeCoverage.label}
            </Badge>
            {creativeSyncTimestamp && (
              <span className="text-xs text-muted-foreground">
                Último sync: {creativeSyncTimestamp}
                {creativeSyncLevel ? ` · nível ${creativeSyncLevel}` : ''}
              </span>
            )}
          </div>
        ) : null}
        <div className="flex flex-wrap items-center gap-2 pt-2">
          <Select
            value={scope}
            onValueChange={(value) => onScopeChange(value as 'campaign' | 'client')}
            disabled={!hasCampaignSelected}
          >
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Escopo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="campaign">Campanha selecionada</SelectItem>
              <SelectItem value="client">Todas campanhas do cliente</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as FilterStatus)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="winner">Vencedores</SelectItem>
              <SelectItem value="fatigued">Fadiga</SelectItem>
              <SelectItem value="loser">Perdedores</SelectItem>
              <SelectItem value="neutral">Neutros</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortKey} onValueChange={(value) => setSortKey(value as SortKey)}>
            <SelectTrigger className="w-[170px]">
              <SelectValue placeholder="Ordenar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="spend">Investimento</SelectItem>
              <SelectItem value="conversations">Conversas</SelectItem>
              <SelectItem value="cpl">Menor CPL</SelectItem>
              <SelectItem value="trend">Tendência (conversas)</SelectItem>
            </SelectContent>
          </Select>

          {insights?.counts ? (
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className={statusBadgeClass.winner}>
                winners: {insights.counts.winners}
              </Badge>
              <Badge variant="outline" className={statusBadgeClass.fatigued}>
                fadiga: {insights.counts.fatigued}
              </Badge>
              <Badge variant="outline" className={statusBadgeClass.loser}>
                losers: {insights.counts.losers}
              </Badge>
            </div>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <CreativeLibraryInsightsPanel insights={insights} />
        {showCreativeCallout ? (
          <div className={`rounded-lg border p-4 ${creativeCalloutBaseClass}`}>
            <div className="space-y-1">
              <p className={`text-sm font-medium ${creativeCalloutTextClass}`}>Criativos (Meta Ads)</p>
              {creativeCoverage.state === 'missing' ? (
                <p className={`text-sm ${creativeCalloutTextMutedClass}`}>
                  Sem sync <span className="font-medium">ad/full</span> para capturar criativos e snapshots no período. Rode o{' '}
                  <span className="font-medium">Sync Meta Ads (Full)</span> no topo.
                </p>
              ) : creativeCoverage.state === 'outdated' ? (
                <p className={`text-sm ${creativeCalloutTextMutedClass}`}>
                  O último sync <span className="font-medium">ad/full</span> que encontramos cobre{' '}
                  <span className="font-medium">{creativeSyncRange ?? '—'}</span>. Ajuste o período selecionado ou rode um novo sync full.
                </p>
              ) : creativeCoverage.state === 'insufficient' ? (
                <p className={`text-sm ${creativeCalloutTextMutedClass}`}>
                  Há sync no período, mas o nível é <span className="font-medium">{creativeCoverage.syncLevel ?? creativeSyncLevel ?? '—'}</span>. Rode{' '}
                  <span className="font-medium">ad/full</span> para capturar criativos e snapshots.
                </p>
              ) : creativeCoverage.state === 'partial' ? (
                <p className={`text-sm ${creativeCalloutTextMutedClass}`}>
                  Sync parcial pode deixar a biblioteca incompleta. Rode um sync full e revise campanhas <span className="font-medium">unmapped</span>/erros.
                </p>
              ) : (
                <p className={`text-sm ${creativeCalloutTextMutedClass}`}>
                  Falha no sync. {getSyncErrorMessage(creativeCoverageDetails) ? `Erro: ${getSyncErrorMessage(creativeCoverageDetails)}` : 'Verifique token e tente novamente.'}
                </p>
              )}
              {creativeSyncRange || creativeSyncLevel ? (
                <p className={`text-xs ${creativeCalloutTextSubtleClass}`}>
                  {creativeSyncLevel ? `nível: ${creativeSyncLevel}` : null}
                  {creativeSyncLevel && creativeSyncRange ? ' · ' : null}
                  {creativeSyncRange ? `janela: ${creativeSyncRange}` : null}
                </p>
              ) : null}
            </div>
          </div>
        ) : null}

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Criativo</TableHead>
                  <TableHead className="text-right">Conversas</TableHead>
                  <TableHead className="text-right">CPL</TableHead>
                  <TableHead className="text-right">Investimento</TableHead>
                  <TableHead className="text-right">7d vs 7d</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      {emptyTableMessage}
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((creative) => (
                    <CreativeLibraryRow
                      key={creative.snapshotId}
                      creative={creative}
                      expanded={expanded.has(creative.snapshotId)}
                      onToggle={() => toggleExpanded(creative.snapshotId)}
                    />
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
