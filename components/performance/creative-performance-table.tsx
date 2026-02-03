'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface CreativeSnapshot {
  snapshotId: string;
  creativeId: string | null;
  capturedAt: string | null;
  headline: string | null;
  primaryText: string | null;
  description: string | null;
  ctaType: string | null;
  destinationUrl: string | null;
  imageUrl: string | null;
  thumbnailUrl: string | null;
  videoId: string | null;
  format: string | null;
  isDynamic: boolean;
  headlines: unknown;
  primaryTexts: unknown;
  ctaTypes: unknown;
  destinationUrls: unknown;
}

interface AdCreativeMetric {
  adId: string;
  adName: string;
  adsetId: string;
  creativeId?: string | null;
  creativeSnapshotId?: string | null;
  creative?: CreativeSnapshot | null;
  totalImpressions: number;
  totalReach: number;
  totalClicks: number;
  totalSpend: number;
  totalConversions: number;
  totalMessagingConversations: number;
  avgCtr: number;
  avgCpm: number;
  cpl: number;
  videoThruplay: number;
  video3secViews: number;
  videoP25: number;
  videoP50: number;
  videoP75: number;
  videoP100: number;
  hookRate: number;
  holdRate: number;
}

interface CreativePerformanceTableProps {
  ads: AdCreativeMetric[];
  loading?: boolean;
}

const formatNumber = (value: number) => {
  if (!Number.isFinite(value)) return '-';
  return value.toLocaleString('pt-BR');
};

const formatCurrency = (value: number) => {
  if (!Number.isFinite(value) || value === 0) return '-';
  return `R$ ${value.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}`;
};

const toStringArray = (value: unknown): string[] => {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === 'string');
  return [];
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

const formatCreativeType = (value: string | null | undefined, isDynamic: boolean) => {
  if (isDynamic) return 'dynamic';
  if (!value) return null;
  return value.replace(/_/g, ' ').toLowerCase();
};

function rateColor(rate: number, type: 'hook' | 'hold'): string {
  if (type === 'hook') {
    if (rate >= 30) return 'text-emerald-600 font-medium';
    if (rate >= 15) return 'text-yellow-600';
    return 'text-rose-600';
  }
  // hold rate
  if (rate >= 50) return 'text-emerald-600 font-medium';
  if (rate >= 25) return 'text-yellow-600';
  return 'text-rose-600';
}

