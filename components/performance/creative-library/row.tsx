'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TableCell, TableRow } from '@/components/ui/table';
import type { CreativeLibraryItem } from '@/types';

import { formatCta, formatCurrency, formatNumber, getDomainFromUrl, pctClass, statusBadgeClass, statusLabel } from './formatters';

export const CreativeLibraryRow = (props: { creative: CreativeLibraryItem; expanded: boolean; onToggle: () => void }) => {
  const { creative, expanded, onToggle } = props;

  const thumbnailUrl = creative.thumbnailUrl || creative.imageUrl || null;
  const domain = getDomainFromUrl(creative.destinationUrl);
  const ctaLabel = formatCta(creative.ctaType);

  const listHeadlines = Array.isArray(creative.headlines) ? creative.headlines : [];
  const listPrimaryTexts = Array.isArray(creative.primaryTexts) ? creative.primaryTexts : [];
  const listCtas = Array.isArray(creative.ctaTypes) ? creative.ctaTypes : [];
  const listUrls = Array.isArray(creative.destinationUrls) ? creative.destinationUrls : [];

  return (
    <>
      <TableRow className="cursor-pointer" onClick={onToggle}>
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
                <p className="font-medium truncate max-w-[360px]">{creative.headline || 'Criativo'}</p>
                <Badge variant="outline" className={statusBadgeClass[creative.status]}>
                  {statusLabel[creative.status]}
                </Badge>
                {ctaLabel && <Badge variant="outline">{ctaLabel}</Badge>}
                {domain && <Badge variant="outline">{domain}</Badge>}
                {creative.isDynamic && <Badge variant="secondary">dynamic</Badge>}
              </div>
              <p className="text-xs text-muted-foreground truncate max-w-[520px]">
                snapshot {creative.snapshotId.slice(0, 8)} · {creative.adsCount} ads · {creative.campaigns.length} campanhas · {creative.adsets.length}{' '}
                adsets
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
            <p className={pctClass(creative.deltas.cplPct, true)}>{creative.deltas.cplPct != null ? `${creative.deltas.cplPct.toFixed(0)}%` : '—'}</p>
          </div>
        </TableCell>
      </TableRow>

      {expanded ? (
        <TableRow>
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

              {listHeadlines.length > 1 || listPrimaryTexts.length > 1 || listCtas.length > 1 || listUrls.length > 1 ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {listHeadlines.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Títulos ({listHeadlines.length})</p>
                      <div className="mt-1 space-y-1">
                        {listHeadlines.slice(0, 5).map((text, idx) => (
                          <p key={idx} className="text-sm">
                            {String(text)}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                  {listPrimaryTexts.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Textos ({listPrimaryTexts.length})</p>
                      <div className="mt-1 space-y-1">
                        {listPrimaryTexts.slice(0, 5).map((text, idx) => (
                          <p key={idx} className="text-sm">
                            {String(text)}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                  {listCtas.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">CTAs ({listCtas.length})</p>
                      <div className="mt-1 flex flex-wrap gap-2">
                        {listCtas.slice(0, 10).map((cta, idx) => (
                          <Badge key={idx} variant="outline">
                            {formatCta(String(cta)) || String(cta)}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {listUrls.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">URLs ({listUrls.length})</p>
                      <div className="mt-1 space-y-1">
                        {listUrls.slice(0, 5).map((url, idx) => (
                          <p key={idx} className="text-sm break-all">
                            {String(url)}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : null}

              {creative.campaigns.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Onde rodou (campanhas)</p>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {creative.campaigns.slice(0, 8).map((name) => (
                      <Badge key={name} variant="secondary">
                        {name}
                      </Badge>
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
      ) : null}
    </>
  );
};

