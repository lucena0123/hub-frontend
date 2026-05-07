import { rateColor } from '@/components/performance/creative-performance-table/formatters';
import type { AdCreativeMetric } from '@/types';
import type { MetricColumn, ObjectiveKey } from './columns';
import { buildMetricTooltip } from './tooltips';

interface CreativeMetricGridProps {
  ad: AdCreativeMetric;
  clicks: number;
  columns: MetricColumn[];
  conversions: number;
  leads: number;
  metricValues: Record<string, string>;
  objectiveKey: ObjectiveKey;
  purchases: number;
}

export function CreativeMetricGrid({
  ad,
  clicks,
  columns,
  conversions,
  leads,
  metricValues,
  objectiveKey,
  purchases,
}: CreativeMetricGridProps) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 text-xs">
        {columns.map((column) => {
          const value = metricValues[column.key] ?? '—';
          const tooltip = buildMetricTooltip({
            key: column.key,
            spend: ad.totalSpend,
            impressions: ad.totalImpressions,
            clicks,
            linkClicks: ad.totalLinkClicks,
            lpViews: ad.totalLandingPageViews,
            conversations: ad.totalMessagingConversations,
            leads,
            purchases,
            conversions,
            objectiveKey,
            video3s: ad.video3secViews,
            thruplay: ad.videoThruplay,
            reach: ad.totalReach,
          });

          return (
            <div key={column.key} className="relative group rounded-md border border-border/60 p-3 bg-muted/20">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{column.label}</p>
              <p className="text-sm font-semibold">
                {column.key === 'hookRate' ? <span className={rateColor(ad.hookRate, 'hook')}>{value}</span> : null}
                {column.key === 'holdRate' ? <span className={rateColor(ad.holdRate, 'hold')}>{value}</span> : null}
                {column.key !== 'hookRate' && column.key !== 'holdRate' ? value : null}
              </p>
              {tooltip ? (
                <div className="pointer-events-none absolute left-0 top-full z-20 mt-2 w-64 rounded-md border border-border/60 bg-background/95 p-2 text-[11px] text-muted-foreground opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{tooltip.source}</p>
                  <p className="mt-1">{tooltip.formula}</p>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
