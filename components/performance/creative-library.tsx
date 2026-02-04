'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { CreativeLibraryResponse, CreativeLibraryStatus, CreativeLibraryItem } from '@/types';

interface CreativeLibraryProps {
  data: CreativeLibraryResponse | null;
  loading?: boolean;
  scope: 'campaign' | 'client';
  hasCampaignSelected: boolean;
  onScopeChange: (value: 'campaign' | 'client') => void;
}

const formatNumber = (value: number) => {
  if (!Number.isFinite(value)) return '-';
  return value.toLocaleString('pt-BR');
};

const formatCurrency = (value: number | null) => {
  if (value == null || !Number.isFinite(value) || value === 0) return '-';
  return `R$ ${value.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}`;
};

const getDomainFromUrl = (value: string | null | undefined) => {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.hostname;
  } catch {
    return value;
  }
};

const formatCta = (value: string | null | undefined) => {
  if (!value) return null;
  const map: Record<string, string> = {
    LEARN_MORE: 'Saiba mais',
    SEND_MESSAGE: 'Mensagem',
    WHATSAPP_MESSAGE: 'WhatsApp',
    CONTACT_US: 'Contato',
    APPLY_NOW: 'Aplicar',
    SIGN_UP: 'Cadastre-se',
    BOOK_TRAVEL: 'Agendar',
    GET_OFFER: 'Oferta',
    CALL_NOW: 'Ligar',
  };
  if (map[value]) return map[value];
  return value.replace(/_/g, ' ').toLowerCase();
};

const statusLabel: Record<CreativeLibraryStatus, string> = {
  winner: 'winner',
  loser: 'loser',
  fatigued: 'fadiga',
  neutral: 'neutro',
};

const statusBadgeClass: Record<CreativeLibraryStatus, string> = {
  winner: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  fatigued: 'bg-amber-100 text-amber-900 border-amber-200',
  loser: 'bg-rose-100 text-rose-800 border-rose-200',
  neutral: 'bg-muted text-muted-foreground border-border',
};

const pctClass = (value: number | null | undefined, invert?: boolean) => {
  if (value == null || !Number.isFinite(value)) return 'text-muted-foreground';
  const normalized = invert ? -value : value;
  if (normalized >= 20) return 'text-emerald-600 font-medium';
  if (normalized <= -20) return 'text-rose-600 font-medium';
  return 'text-muted-foreground';
};

type FilterStatus = 'all' | CreativeLibraryStatus;
type SortKey = 'spend' | 'conversations' | 'cpl' | 'trend';

