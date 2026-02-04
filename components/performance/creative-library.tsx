'use client';

import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
}

type FilterStatus = 'all' | CreativeLibraryStatus;
type SortKey = 'spend' | 'conversations' | 'cpl' | 'trend';

export function CreativeLibrary({ data, loading, scope, hasCampaignSelected, onScopeChange }: CreativeLibraryProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [sortKey, setSortKey] = useState<SortKey>('spend');

  const creatives = data?.creatives ?? EMPTY_CREATIVES;
  const insights = data?.insights ?? null;
  const periodLabel = data?.period
    ? `${formatDate(data.period.start, 'dd/MM/yyyy', data.period.start)} – ${formatDate(data.period.end, 'dd/MM/yyyy', data.period.end)}`
    : null;
  const scopeLabel = scope === 'campaign' ? 'para a campanha selecionada' : 'para o cliente';

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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Biblioteca de Criativos
          <Badge variant="outline">Library</Badge>
        </CardTitle>
        <CardDescription>Agrupado por snapshot (copy/CTA). Mostra vencedores, perdedores e sinais de fadiga.</CardDescription>
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
              <SelectItem value="winner">Winners</SelectItem>
              <SelectItem value="fatigued">Fadiga</SelectItem>
              <SelectItem value="loser">Losers</SelectItem>
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

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <p className="text-muted-foreground">Carregando biblioteca...</p>
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
                      Nenhum criativo encontrado {scopeLabel}
                      {periodLabel ? ` no período ${periodLabel}` : ''}. Se a campanha não teve entrega, isso é esperado; caso contrário, execute o sync com syncLevel &quot;ad&quot; ou &quot;full&quot;.
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
