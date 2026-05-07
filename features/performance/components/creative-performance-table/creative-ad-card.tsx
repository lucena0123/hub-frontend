import { ChevronDown, ChevronUp } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency, statusBadgeClass, statusLabel } from '@/components/performance/creative-library/formatters';
import type { AdCreativeMetric, CreativeLibraryResponse } from '@/types';
import type { MetricColumn, ObjectiveKey } from './columns';
import { buildCreativeAdView } from './creative-ad-view';
import { CreativeExpandedDetails } from './creative-expanded-details';
import { CreativeMetricGrid } from './creative-metric-grid';
import { CreativePyramidSection } from './creative-pyramid-section';
import {
  formatOptionalNumber,
  formatPercent,
} from './helpers';

interface CreativeAdCardProps {
  ad: AdCreativeMetric;
  columns: MetricColumn[];
  expanded: Set<string>;
  libraryLookup: Map<string, {
    status: NonNullable<CreativeLibraryResponse['creatives']>[number]['status'];
    reasons: NonNullable<NonNullable<CreativeLibraryResponse['creatives']>[number]['analysis']>['reasons'];
  }>;
  objectiveKey: ObjectiveKey;
  onToggleExpanded: (rowKey: string) => void;
}

export function CreativeAdCard({
  ad,
  columns,
  expanded,
  libraryLookup,
  objectiveKey,
  onToggleExpanded,
}: CreativeAdCardProps) {
  const snapshotId = ad.creative?.snapshotId || ad.creativeSnapshotId || null;
  const rowKey = snapshotId ? `${ad.adId}:${snapshotId}` : ad.adId;
  const isExpanded = Boolean(snapshotId && expanded.has(rowKey));
  const libraryEntry = snapshotId ? libraryLookup.get(snapshotId) : undefined;
  const creativeView = buildCreativeAdView(ad, objectiveKey, snapshotId);
  const {
    creative,
    cpc,
    conversionRate,
    conversationRate,
    conversions,
    ctaLabel,
    destinationLabel,
    clicks,
    leads,
    metricValues,
    purchases,
    pyramidLayers,
    thumbnailUrl,
    typeLabel,
  } = creativeView;

  return (
    <div className="rounded-[16px] border border-border/60 bg-card/70 p-5">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1.2fr)_minmax(0,0.9fr)]">
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="h-12 w-12 flex-none overflow-hidden rounded-[4px] border bg-muted">
              {thumbnailUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={thumbnailUrl} alt="Preview do criativo" className="h-full w-full object-cover" />
              ) : null}
            </div>
            <div className="min-w-0">
              <p className="font-medium leading-snug">{ad.adName || creative?.headline || ad.adId}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {libraryEntry?.status && (
                  <Badge
                    variant="outline"
                    className={statusBadgeClass[libraryEntry.status]}
                    title="Status do criativo baseado em performance recente."
                  >
                    {statusLabel[libraryEntry.status]}
                  </Badge>
                )}
                {ctaLabel && (
                  <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary" title="CTA configurado no anúncio.">
                    {ctaLabel}
                  </Badge>
                )}
                {typeLabel && (
                  <Badge variant="secondary" title="Formato do criativo.">
                    {typeLabel}
                  </Badge>
                )}
                {destinationLabel && (
                  <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-300" title="Destino do anúncio.">
                    {destinationLabel}
                  </Badge>
                )}
                {!creative && <Badge variant="outline">sem snapshot</Badge>}
              </div>
              <p className="text-xs text-muted-foreground truncate max-w-[420px]">
                {creative?.headline || ad.adId}
                {snapshotId ? ` · snapshot ${snapshotId.slice(0, 8)}` : ''}
              </p>
            </div>
          </div>

          <div className="rounded-md border border-border/60 bg-muted/10 p-3 text-[11px] text-muted-foreground">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Resumo rápido</p>
            <div className="mt-2 space-y-1">
              <p>CTR {formatPercent(ad.avgCtr, 2)} · CPC {formatCurrency(cpc)} · CPM {formatCurrency(ad.avgCpm)}</p>
              <p>
                {objectiveKey === 'lead'
                  ? `Leads ${formatOptionalNumber(conversions)}`
                  : objectiveKey === 'conversion'
                    ? `Conversões ${formatOptionalNumber(conversions)}`
                    : `Conversões ${formatOptionalNumber(ad.totalConversions)}`}
                {' '}· Conv {formatPercent(conversionRate)}
              </p>
              {objectiveKey === 'messages' && (
                <p>Conversas {formatOptionalNumber(ad.totalMessagingConversations)} · Cliques→Conversas {formatPercent(conversationRate)}</p>
              )}
            </div>
          </div>

          {snapshotId && (
            <Button
              variant="outline"
              size="sm"
              className="w-fit"
              onClick={() => onToggleExpanded(rowKey)}
            >
              {isExpanded ? (
                <>
                  Ocultar detalhes <ChevronUp className="ml-2 h-4 w-4" />
                </>
              ) : (
                <>
                  Ver detalhes <ChevronDown className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          )}
        </div>

        <CreativePyramidSection pyramidLayers={pyramidLayers} />

        <CreativeMetricGrid
          ad={ad}
          clicks={clicks}
          columns={columns}
          conversions={conversions}
          leads={leads}
          metricValues={metricValues}
          objectiveKey={objectiveKey}
          purchases={purchases}
        />
      </div>

      {isExpanded && snapshotId ? (
        <CreativeExpandedDetails
          ad={ad}
          libraryReasons={libraryEntry?.reasons}
          snapshotId={snapshotId}
          view={creativeView}
        />
      ) : null}
    </div>
  );
}
