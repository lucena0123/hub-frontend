'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TableCell, TableRow } from '@/components/ui/table';
import type { AdCreativeMetric, CreativeLibraryStatus } from '@/types';

import { formatCta, formatCurrency, formatNumber, getDomainFromUrl, statusBadgeClass, statusLabel } from '../creative-library/formatters';

import { formatCreativeType, rateColor, toStringArray } from './formatters';

type AnalysisReason = { code: string; message: string; severity: 'info' | 'warning' | 'critical' };

const reasonBadgeClass: Record<AnalysisReason['severity'], string> = {
  info: 'bg-blue-100 text-blue-800 border-blue-200',
  warning: 'bg-amber-100 text-amber-900 border-amber-200',
  critical: 'bg-rose-100 text-rose-800 border-rose-200',
};

const formatOptionalNumber = (value: number) => {
  if (!Number.isFinite(value) || value <= 0) return '—';
  return value.toLocaleString('pt-BR');
};

const formatPercent = (value: number, decimals = 1) => {
  if (!Number.isFinite(value) || value <= 0) return '—';
  return `${value.toFixed(decimals)}%`;
};

export const CreativePerformanceRow = (props: {
  ad: AdCreativeMetric;
  rowKey: string;
  snapshotId: string | null;
  expanded: boolean;
  hasVideoData: boolean;
  onToggle: () => void;
  status?: CreativeLibraryStatus;
  reasons?: AnalysisReason[];
}) => {
  const { ad, rowKey, snapshotId, expanded, hasVideoData, onToggle, status, reasons } = props;

  const creative = ad.creative || null;
  const primaryText = creative?.primaryText || null;
  const domain = getDomainFromUrl(creative?.destinationUrl);
  const ctaLabel = formatCta(creative?.ctaType);
  const typeLabel = formatCreativeType(creative?.format, Boolean(creative?.isDynamic));
  const thumbnailUrl = creative?.thumbnailUrl || creative?.imageUrl || null;

  const headlines = toStringArray(creative?.headlines);
  const primaryTexts = toStringArray(creative?.primaryTexts);
  const ctas = toStringArray(creative?.ctaTypes);
  const urls = toStringArray(creative?.destinationUrls);

  const clicks = ad.totalClicks || 0;
  const conversions = ad.totalConversions || 0;
  const cpc = clicks > 0 ? ad.totalSpend / clicks : 0;
  const cpa = conversions > 0 ? ad.totalSpend / conversions : 0;
  const conversionRate = clicks > 0 ? (conversions / clicks) * 100 : 0;

  const colSpan = hasVideoData ? 14 : 12;
  const canExpand = Boolean(snapshotId);

  return (
    <>
      <TableRow
        key={rowKey}
        className={canExpand ? 'cursor-pointer' : undefined}
        onClick={() => {
          if (!canExpand) return;
          onToggle();
        }}
      >
        <TableCell className="max-w-[420px]">
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
                <p className="font-medium truncate max-w-[320px]">{ad.adName || creative?.headline || ad.adId}</p>
                {status && (
                  <Badge variant="outline" className={statusBadgeClass[status]}>
                    {statusLabel[status]}
                  </Badge>
                )}
                {ctaLabel && <Badge variant="outline">{ctaLabel}</Badge>}
                {typeLabel && <Badge variant="secondary">{typeLabel}</Badge>}
                {domain && <Badge variant="outline">{domain}</Badge>}
                {!creative && <Badge variant="outline">sem snapshot</Badge>}
              </div>
              <p className="text-xs text-muted-foreground truncate max-w-[420px]">
                {creative?.headline || ad.adId}
                {snapshotId ? ` · snapshot ${snapshotId.slice(0, 8)}` : ''}
              </p>
            </div>
          </div>
        </TableCell>
        <TableCell className="text-right">{formatNumber(ad.totalMessagingConversations)}</TableCell>
        <TableCell className="text-right">{formatCurrency(ad.cpl)}</TableCell>
        <TableCell className="text-right">{formatNumber(ad.totalClicks)}</TableCell>
        <TableCell className="text-right">{formatOptionalNumber(ad.totalLinkClicks)}</TableCell>
        <TableCell className="text-right">{formatOptionalNumber(ad.totalLandingPageViews)}</TableCell>
        <TableCell className="text-right">{formatPercent(ad.avgCtr, 2)}</TableCell>
        <TableCell className="text-right">{formatCurrency(cpc)}</TableCell>
        <TableCell className="text-right">{formatCurrency(cpa)}</TableCell>
        <TableCell className="text-right">{formatPercent(conversionRate)}</TableCell>
        <TableCell className="text-right">{formatCurrency(ad.avgCpm)}</TableCell>
        {hasVideoData && (
          <>
            <TableCell className="text-right">
              <span className={rateColor(ad.hookRate, 'hook')}>{ad.hookRate > 0 ? `${ad.hookRate.toFixed(1)}%` : '-'}</span>
            </TableCell>
            <TableCell className="text-right">
              <span className={rateColor(ad.holdRate, 'hold')}>{ad.holdRate > 0 ? `${ad.holdRate.toFixed(1)}%` : '-'}</span>
            </TableCell>
          </>
        )}
        <TableCell className="text-right">{formatCurrency(ad.totalSpend)}</TableCell>
      </TableRow>

      {canExpand && expanded ? (
        <TableRow key={`${rowKey}:details`}>
          <TableCell colSpan={colSpan} className="bg-muted/30">
            <div className="space-y-3 py-2">
              {reasons && reasons.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Por que este status?</p>
                  <div className="mt-1 space-y-1">
                    {reasons.slice(0, 3).map((reason) => (
                      <div key={reason.code} className="flex flex-wrap items-start gap-2">
                        <Badge variant="outline" className={reasonBadgeClass[reason.severity]}>
                          {reason.severity}
                        </Badge>
                        <p className="text-sm text-muted-foreground">{reason.message}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {primaryText && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Texto principal</p>
                  <p className="text-sm whitespace-pre-wrap">{primaryText}</p>
                </div>
              )}

              {headlines.length > 1 || primaryTexts.length > 1 || ctas.length > 1 || urls.length > 1 ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {headlines.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Títulos ({headlines.length})</p>
                      <div className="mt-1 space-y-1">
                        {headlines.slice(0, 5).map((text, idx) => (
                          <p key={idx} className="text-sm">
                            {text}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                  {primaryTexts.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Textos ({primaryTexts.length})</p>
                      <div className="mt-1 space-y-1">
                        {primaryTexts.slice(0, 5).map((text, idx) => (
                          <p key={idx} className="text-sm">
                            {text}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                  {ctas.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">CTAs ({ctas.length})</p>
                      <div className="mt-1 flex flex-wrap gap-2">
                        {ctas.slice(0, 10).map((cta, idx) => (
                          <Badge key={idx} variant="outline">
                            {formatCta(cta) || cta}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {urls.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">URLs ({urls.length})</p>
                      <div className="mt-1 space-y-1">
                        {urls.slice(0, 5).map((url, idx) => (
                          <p key={idx} className="text-sm break-all">
                            {url}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : null}

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
      ) : null}
    </>
  );
};