export function CreativePerformanceTable({ ads, loading }: CreativePerformanceTableProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const sortedAds = useMemo(() => {
    return [...ads].sort((a, b) => (b.totalSpend || 0) - (a.totalSpend || 0));
  }, [ads]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Performance de Criativos</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-10">
          <p className="text-muted-foreground">Carregando...</p>
        </CardContent>
      </Card>
    );
  }

  const hasVideoData = sortedAds.some(ad => ad.video3secViews > 0 || ad.videoThruplay > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Performance de Criativos
          <Badge variant="outline">Ads</Badge>
        </CardTitle>
        <CardDescription>
          Análise individual de cada anúncio{hasVideoData ? ' com métricas de vídeo' : ''}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Criativo</TableHead>
                <TableHead className="text-right">Conversas</TableHead>
                <TableHead className="text-right">CPL</TableHead>
                <TableHead className="text-right">CTR</TableHead>
                <TableHead className="text-right">CPM</TableHead>
                {hasVideoData && (
                  <>
                    <TableHead className="text-right">Hook Rate</TableHead>
                    <TableHead className="text-right">Hold Rate</TableHead>
                  </>
                )}
                <TableHead className="text-right">Investimento</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedAds.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={hasVideoData ? 8 : 6} className="text-center text-muted-foreground">
                    Nenhum dado de criativos disponível. Execute o sync com syncLevel &quot;ad&quot; ou &quot;full&quot;.
                  </TableCell>
                </TableRow>
              ) : (
                sortedAds.flatMap((ad) => {
                  const creative = ad.creative || null;
                  const snapshotId = creative?.snapshotId || ad.creativeSnapshotId || null;
                  const rowKey = snapshotId ? `${ad.adId}:${snapshotId}` : ad.adId;
                  const primaryText = creative?.primaryText || null;
                  const domain = getDomainFromUrl(creative?.destinationUrl);
                  const ctaLabel = formatCta(creative?.ctaType);
                  const typeLabel = formatCreativeType(creative?.format, Boolean(creative?.isDynamic));
                  const thumbnailUrl = creative?.thumbnailUrl || creative?.imageUrl || null;
                  const isExpanded = Boolean(snapshotId && expanded.has(rowKey));

                  const rows: ReactNode[] = [];

                  rows.push(
                    <TableRow
                      key={rowKey}
                      className={snapshotId ? 'cursor-pointer' : undefined}
                      onClick={() => {
                        if (!snapshotId) return;
                        setExpanded((prev) => {
                          const next = new Set(prev);
                          if (next.has(rowKey)) next.delete(rowKey);
                          else next.add(rowKey);
                          return next;
                        });
                      }}
                    >
                      <TableCell className="max-w-[420px]">
                        <div className="flex items-start gap-3">
                          <div className="h-10 w-10 flex-none overflow-hidden rounded-md border bg-muted">
                            {thumbnailUrl ? (
                              // Using <img> to avoid Next/Image remote config issues.
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
                              <p className="font-medium truncate max-w-[320px]">
                                {creative?.headline || ad.adName || ad.adId}
                              </p>
                              {ctaLabel && <Badge variant="outline">{ctaLabel}</Badge>}
                              {typeLabel && <Badge variant="secondary">{typeLabel}</Badge>}
                              {domain && <Badge variant="outline">{domain}</Badge>}
                              {!creative && <Badge variant="outline">sem snapshot</Badge>}
                            </div>
                            <p className="text-xs text-muted-foreground truncate max-w-[420px]">
                              {ad.adName || ad.adId}
                              {snapshotId ? ` · snapshot ${snapshotId.slice(0, 8)}` : ''}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{formatNumber(ad.totalMessagingConversations)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(ad.cpl)}</TableCell>
                      <TableCell className="text-right">{ad.avgCtr.toFixed(2)}%</TableCell>
                      <TableCell className="text-right">{formatCurrency(ad.avgCpm)}</TableCell>
                      {hasVideoData && (
                        <>
                          <TableCell className="text-right">
                            <span className={rateColor(ad.hookRate, 'hook')}>
                              {ad.hookRate > 0 ? `${ad.hookRate.toFixed(1)}%` : '-'}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <span className={rateColor(ad.holdRate, 'hold')}>
                              {ad.holdRate > 0 ? `${ad.holdRate.toFixed(1)}%` : '-'}
                            </span>
                          </TableCell>
                        </>
                      )}
                      <TableCell className="text-right">{formatCurrency(ad.totalSpend)}</TableCell>
                    </TableRow>
                  );

                  if (snapshotId && isExpanded) {
                    const headlines = toStringArray(creative?.headlines);
                    const primaryTexts = toStringArray(creative?.primaryTexts);
                    const ctas = toStringArray(creative?.ctaTypes);
                    const urls = toStringArray(creative?.destinationUrls);

                    rows.push(
                      <TableRow key={`${rowKey}:details`}>
                        <TableCell colSpan={hasVideoData ? 8 : 6} className="bg-muted/30">
                          <div className="space-y-3 py-2">
                            {primaryText && (
                              <div>
                                <p className="text-xs font-medium text-muted-foreground">Texto principal</p>
                                <p className="text-sm whitespace-pre-wrap">{primaryText}</p>
                              </div>
                            )}

                            {(headlines.length > 1 || primaryTexts.length > 1 || ctas.length > 1 || urls.length > 1) && (
                              <div className="grid gap-4 md:grid-cols-2">
                                {headlines.length > 0 && (
                                  <div>
                                    <p className="text-xs font-medium text-muted-foreground">Títulos ({headlines.length})</p>
                                    <div className="mt-1 space-y-1">
                                      {headlines.slice(0, 5).map((text, idx) => (
                                        <p key={idx} className="text-sm">{text}</p>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                {primaryTexts.length > 0 && (
                                  <div>
                                    <p className="text-xs font-medium text-muted-foreground">Textos ({primaryTexts.length})</p>
                                    <div className="mt-1 space-y-1">
                                      {primaryTexts.slice(0, 5).map((text, idx) => (
                                        <p key={idx} className="text-sm">{text}</p>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                {ctas.length > 0 && (
                                  <div>
                                    <p className="text-xs font-medium text-muted-foreground">CTAs ({ctas.length})</p>
                                    <div className="mt-1 flex flex-wrap gap-2">
                                      {ctas.slice(0, 10).map((cta, idx) => (
                                        <Badge key={idx} variant="outline">{formatCta(cta) || cta}</Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                {urls.length > 0 && (
                                  <div>
                                    <p className="text-xs font-medium text-muted-foreground">URLs ({urls.length})</p>
                                    <div className="mt-1 space-y-1">
                                      {urls.slice(0, 5).map((url, idx) => (
                                        <p key={idx} className="text-sm break-all">{url}</p>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <p className="text-xs text-muted-foreground">
                                {creative?.capturedAt ? `Snapshot: ${new Date(creative.capturedAt).toLocaleString('pt-BR')}` : ''}
                              </p>
                              {creative?.destinationUrl && (
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
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