export function CreativeLibrary({ data, loading, scope, hasCampaignSelected, onScopeChange }: CreativeLibraryProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [sortKey, setSortKey] = useState<SortKey>('spend');

  const creatives = data?.creatives ?? [];

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

  const insights = data?.insights ?? null;

  const renderInsights = () => {
    if (!insights) return null;
    const hasAny = insights.topCtas.length > 0 || insights.topHeadlines.length > 0;
    if (!hasAny) return null;

    return (
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-dashed">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">CTAs que mais geram conversas</CardTitle>
            <CardDescription>Baseado nos melhores criativos do período</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {insights.topCtas.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem dados.</p>
            ) : (
              insights.topCtas.map((item) => (
                <div key={item.ctaType} className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{formatCta(item.ctaType) ?? item.ctaType}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatNumber(item.conversations)} conversas · CPL {formatCurrency(item.cpl)}
                    </p>
                  </div>
                  <Badge variant="outline">{formatCurrency(item.spend)}</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border-dashed">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Títulos que mais geram conversas</CardTitle>
            <CardDescription>Use como referência para novas variações</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {insights.topHeadlines.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem dados.</p>
            ) : (
              insights.topHeadlines.map((item) => (
                <div key={item.headline} className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{item.headline}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatNumber(item.conversations)} conversas · CPL {formatCurrency(item.cpl)}
                    </p>
                  </div>
                  <Badge variant="outline">{formatCurrency(item.spend)}</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderCreativeRow = (creative: CreativeLibraryItem): ReactNode[] => {
    const thumbnailUrl = creative.thumbnailUrl || creative.imageUrl || null;
    const domain = getDomainFromUrl(creative.destinationUrl);
    const ctaLabel = formatCta(creative.ctaType);

    const rowKey = creative.snapshotId;
    const isExpanded = expanded.has(rowKey);

    const rows: ReactNode[] = [];

    rows.push(
      <TableRow
        key={rowKey}
        className="cursor-pointer"
        onClick={() => {
          setExpanded((prev) => {
            const next = new Set(prev);
            if (next.has(rowKey)) next.delete(rowKey);
            else next.add(rowKey);
            return next;
          });
        }}
      >
        <TableCell className="max-w-[520px]">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 flex-none overflow-hidden rounded-md border bg-muted">
              {thumbnailUrl ? (
                <img
                  src={thumbnailUrl}
                  alt="Preview do criativo"
                  className="h-full w-full object-cover"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
              ) : null}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium truncate max-w-[360px]">
                  {creative.headline || 'Criativo'}
                </p>
                <Badge variant="outline" className={statusBadgeClass[creative.status]}>
                  {statusLabel[creative.status]}
                </Badge>
                {ctaLabel && <Badge variant="outline">{ctaLabel}</Badge>}
                {domain && <Badge variant="outline">{domain}</Badge>}
                {creative.isDynamic && <Badge variant="secondary">dynamic</Badge>}
              </div>
              <p className="text-xs text-muted-foreground truncate max-w-[520px]">
                snapshot {creative.snapshotId.slice(0, 8)} · {creative.adsCount} ads · {creative.campaigns.length} campanhas · {creative.adsets.length} adsets
              </p>
            </div>
          </div>
        </TableCell>
        <TableCell className="text-right">{formatNumber(creative.metrics.totalConversations)}</TableCell>
        <TableCell className="text-right">{formatCurrency(creative.metrics.cpl)}</TableCell>
        <TableCell className="text-right">{formatCurrency(creative.metrics.totalSpend)}</TableCell>
        <TableCell className="text-right">
          <div className="space-y-0.5">
            <p className={pctClass(creative.deltas.conversationsPct)}>
              {creative.deltas.conversationsPct != null ? `${creative.deltas.conversationsPct.toFixed(0)}%` : '—'}
            </p>
            <p className={pctClass(creative.deltas.cplPct, true)}>
              {creative.deltas.cplPct != null ? `${creative.deltas.cplPct.toFixed(0)}%` : '—'}
            </p>
          </div>
        </TableCell>
      </TableRow>
    );

    if (isExpanded) {
      const listHeadlines = Array.isArray(creative.headlines) ? creative.headlines : [];
      const listPrimaryTexts = Array.isArray(creative.primaryTexts) ? creative.primaryTexts : [];
      const listCtas = Array.isArray(creative.ctaTypes) ? creative.ctaTypes : [];
      const listUrls = Array.isArray(creative.destinationUrls) ? creative.destinationUrls : [];

      rows.push(
        <TableRow key={`${rowKey}:details`}>
          <TableCell colSpan={5} className="bg-muted/30">
            <div className="space-y-3 py-2">
              {creative.primaryText && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Texto principal</p>
                  <p className="text-sm whitespace-pre-wrap">{creative.primaryText}</p>
                </div>
              )}

              {creative.description && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Descrição</p>
                  <p className="text-sm whitespace-pre-wrap">{creative.description}</p>
                </div>
              )}

              {(listHeadlines.length > 1 || listPrimaryTexts.length > 1 || listCtas.length > 1 || listUrls.length > 1) && (
                <div className="grid gap-4 md:grid-cols-2">
                  {listHeadlines.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Títulos ({listHeadlines.length})</p>
                      <div className="mt-1 space-y-1">
                        {listHeadlines.slice(0, 5).map((text, idx) => (
                          <p key={idx} className="text-sm">{String(text)}</p>
                        ))}
                      </div>
                    </div>
                  )}
                  {listPrimaryTexts.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Textos ({listPrimaryTexts.length})</p>
                      <div className="mt-1 space-y-1">
                        {listPrimaryTexts.slice(0, 5).map((text, idx) => (
                          <p key={idx} className="text-sm">{String(text)}</p>
                        ))}
                      </div>
                    </div>
                  )}
                  {listCtas.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">CTAs ({listCtas.length})</p>
                      <div className="mt-1 flex flex-wrap gap-2">
                        {listCtas.slice(0, 10).map((cta, idx) => (
                          <Badge key={idx} variant="outline">{formatCta(String(cta)) || String(cta)}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {listUrls.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">URLs ({listUrls.length})</p>
                      <div className="mt-1 space-y-1">
                        {listUrls.slice(0, 5).map((url, idx) => (
                          <p key={idx} className="text-sm break-all">{String(url)}</p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {creative.campaigns.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Onde rodou (campanhas)</p>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {creative.campaigns.slice(0, 8).map((name) => (
                      <Badge key={name} variant="secondary">{name}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {creative.adsets.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Onde rodou (adsets)</p>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {creative.adsets.slice(0, 10).map((adset) => (
                      <Badge key={adset.adsetId} variant="outline">
                        {adset.adsetName || adset.adsetId}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs text-muted-foreground">
                  {creative.capturedAt ? `Snapshot: ${new Date(creative.capturedAt).toLocaleString('pt-BR')}` : ''}
                  {creative.lastSeenAt ? ` · Última vez visto: ${new Date(creative.lastSeenAt).toLocaleString('pt-BR')}` : ''}
                </p>
                {creative.destinationUrl && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(creative.destinationUrl!, '_blank', 'noopener,noreferrer');
                    }}
                  >
                    Abrir URL
                  </Button>
                )}
              </div>
            </div>
          </TableCell>
        </TableRow>
      );
    }

    return rows;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Biblioteca de Criativos
          <Badge variant="outline">Library</Badge>
        </CardTitle>
        <CardDescription>
          Agrupado por snapshot (copy/CTA). Mostra vencedores, perdedores e sinais de fadiga.
        </CardDescription>
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

          {insights?.counts && (
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
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {renderInsights()}

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
                      Nenhum criativo encontrado. Execute o sync com syncLevel &quot;ad&quot; ou &quot;full&quot;.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.flatMap((creative) => renderCreativeRow(creative))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

