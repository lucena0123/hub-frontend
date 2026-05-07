import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/components/performance/creative-library/formatters';
import type { AdCreativeMetric } from '@/types';
import { DetailRow } from './detail-row';
import { formatOptionalNumber, formatPercent } from './helpers';

export type CreativeReason = {
  code: string;
  message: string;
  severity: string;
};

interface CreativeDiagnosticsSectionProps {
  ad: AdCreativeMetric;
  conversionRate: number;
  conversions: number;
  cpc: number;
  libraryReasons?: CreativeReason[];
}

export function CreativeDiagnosticsSection({
  ad,
  conversionRate,
  conversions,
  cpc,
  libraryReasons,
}: CreativeDiagnosticsSectionProps) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Diagnóstico</p>
      <div className="mt-2 grid gap-3 md:grid-cols-2">
        <div className="rounded-md border border-border/60 bg-muted/20 p-3 text-xs">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Status & motivos</p>
          {libraryReasons && libraryReasons.length > 0 ? (
            <div className="mt-2 space-y-1">
              {libraryReasons.slice(0, 3).map((reason) => (
                <div key={reason.code} className="flex flex-wrap items-start gap-2">
                  <Badge
                    variant="outline"
                    className={
                      reason.severity === 'critical'
                        ? 'bg-rose-100 text-rose-800 border-rose-200'
                        : reason.severity === 'warning'
                          ? 'bg-amber-100 text-amber-900 border-amber-200'
                          : 'bg-primary/10 text-primary border-primary/30'
                    }
                  >
                    {reason.severity}
                  </Badge>
                  <p className="text-sm text-muted-foreground">{reason.message}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">Sem insights automáticos para este criativo.</p>
          )}
        </div>
        <div className="rounded-md border border-border/60 bg-muted/20 p-3 text-xs">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Resumo técnico</p>
          <div className="mt-2 space-y-1">
            <DetailRow label="CTR" value={formatPercent(ad.avgCtr, 2)} />
            <DetailRow label="CPC" value={formatCurrency(cpc)} />
            <DetailRow label="CPM" value={formatCurrency(ad.avgCpm)} />
            <DetailRow label="Conversões" value={formatOptionalNumber(conversions)} />
            <DetailRow label="Conv %" value={formatPercent(conversionRate)} />
          </div>
        </div>
      </div>
    </div>
  );
}
